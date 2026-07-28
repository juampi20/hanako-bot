'use strict';

/**
 * LevelRepository — Function-style data + business logic for levels and rewards.
 *
 * XP formula:  xp = 330(N-1)^2 + 300(N-1)
 * Inverse:     k = floor((-300 + sqrt(90000 + 1320*xp)) / 660), level = max(k + 1, 1)
 */

let pool = null;

function init(p) {
	pool = p;
}

// ── Helpers ──────────────────────────────────────────────────

function getLevelFromXP(xp) {
	if (xp <= 0) {return 1;}
	const k = Math.floor((-300 + Math.sqrt(90000 + 1320 * xp)) / 660);
	return Math.max(k + 1, 1);
}

function getXPForLevel(level) {
	const n = Math.max(level - 1, 0);
	return 330 * n * n + 300 * n;
}

// ── Level data ───────────────────────────────────────────────

async function findByUser(userId, guildId) {
	const res = await pool.query(
		'SELECT * FROM scores WHERE "user" = $1 AND guild = $2',
		[userId, guildId],
	);
	const row = res.rows[0] || null;
	if (row) {
		return {
			id: row.id,
			user: row.user,
			guild: row.guild,
			points: row.points,
			level: getLevelFromXP(row.points),
		};
	}
	return {
		id: `${guildId}-${userId}`,
		user: userId,
		guild: guildId,
		points: 0,
		level: 1,
	};
}

async function upsert(data) {
	const res = await pool.query(
		`INSERT INTO scores (id, "user", guild, points, level)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (id) DO UPDATE SET points = EXCLUDED.points, level = EXCLUDED.level
		 RETURNING *`,
		[data.id, data.user, data.guild, data.points, data.level],
	);
	return res.rows[0];
}

async function getLeaderboard(guildId, limit = 10, offset = 0) {
	const res = await pool.query(
		'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2 OFFSET $3',
		[guildId, limit, offset],
	);
	return res.rows.map((row) => ({
		id: row.id,
		user: row.user,
		guild: row.guild,
		points: row.points,
		level: getLevelFromXP(row.points),
	}));
}

async function getLeaderboardCount(guildId) {
	const res = await pool.query(
		'SELECT COUNT(*)::int AS count FROM scores WHERE guild = $1',
		[guildId],
	);
	return res.rows[0].count;
}

// ── XP mutations ─────────────────────────────────────────────

async function addXP(userId, guildId, amount) {
	if (!amount || amount <= 0) return null;

	const current = await findByUser(userId, guildId);
	const newPoints = current.points + amount;
	const newLevel = getLevelFromXP(newPoints);
	const oldLevel = current.level;

	await upsert({
		id: current.id,
		user: current.user,
		guild: current.guild,
		points: newPoints,
		level: newLevel,
	});

	return {
		id: current.id,
		user: current.user,
		guild: current.guild,
		points: newPoints,
		level: newLevel,
		oldLevel,
	};
}

async function setXP(userId, guildId, xp) {
	if (xp < 0) return null;
	const current = await findByUser(userId, guildId);
	const oldLevel = current.level;
	const newLevel = getLevelFromXP(xp);

	await upsert({
		id: current.id,
		user: current.user,
		guild: current.guild,
		points: xp,
		level: newLevel,
	});

	return { points: xp, level: newLevel, oldLevel };
}

async function setLevel(userId, guildId, level) {
	if (level < 1) return null;
	const minXP = getXPForLevel(level);
	const current = await findByUser(userId, guildId);
	const oldLevel = current.level;

	await upsert({
		id: current.id,
		user: current.user,
		guild: current.guild,
		points: minXP,
		level: level,
	});

	return { points: minXP, level, oldLevel };
}

// ── Reward data ──────────────────────────────────────────────

async function createReward(guildId, level, roleId) {
	const res = await pool.query(
		`INSERT INTO level_rewards (guild_id, level, role_id)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (guild_id, level) DO NOTHING
		 RETURNING *`,
		[guildId, level, roleId],
	);
	return res.rows[0] || null;
}

async function findRewardByGuildAndLevel(guildId, level) {
	const res = await pool.query(
		'SELECT * FROM level_rewards WHERE guild_id = $1 AND level = $2',
		[guildId, level],
	);
	return res.rows[0] || null;
}

async function findRewardById(id) {
	const res = await pool.query(
		'SELECT * FROM level_rewards WHERE id = $1',
		[id],
	);
	return res.rows[0] || null;
}

async function findAllRewardsByGuild(guildId) {
	const res = await pool.query(
		'SELECT * FROM level_rewards WHERE guild_id = $1 ORDER BY level ASC',
		[guildId],
	);
	return res.rows;
}

async function deleteReward(id) {
	const res = await pool.query(
		'DELETE FROM level_rewards WHERE id = $1 RETURNING id',
		[id],
	);
	return { rowCount: res.rowCount };
}

async function verifyRewardOwnership(id, guildId) {
	const result = await findRewardById(id);
	return result ? result.guild_id === guildId : false;
}

async function isDuplicateReward(guildId, level) {
	const existing = await findRewardByGuildAndLevel(guildId, level);
	return !!existing;
}

// ── Discord-side logic (needs guild/member objects) ──────────

async function assignLevelReward(guild, member, level, logger) {
	const log = typeof logger?.debug === 'function' ? (...args) => logger.debug(...args) : console.log;
	log(`[assignLevelReward] called for ${member.id} guild=${guild.id} level=${level}`);

	try {
		const reward = await findRewardByGuildAndLevel(guild.id, level);
		if (!reward) {
			log(`[assignLevelReward] FAIL: no reward found for level ${level}`);
			return null;
		}
		log(`[assignLevelReward] found reward role_id=${reward.role_id}`);

		const role = guild.roles.cache.get(reward.role_id);
		if (!role) {
			log(`[assignLevelReward] FAIL: role ${reward.role_id} not in guild.roles.cache (keys=[${[...guild.roles.cache.keys()].join(',')}])`);
			return null;
		}
		log(`[assignLevelReward] found role "${role.name}"`);

		if (member.roles.cache.has(role.id)) {
			log(`[assignLevelReward] SKIP: member already has role ${role.name}`);
			return null;
		}

		const allRewards = await findAllRewardsByGuild(guild.id);
		const prevRoleIds = allRewards
			.filter(r => r.role_id !== reward.role_id)
			.map(r => r.role_id)
			.filter(id => member.roles.cache.has(id));
		log(`[assignLevelReward] prevRoleIds=[${prevRoleIds.join(',')}]`);

		const botMember = guild.members.me;
		if (!botMember) {
			log('[assignLevelReward] FAIL: guild.members.me is undefined');
			return null;
		}
		log(`[assignLevelReward] botMember=${botMember.id}, highestRolePos=${botMember.roles.highest.comparePositionTo(role)}, hasManageRoles=${botMember.permissions.has('ManageRoles')}`);

		if (botMember.roles.highest.comparePositionTo(role) >= 0 && botMember.permissions.has('ManageRoles')) {
			await member.roles.remove(prevRoleIds);
			await member.roles.add(role.id);
			log(`[assignLevelReward] SUCCESS: assigned role "${role.name}" to ${member.id}`);
			return role.name;
		}

		log(`[assignLevelReward] FAIL: hierarchy/permission blocked (botPos=${botMember.roles.highest.comparePositionTo(role)}, hasPerm=${botMember.permissions.has('ManageRoles')})`);
		return null;
	}
	catch (err) {
		console.error('LevelRepository: assignLevelReward exception', err);
		return null;
	}
}

async function notifyLevelUp(guild, member, level, config) {
	if (!config.levelUpNotify) return;

	try {
		const interval = config.levelUpNotifyInterval || 5;
		const levelReward = await findRewardByGuildAndLevel(guild.id, level);
		if (level % interval !== 0 && !levelReward) {return;}

		const channelId = config.levelUpChannel;
		const targetChannel = channelId
			? await guild.channels.fetch(channelId).catch(() => null)
			: guild.systemChannel;

		if (!targetChannel) {return;}

		let msg = `🎉 ¡${member} subió al nivel **${level}**!`;

		if (levelReward) {
			const role = guild.roles.cache.get(levelReward.role_id);
			if (role) {
				msg += `\n📜 Has recibido el rol **${role.name}**`;
			}
		}

		await targetChannel.send(msg).catch(err => console.error('LevelRepository: notifyLevelUp exception', err));
	}
	catch (err) {
		console.error('LevelRepository: notifyLevelUp exception', err);
	}
}

module.exports = {
	init,
	getLevelFromXP,
	getXPForLevel,
	findByUser,
	upsert,
	getLeaderboard,
	getLeaderboardCount,
	addXP,
	setXP,
	setLevel,
	createReward,
	findRewardByGuildAndLevel,
	findRewardById,
	findAllRewardsByGuild,
	deleteReward,
	verifyRewardOwnership,
	isDuplicateReward,
	assignLevelReward,
	notifyLevelUp,
};

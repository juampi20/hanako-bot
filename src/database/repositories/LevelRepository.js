'use strict';

/**
 * LevelRepository: function-style data + business logic for levels and rewards.
 *
 * XP formula:  xp = 330(N-1)^2 + 300(N-1)
 * Inverse:     k = floor((-300 + sqrt(90000 + 1320*xp)) / 660), level = max(k + 1, 1)
 *
 * Single-guild: scores are keyed by `user` alone and rewards by `level` alone.
 */

let pool = null;

function init(p) {
	pool = p;
}

function getLevelFromXP(xp) {
	if (xp <= 0) {return 1;}
	const k = Math.floor((-300 + Math.sqrt(90000 + 1320 * xp)) / 660);
	return Math.max(k + 1, 1);
}

function getXPForLevel(level) {
	const n = Math.max(level - 1, 0);
	return 330 * n * n + 300 * n;
}

// Level data

async function findByUser(userId) {
	const res = await pool.query(
		'SELECT * FROM scores WHERE "user" = $1',
		[userId],
	);
	const row = res.rows[0] || null;
	if (row) {
		return {
			user: row.user,
			points: row.points,
			level: getLevelFromXP(row.points),
		};
	}
	return {
		user: userId,
		points: 0,
		level: 1,
	};
}

async function upsert(data) {
	const res = await pool.query(
		`INSERT INTO scores ("user", points)
		 VALUES ($1, $2)
		 ON CONFLICT ("user") DO UPDATE SET points = EXCLUDED.points
		 RETURNING *`,
		[data.user, data.points],
	);
	return res.rows[0];
}

async function getLeaderboard(limit = 10, offset = 0) {
	const res = await pool.query(
		'SELECT * FROM scores ORDER BY points DESC LIMIT $1 OFFSET $2',
		[limit, offset],
	);
	return res.rows.map((row) => ({
		user: row.user,
		points: row.points,
		level: getLevelFromXP(row.points),
	}));
}

async function getLeaderboardCount() {
	const res = await pool.query(
		'SELECT COUNT(*)::int AS count FROM scores',
	);
	return res.rows[0].count;
}

// XP mutations

async function addXP(userId, amount) {
	if (!amount || amount <= 0) return null;

	const current = await findByUser(userId);
	const newPoints = current.points + amount;
	const newLevel = getLevelFromXP(newPoints);
	const oldLevel = current.level;

	await upsert({ user: userId, points: newPoints });

	return {
		user: userId,
		points: newPoints,
		level: newLevel,
		oldLevel,
	};
}

async function setXP(userId, xp) {
	if (xp < 0) return null;
	const current = await findByUser(userId);
	const oldLevel = current.level;
	const newLevel = getLevelFromXP(xp);

	await upsert({ user: userId, points: xp });

	return { points: xp, level: newLevel, oldLevel };
}

async function setLevel(userId, level) {
	if (level < 1) return null;
	const minXP = getXPForLevel(level);
	const current = await findByUser(userId);
	const oldLevel = current.level;

	await upsert({ user: userId, points: minXP });

	return { points: minXP, level, oldLevel };
}

// Reward data

async function createReward(level, roleId) {
	const res = await pool.query(
		`INSERT INTO level_rewards (level, role_id)
		 VALUES ($1, $2)
		 ON CONFLICT (level) DO NOTHING
		 RETURNING *`,
		[level, roleId],
	);
	return res.rows[0] || null;
}

async function findRewardByLevel(level) {
	const res = await pool.query(
		'SELECT * FROM level_rewards WHERE level = $1',
		[level],
	);
	return res.rows[0] || null;
}

async function findAllRewards() {
	const res = await pool.query(
		'SELECT * FROM level_rewards ORDER BY level ASC',
	);
	return res.rows;
}

async function deleteReward(level) {
	const res = await pool.query(
		'DELETE FROM level_rewards WHERE level = $1 RETURNING level',
		[level],
	);
	return { rowCount: res.rowCount };
}

async function isDuplicateReward(level) {
	const existing = await findRewardByLevel(level);
	return !!existing;
}

// Discord-side logic (needs guild/member objects)

async function assignLevelReward(guild, member, level, logger) {
	const log = typeof logger?.debug === 'function' ? (...args) => logger.debug(...args) : console.log;
	log(`[assignLevelReward] called for ${member.id} guild=${guild.id} level=${level}`);

	try {
		const reward = await findRewardByLevel(level);
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

		const allRewards = await findAllRewards();
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
		const levelReward = await findRewardByLevel(level);
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

async function onLevelUp(guild, member, result, config, logger) {
	if (!result || result.level <= result.oldLevel) return;
	await assignLevelReward(guild, member, result.level, logger);
	await notifyLevelUp(guild, member, result.level, config);
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
	findRewardByLevel,
	findAllRewards,
	deleteReward,
	isDuplicateReward,
	assignLevelReward,
	notifyLevelUp,
	onLevelUp,
};

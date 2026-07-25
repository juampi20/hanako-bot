'use strict';

/**
 * Formula: XP needed for level N
 *   xp = 330(N-1)^2 + 300(N-1)
 *
 * Inverted to get level from XP:
 *   k = floor((-300 + sqrt(90000 + 3300*xp)) / 660)
 *   level = max(k + 1, 1)
 */
function getLevelFromXP(xp) {
	if (xp <= 0) {return 1;}
	const k = Math.floor((-300 + Math.sqrt(90000 + 1320 * xp)) / 660);
	return Math.max(k + 1, 1);
}

function getXPForLevel(level) {
	const n = Math.max(level - 1, 0);
	return 330 * n * n + 300 * n;
}

let levelRepository;

class LevelService {
	/**
	 * Initialize the repository.
	 * @param {import('./repositories/ILevelRepository')} repository - The LevelRepository instance implementing ILevelRepository.
	 */
	static useRepository(repository) {
		levelRepository = repository;
	}

	/**
	 * Initialize the reward service.
	 * @param {import('./RewardService')} rewardService - The RewardService instance.
	 */
	static useRewardService(rewardService) {
		LevelService.rewardService = rewardService;
	}

	/**
	 * Find a level by user + guild.
	 * Returns a plain object or default if not found.
	 */
	static async findByUser(userId, guildId) {
		if (!levelRepository) throw new Error('LevelRepository not injected.');
		const row = await levelRepository.findByUser(userId, guildId);
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

	/**
	 * Upsert a level row.
	 */
	static async upsert(data) {
		if (!levelRepository) throw new Error('LevelRepository not injected.');
		return await levelRepository.upsert(data);
	}

	/**
	 * Get the top N levels for a guild.
	 */
	static async getLeaderboard(guildId, limit = 10) {
		if (!levelRepository) throw new Error('LevelRepository not injected.');
		const rows = await levelRepository.getLeaderboard(guildId, limit);
		return rows.map((row) => ({
			id: row.id,
			user: row.user,
			guild: row.guild,
			points: row.points,
			level: getLevelFromXP(row.points),
		}));
	}

	/**
	 * Add XP to a user's level and recalculate level.
	 * Returns the updated level object with oldLevel, or null if amount is invalid.
	 */
	static async addXP(userId, guildId, amount) {
		if (!amount || amount <= 0) return null;

		const current = await this.findByUser(userId, guildId);
		const newPoints = current.points + amount;
		const newLevel = getLevelFromXP(newPoints);
		const oldLevel = current.level;

		await this.upsert({
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

	/** Set XP directly, recalculate level. Can go up or down. */
	static async setXP(userId, guildId, xp) {
		if (xp < 0) return null;
		const current = await this.findByUser(userId, guildId);
		const oldLevel = current.level;
		const newLevel = getLevelFromXP(xp);

		await this.upsert({
			id: current.id,
			user: current.user,
			guild: current.guild,
			points: xp,
			level: newLevel,
		});

		return { points: xp, level: newLevel, oldLevel };
	}

	/** Set level directly, compute minimum XP for that level. */
	static async setLevel(userId, guildId, level) {
		if (level < 1) return null;
		const minXP = getXPForLevel(level);
		const current = await this.findByUser(userId, guildId);
		const oldLevel = current.level;

		await this.upsert({
			id: current.id,
			user: current.user,
			guild: current.guild,
			points: minXP,
			level: level,
		});

		return { points: minXP, level, oldLevel };
	}

	/**
	 * Assign a level reward role to a member.
	 * @param {Object} guild - Discord guild object.
	 * @param {Object} member - Discord member object.
	 * @param {number} level - Target level.
	 * @returns {Promise<string|null>} role name or null.
	 */
	static async assignLevelReward(guild, member, level) {
		if (!LevelService.rewardService) {
			console.error('LevelService: reward service not configured for assignLevelReward');
			return null;
		}
		try {
			const reward = await LevelService.rewardService.findByGuildAndLevel(guild.id, level);
			if (!reward) {
				return null;
			}

			const role = guild.roles.cache.get(reward.role_id);
			if (!role) {
				return null;
			}

			if (member.roles.cache.has(role.id)) {
				return null;
			}

			// Remove previous reward roles (mutually exclusive per guild)
			const allRewards = await LevelService.rewardService.findAllByGuild(guild.id);
			const prevRoleIds = allRewards
				.filter(r => r.role_id !== reward.role_id)
				.map(r => r.role_id)
				.filter(id => member.roles.cache.has(id));

			const botMember = guild.members.me;
			if (botMember.roles.highest.comparePositionTo(role) >= 0 && botMember.permissions.has('ManageRoles')) {
				await member.roles.remove(prevRoleIds);
				await member.roles.add(role.id);
				return role.name;
			}

			console.warn('LevelService: hierarchy/permission blocked level reward assignment', 'warn');
			return null;
		}
		catch (err) {
			console.error('LevelService: assignLevelReward exception', err);
			return null;
		}
	}

	/**
	 * Send level-up notification.
	 * @param {Object} guild - Discord guild object.
	 * @param {Object} member - Discord member object.
	 * @param {number} level - Target level.
	 * @param {Object} config - Bot configuration (levelUpNotify, levelUpNotifyInterval, levelUpChannel).
	 * @returns {Promise<void>} Resolves when notification sent or skipped.
	 */
	static async notifyLevelUp(guild, member, level, config) {
		if (!config.levelUpNotify) return;

		try {
			const interval = config.levelUpNotifyInterval || 5;
			const levelReward = await LevelService.rewardService?.findByGuildAndLevel(guild.id, level);
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

			await targetChannel.send(msg).catch(err => console.error('LevelService: notifyLevelUp exception', err));
		}
		catch (err) {
			console.error('LevelService: notifyLevelUp exception', err);
		}
	}

	// ── Compatibility aliases ────────────────────────────
	// These match the method names used by existing commands.

	/** Alias for findByUser — used by rank command */
	static async getScore(userId, guildId) {
		return this.findByUser(userId, guildId);
	}

	/** Expose formula — returns minimum XP for a given level */
	static getXPForLevel(level) {
		return getXPForLevel(level);
	}

	/** Expose inverse formula — used internally and by tests */
	static getLevelFromXP(xp) {
		return getLevelFromXP(xp);
	}
}

module.exports = LevelService;
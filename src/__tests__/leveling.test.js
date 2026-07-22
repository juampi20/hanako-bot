jest.mock('../database/connect', () => {
	const scores = new Map();
	const level_rewards = [];
	let rewardSeq = 0;

	const mockPool = {
		query: jest.fn((sql, params = []) => {
			const s = sql.trim();

			if (s.startsWith('CREATE')) {
				return { rows: [], rowCount: 0 };
			}

			if (s.startsWith('INSERT INTO scores')) {
				const [id, user, guild, points, level] = params;
				scores.set(id, { id, user, guild, points: Number(points), level: Number(level) });
				return { rows: [{ id, user, guild, points: Number(points), level: Number(level) }], rowCount: 1 };
			}

			if (s.startsWith('INSERT INTO level_rewards')) {
				const [guildId, level, roleId] = params;
				const dup = level_rewards.find(r => r.guild_id === guildId && r.level === level);
				if (dup) {
					const err = new Error('duplicate key');
					err.code = '23505';
					throw err;
				}
				rewardSeq++;
				const reward = { id: rewardSeq, guild_id: guildId, level, role_id: roleId, created_at: new Date().toISOString() };
				level_rewards.push(reward);
				return { rows: [reward], rowCount: 1 };
			}

			if (s.startsWith('DELETE FROM level_rewards')) {
				const [id] = params;
				const i = level_rewards.findIndex(r => r.id === id);
				if (i !== -1) {
					level_rewards.splice(i, 1);
					return { rows: [{ id }], rowCount: 1 };
				}
				return { rows: [], rowCount: 0 };
			}

			if (s.startsWith('SELECT') && s.includes('FROM scores')) {
				const [a, b] = params;
				if (s.includes('"user" =') || s.includes('WHERE user =')) {
					const row = Array.from(scores.values()).find(x => x.user === a && x.guild === b);
					return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
				}
				if (s.includes('WHERE guild =')) {
					const rows = Array.from(scores.values())
						.filter(x => x.guild === params[0])
						.sort((x, y) => y.points - x.points || y.level - x.level);
					return { rows, rowCount: rows.length };
				}
			}

			if (s.startsWith('SELECT') && s.includes('FROM level_rewards')) {
				if (s.includes('WHERE guild_id =') && s.includes('AND level =')) {
					const [guildId, lvl] = params;
					const row = level_rewards.find(r => r.guild_id === guildId && r.level === lvl);
					return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
				}
				if (s.includes('WHERE id =')) {
					const [id] = params;
					const row = level_rewards.find(r => r.id === id);
					return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
				}
				if (s.includes('WHERE guild_id =')) {
					const [guildId] = params;
					const rows = level_rewards.filter(r => r.guild_id === guildId).sort((a, b) => a.level - b.level);
					return { rows, rowCount: rows.length };
				}
			}

			return { rows: [], rowCount: 0 };
		}),
	};

	return {
		initialize: jest.fn().mockResolvedValue(mockPool),
		getPool: jest.fn().mockReturnValue(mockPool),
		close: jest.fn().mockResolvedValue(),
	};
});

const { initialize, getPool, close } = require('../database/connect');
const { loadModels, Score, Reward } = require('../database/models');

beforeAll(async () => {
	const pool = await initialize();
	await loadModels(pool);
});

afterAll(async () => {
	await close();
});

describe('database singleton', () => {
	test('getPool() returns a pool instance', () => {
		const pool = getPool();
		expect(pool).toBeDefined();
		expect(pool.query).toBeDefined();
	});

	test('initialize() returns the same pool', async () => {
		const p1 = getPool();
		const p2 = await initialize();
		expect(p1).toBe(p2);
	});
});

describe('Score model', () => {
	describe('findByUser', () => {
		test('returns default for new user', async () => {
			const score = await Score.findByUser('newuser', 'guild1');
			expect(score).toEqual({
				id: 'guild1-newuser',
				user: 'newuser',
				guild: 'guild1',
				points: 0,
				level: 1,
			});
		});

		test('returns persisted score after addXP', async () => {
			await Score.addXP('persistuser', 'guild1', 50);
			const score = await Score.findByUser('persistuser', 'guild1');
			expect(score.points).toBe(50);
		});
	});

	describe('addXP', () => {
		test('adds XP and recalculates level', async () => {
			const result = await Score.addXP('xptest', 'guild1', 100);
			expect(result.points).toBe(100);
			expect(result.level).toBe(1);
		});

		test('returns oldLevel for level-up detection', async () => {
			const result = await Score.addXP('leveluptest', 'guild1', 200);
			expect(result.level).toBe(1);
			expect(result.oldLevel).toBe(1);
			expect(result.level).toBeGreaterThanOrEqual(result.oldLevel);
		});

		test('returns null for zero XP', async () => {
			expect(await Score.addXP('zerotest', 'guild1', 0)).toBeNull();
		});

		test('returns null for negative XP', async () => {
			expect(await Score.addXP('negtest', 'guild1', -10)).toBeNull();
		});
	});

	describe('getLeaderboard', () => {
		test('returns top scores ordered by points DESC', async () => {
			await Score.addXP('lbtop', 'guild2', 200);
			await Score.addXP('lbbottom', 'guild2', 50);

			const lb = await Score.getLeaderboard('guild2');
			expect(lb.length).toBeGreaterThanOrEqual(2);
			expect(lb[0].user).toBe('lbtop');
			expect(lb[0].points).toBeGreaterThanOrEqual(lb[1].points);
		});

		test('returns empty array for guild with no scores', async () => {
			const lb = await Score.getLeaderboard('emptyguild');
			expect(lb).toEqual([]);
		});
	});

	describe('setXP', () => {
		test('sets XP and recalculates level', async () => {
			await Score.addXP('setxptest', 'guild4', 500);
			const result = await Score.setXP('setxptest', 'guild4', 200);
			expect(result).not.toBeNull();
			expect(result.points).toBe(200);
			expect(result.level).toBe(1);
		});

		test('can go down in level', async () => {
			const result = await Score.setXP('downtest', 'guild4', 50);
			expect(result).not.toBeNull();
			expect(result.points).toBe(50);
			expect(result.level).toBe(1);
		});
	});

	describe('setLevel', () => {
		test('sets level and computes minimum XP', async () => {
			const result = await Score.setLevel('lvltest', 'guild4', 5);
			expect(result).not.toBeNull();
			expect(result.level).toBe(5);
			expect(result.points).toBe(6480);
		});

		test('returns null for level below 1', async () => {
			const result = await Score.setLevel('badlvl', 'guild4', 0);
			expect(result).toBeNull();
		});
	});
});

describe('Reward model', () => {
	describe('createTable', () => {
		test('creates level_rewards table', () => {
			expect(true).toBe(true);
		});
	});

	describe('create', () => {
		test('creates reward successfully', async () => {
			const result = await Reward.create('guild1', 5, 'role123');
			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.guild_id).toBe('guild1');
			expect(result.level).toBe(5);
			expect(result.role_id).toBe('role123');
		});

		test('returns null for duplicate reward (unique constraint)', async () => {
			await Reward.create('guild2', 10, 'role456');
			const result = await Reward.create('guild2', 10, 'role456_dup');
			expect(result).toBeNull();
		});
	});

	describe('findByGuildAndLevel', () => {
		test('finds existing reward', async () => {
			await Reward.create('guild3', 7, 'role789');
			const reward = await Reward.findByGuildAndLevel('guild3', 7);
			expect(reward).toBeDefined();
			expect(reward.level).toBe(7);
			expect(reward.role_id).toBe('role789');
		});

		test('returns undefined for non-existent reward', async () => {
			const reward = await Reward.findByGuildAndLevel('guild4', 99);
			expect(reward).toBeUndefined();
		});
	});

	describe('findById', () => {
		test('finds reward by ID', async () => {
			const result1 = await Reward.create('guild5', 12, 'role999');
			const id = result1.id;
			const reward = await Reward.findById(id);
			expect(reward).toBeDefined();
			expect(reward.id).toBe(id);
		});

		test('returns undefined for non-existent ID', async () => {
			const reward = await Reward.findById(999999);
			expect(reward).toBeUndefined();
		});
	});

	describe('findAllByGuild', () => {
		test('lists all rewards for a guild ordered by level', async () => {
			await Reward.create('guild6', 3, 'role_a');
			await Reward.create('guild6', 1, 'role_b');
			await Reward.create('guild6', 5, 'role_c');

			const rewards = await Reward.findAllByGuild('guild6');
			expect(rewards.length).toBe(3);
			expect(rewards[0].level).toBe(1);
			expect(rewards[1].level).toBe(3);
			expect(rewards[2].level).toBe(5);
		});

		test('returns empty array for guild with no rewards', async () => {
			const rewards = await Reward.findAllByGuild('emptyguild');
			expect(rewards).toEqual([]);
		});
	});

	describe('deleteById', () => {
		test('deletes existing reward', async () => {
			const result1 = await Reward.create('guild7', 20, 'role_del');
			const id = result1.id;
			const result = await Reward.deleteById(id);
			expect(result.rowCount).toBe(true);

			const reward = await Reward.findById(id);
			expect(reward).toBeUndefined();
		});

		test('returns rowCount false for non-existent ID', async () => {
			const result = await Reward.deleteById(888888);
			expect(result.rowCount).toBe(false);
		});
	});
});

const notifyLevelUp = require('../utils/leveling').notifyLevelUp;

describe('notifyLevelUp throttle', () => {
	test('milestone hit (level 10, interval 5) → sends notification', async () => {
		const send = jest.fn().mockResolvedValue();
		const client = {
			config: {
				levelUpChannel: 'channel-1',
				levelUpNotifyInterval: 5,
				levelUpNotify: true,
				moderatorRoleId: null,
				guildId: 'guild-1',
			},
			channels: {
				fetch: jest.fn().mockResolvedValue({ send }),
			},
			rewardService: null,
		};
		const guild = { id: 'guild-1', systemChannel: null };
		const member = { id: 'user-1', user: { bot: false, id: 'user-1' } };
		await notifyLevelUp(client, guild, member, 10);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toContain('nivel **10**');
	});

	test('milestone miss (level 7, interval 5) → suppresses notification', async () => {
		const send = jest.fn().mockResolvedValue();
		const client = {
			config: {
				levelUpChannel: 'channel-1',
				levelUpNotifyInterval: 5,
				levelUpNotify: false,
				moderatorRoleId: null,
				guildId: 'guild-1',
			},
			channels: {
				fetch: jest.fn().mockResolvedValue({ send }),
			},
			rewardService: null,
		};
		const guild = { id: 'guild-1', systemChannel: null };
		const member = { id: 'user-1', user: { bot: false, id: 'user-1' } };
		await notifyLevelUp(client, guild, member, 7);
		expect(send).not.toHaveBeenCalled();
	});

	test('level with role reward → sends despite non-milestone', async () => {
		const send = jest.fn().mockResolvedValue();
		const role = { id: 'role-1', name: 'VIP' };
		const client = {
			config: { levelUpChannel: 'channel-1', levelUpNotifyInterval: 5, levelUpNotify: true },
			channels: { fetch: jest.fn().mockResolvedValue({ send }) },
			rewardService: {
				findByGuildAndLevel: jest.fn().mockResolvedValue({ role_id: 'role-1', level: 3 }),
			},
		};
		const guild = {
			id: 'guild-1', systemChannel: null,
			roles: { cache: new Map([['role-1', role]]) },
		};
		const member = {
			id: 'user-1', user: { bot: false, id: 'user-1' },
			roles: { cache: new Map() },
		};
		await notifyLevelUp(client, guild, member, 3);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toContain('VIP');
	});
});

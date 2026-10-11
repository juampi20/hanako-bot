jest.mock('../database/connect', () => {
	const scores = new Map();
	const level_rewards = [];

	const mockPool = {
		query: jest.fn((sql, params = []) => {
			const s = sql.replace(/\s+/g, ' ').trim();

			if (s.startsWith('CREATE')) {
				return { rows: [], rowCount: 0 };
			}

			if (s.startsWith('INSERT INTO scores')) {
				const [user, points] = params;
				const row = { user, points: Number(points) };
				scores.set(user, row);
				return { rows: [row], rowCount: 1 };
			}

			if (s.startsWith('INSERT INTO level_rewards')) {
				const [level, roleId] = params;
				if (level_rewards.some(r => r.level === level)) {
					return { rows: [], rowCount: 0 };
				}
				const reward = { level, role_id: roleId, created_at: new Date().toISOString() };
				level_rewards.push(reward);
				return { rows: [reward], rowCount: 1 };
			}

			if (s.startsWith('DELETE FROM level_rewards')) {
				const [level] = params;
				const i = level_rewards.findIndex(r => r.level === level);
				if (i !== -1) {
					level_rewards.splice(i, 1);
					return { rows: [{ level }], rowCount: 1 };
				}
				return { rows: [], rowCount: 0 };
			}

			if (s.startsWith('SELECT') && s.includes('FROM scores')) {
				if (s.includes('COUNT(*)')) {
					return { rows: [{ count: scores.size }], rowCount: 1 };
				}
				if (s.includes('WHERE "user" = $1')) {
					const [user] = params;
					const row = scores.get(user);
					return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
				}
				if (s.includes('ORDER BY points DESC')) {
					const rows = Array.from(scores.values()).sort((a, b) => b.points - a.points);
					const [limit, offset] = params;
					return { rows: rows.slice(offset, offset + limit), rowCount: rows.length };
				}
			}

			if (s.startsWith('SELECT') && s.includes('FROM level_rewards')) {
				if (s.includes('WHERE level = $1')) {
					const [level] = params;
					const row = level_rewards.find(r => r.level === level);
					return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
				}
				if (s.includes('ORDER BY level ASC')) {
					const rows = [...level_rewards].sort((a, b) => a.level - b.level);
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

const { initialize, close } = require('../database/connect');
const LevelRepository = require('../database/repositories/LevelRepository');

beforeAll(async () => {
	const pool = await initialize();
	LevelRepository.init(pool);
});

afterAll(async () => {
	await close();
});

describe('LevelRepository', () => {
	describe('findByUser', () => {
		test('returns default for new user', async () => {
			const score = await LevelRepository.findByUser('newuser');
			expect(score).toEqual({
				user: 'newuser',
				points: 0,
				level: 1,
			});
		});

		test('returns persisted score after addXP', async () => {
			await LevelRepository.addXP('persistuser', 50);
			const score = await LevelRepository.findByUser('persistuser');
			expect(score.points).toBe(50);
		});
	});

	describe('addXP', () => {
		test('adds XP and recalculates level', async () => {
			const result = await LevelRepository.addXP('xptest', 100);
			expect(result.points).toBe(100);
			expect(result.level).toBe(1);
		});

		test('returns oldLevel for level-up detection', async () => {
			const result = await LevelRepository.addXP('leveluptest', 200);
			expect(result.level).toBe(1);
			expect(result.oldLevel).toBe(1);
			expect(result.level).toBeGreaterThanOrEqual(result.oldLevel);
		});

		test('returns null for zero XP', async () => {
			expect(await LevelRepository.addXP('zerotest', 0)).toBeNull();
		});

		test('returns null for negative XP', async () => {
			expect(await LevelRepository.addXP('negtest', -10)).toBeNull();
		});
	});

	describe('getLeaderboard', () => {
		test('returns top scores ordered by points DESC', async () => {
			await LevelRepository.addXP('lbtop', 5000);
			await LevelRepository.addXP('lbbottom', 40);

			const lb = await LevelRepository.getLeaderboard();
			expect(lb.length).toBeGreaterThanOrEqual(2);
			expect(lb[0].user).toBe('lbtop');
			expect(lb[0].points).toBeGreaterThanOrEqual(lb[1].points);
		});

		test('respects limit and offset', async () => {
			await LevelRepository.addXP('lbpage-a', 400);
			await LevelRepository.addXP('lbpage-b', 300);

			const first = await LevelRepository.getLeaderboard(2, 0);
			const second = await LevelRepository.getLeaderboard(2, 2);

			expect(first).toHaveLength(2);
			expect(second.length).toBeGreaterThanOrEqual(1);

			const firstUsers = first.map(entry => entry.user);
			for (const entry of second) {
				expect(firstUsers).not.toContain(entry.user);
			}
		});
	});

	describe('getLeaderboardCount', () => {
		test('counts all persisted scores', async () => {
			const count = await LevelRepository.getLeaderboardCount();
			const all = await LevelRepository.getLeaderboard(1000, 0);
			expect(count).toBe(all.length);
		});
	});

	describe('setXP', () => {
		test('sets XP and recalculates level', async () => {
			await LevelRepository.addXP('setxptest', 500);
			const result = await LevelRepository.setXP('setxptest', 200);
			expect(result).not.toBeNull();
			expect(result.points).toBe(200);
			expect(result.level).toBe(1);
		});

		test('can go down in level', async () => {
			const result = await LevelRepository.setXP('downtest', 50);
			expect(result).not.toBeNull();
			expect(result.points).toBe(50);
			expect(result.level).toBe(1);
		});
	});

	describe('setLevel', () => {
		test('sets level and computes minimum XP', async () => {
			const result = await LevelRepository.setLevel('lvltest', 5);
			expect(result).not.toBeNull();
			expect(result.level).toBe(5);
			expect(result.points).toBe(6480);
		});

		test('returns null for level below 1', async () => {
			const result = await LevelRepository.setLevel('badlvl', 0);
			expect(result).toBeNull();
		});
	});

	describe('Reward operations', () => {
		describe('createReward', () => {
			test('creates reward successfully', async () => {
				const result = await LevelRepository.createReward(101, 'role123');
				expect(result).toBeDefined();
				expect(result.level).toBe(101);
				expect(result.role_id).toBe('role123');
			});

			test('returns null for duplicate reward', async () => {
				await LevelRepository.createReward(102, 'role456');
				const result = await LevelRepository.createReward(102, 'role456_dup');
				expect(result).toBeNull();
			});
		});

		describe('findRewardByLevel', () => {
			test('finds existing reward', async () => {
				await LevelRepository.createReward(103, 'role789');
				const reward = await LevelRepository.findRewardByLevel(103);
				expect(reward).toBeDefined();
				expect(reward.level).toBe(103);
				expect(reward.role_id).toBe('role789');
			});

			test('returns null for non-existent reward', async () => {
				const reward = await LevelRepository.findRewardByLevel(999);
				expect(reward).toBeNull();
			});
		});

		describe('findAllRewards', () => {
			test('lists all rewards ordered by level ascending', async () => {
				await LevelRepository.createReward(106, 'role_c');
				await LevelRepository.createReward(105, 'role_b');

				const rewards = await LevelRepository.findAllRewards();
				const levels = [];
				for (const reward of rewards) {
					levels.push(reward.level);
				}
				expect(levels).toEqual([101, 102, 103, 105, 106]);
			});
		});

		describe('deleteReward', () => {
			test('deletes existing reward', async () => {
				await LevelRepository.createReward(107, 'role_del');
				const result = await LevelRepository.deleteReward(107);
				expect(result.rowCount).toBe(1);

				const reward = await LevelRepository.findRewardByLevel(107);
				expect(reward).toBeNull();
			});

			test('returns rowCount 0 for non-existent level', async () => {
				const result = await LevelRepository.deleteReward(888);
				expect(result.rowCount).toBe(0);
			});
		});
	});
});

describe('notifyLevelUp', () => {
	test('sends to levelUpChannel when configured', async () => {
		const send = jest.fn().mockResolvedValue();
		const config = { levelUpChannel: 'channel-1', levelUpNotify: true, levelUpNotifyInterval: 5, moderatorRoleId: null, guildId: 'guild-1' };
		const guild = { id: 'guild-1', systemChannel: null, roles: { cache: new Map() }, channels: { fetch: jest.fn().mockResolvedValue({ send }) } };
		const member = { id: 'user-1', user: { bot: false, id: 'user-1' } };
		await LevelRepository.notifyLevelUp(guild, member, 5, config);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toContain('nivel **5**');
	});

	test('milestone hit (level 10, interval 5) → sends notification', async () => {
		const send = jest.fn().mockResolvedValue();
		const config = { levelUpChannel: 'channel-1', levelUpNotifyInterval: 5, levelUpNotify: true, moderatorRoleId: null, guildId: 'guild-1' };
		const guild = { id: 'guild-1', systemChannel: null, roles: { cache: new Map() }, channels: { fetch: jest.fn().mockResolvedValue({ send }) } };
		const member = { id: 'user-1', user: { bot: false, id: 'user-1' } };
		await LevelRepository.notifyLevelUp(guild, member, 10, config);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toContain('nivel **10**');
	});

	test('milestone miss (level 7, interval 5, notify off) → suppresses notification', async () => {
		const send = jest.fn().mockResolvedValue();
		const config = { levelUpChannel: 'channel-1', levelUpNotifyInterval: 5, levelUpNotify: false, moderatorRoleId: null, guildId: 'guild-1' };
		const guild = { id: 'guild-1', systemChannel: null, roles: { cache: new Map() }, channels: { fetch: jest.fn().mockResolvedValue({ send }) } };
		const member = { id: 'user-1', user: { bot: false, id: 'user-1' } };
		await LevelRepository.notifyLevelUp(guild, member, 7, config);
		expect(send).not.toHaveBeenCalled();
	});

	test('level with role reward → sends despite non-milestone', async () => {
		const send = jest.fn().mockResolvedValue();
		const role = { id: 'role-1', name: 'VIP' };
		const config = { levelUpChannel: 'channel-1', levelUpNotifyInterval: 5, levelUpNotify: true };
		const guild = {
			id: 'guild-1', systemChannel: null,
			roles: { cache: new Map([['role-1', role]]) },
			channels: { fetch: jest.fn().mockResolvedValue({ send }) },
		};
		const member = { id: 'user-1', user: { bot: false, id: 'user-1' }, roles: { cache: new Map() } };
		// Pre-create the reward so notifyLevelUp finds it in the mock DB
		await LevelRepository.createReward(13, 'role-1');
		await LevelRepository.notifyLevelUp(guild, member, 13, config);
		expect(send).toHaveBeenCalled();
		expect(send.mock.calls[0][0]).toContain('VIP');
	});
});

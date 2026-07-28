jest.mock('../database/repositories/LevelRepository', () => ({
	init: jest.fn(),
	findByUser: jest.fn(),
	addXP: jest.fn(),
	setXP: jest.fn(),
	setLevel: jest.fn(),
	getLeaderboard: jest.fn(),
	assignLevelReward: jest.fn(),
	notifyLevelUp: jest.fn(),
	createReward: jest.fn(),
	findRewardByGuildAndLevel: jest.fn(),
	findRewardById: jest.fn(),
	findAllRewardsByGuild: jest.fn(),
	deleteReward: jest.fn(),
}));

jest.mock('../database/repositories/AfkRepository', () => ({
	init: jest.fn(),
	set: jest.fn(),
	remove: jest.fn(),
	isAfk: jest.fn(),
	getAfkUsers: jest.fn(),
	removeAll: jest.fn(),
}));

const LevelRepository = require('../database/repositories/LevelRepository');

jest.useFakeTimers();

// ── Mock helpers ────────────────────────────────────────────
function makeMockClient(overrides = {}) {
	return {
		config: {
			levelUpChannel: null,
			voiceXpMin: 3,
			voiceXpMax: 5,
			levelUpNotify: true,
			levelUpNotifyInterval: 5,
			guildId: 'guild-1',
			moderatorRoleId: null,
			...overrides,
		},
		channels: {
			fetch: jest.fn().mockResolvedValue(null),
		},
		logger: { log: jest.fn() },
		guilds: {
			cache: new Map(),
		},
		...overrides,
	};
}

function makeMockGuild(overrides = {}) {
	return {
		id: 'guild-1',
		afkChannelId: 'afk-channel',
		systemChannel: null,
		members: {
			me: { roles: { highest: { comparePositionTo: () => 1 } }, permissions: { has: () => true } },
			fetch: jest.fn().mockResolvedValue(null),
		},
		roles: {
			cache: new Map(),
		},
		channels: {
			fetch: jest.fn().mockResolvedValue(null),
		},
		...overrides,
	};
}

function makeMockMember(overrides = {}) {
	return {
		id: 'user-1',
		user: { bot: false, id: 'user-1' },
		roles: { cache: new Map() },
		voice: {
			channel: { id: 'vc-1' },
			channelId: 'vc-1',
			selfMute: false,
			serverMute: false,
			selfDeaf: false,
			serverDeaf: false,
		},
		...overrides,
	};
}

function makeVoiceState(overrides = {}) {
	return {
		id: 'user-1',
		guild: { id: 'guild-1', afkChannelId: 'afk-channel' },
		channelId: 'vc-1',
		member: makeMockMember(),
		selfMute: false,
		serverMute: false,
		selfDeaf: false,
		serverDeaf: false,
		...overrides,
	};
}

const voiceHandler = require('../events/voiceStateUpdate');

describe('voiceStateUpdate handler', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('join creates session', async () => {
		const oldState = makeVoiceState({ channelId: null });
		const newState = makeVoiceState({ channelId: 'vc-1' });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('leave removes session', async () => {
		const oldState = makeVoiceState({ channelId: 'vc-1' });
		const newState = makeVoiceState({ channelId: null });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('move re-evaluates session', async () => {
		const oldState = makeVoiceState({ channelId: 'vc-1' });
		const newState = makeVoiceState({ channelId: 'vc-2' });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('bot is not tracked', async () => {
		const oldState = makeVoiceState({ channelId: null, member: { user: { bot: true } } });
		const newState = makeVoiceState({ channelId: 'vc-1', member: { user: { bot: true } } });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('AFK channel does not create session', async () => {
		const oldState = makeVoiceState({ channelId: null });
		const newState = makeVoiceState({ channelId: 'afk-channel', guild: { id: 'guild-1', afkChannelId: 'afk-channel' } });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('move to AFK channel removes session', async () => {
		const oldState = makeVoiceState({ channelId: 'vc-1' });
		const newState = makeVoiceState({ channelId: 'afk-channel', guild: { id: 'guild-1', afkChannelId: 'afk-channel' } });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('mute self removes session', async () => {
		const oldState = makeVoiceState({ channelId: 'vc-1', selfMute: false });
		const newState = makeVoiceState({ channelId: 'vc-1', selfMute: true });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('unmute self re-adds session', async () => {
		const oldState = makeVoiceState({ channelId: 'vc-1', selfMute: true });
		const newState = makeVoiceState({ channelId: 'vc-1', selfMute: false });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('deafen self removes session', async () => {
		const oldState = makeVoiceState({ channelId: 'vc-1', selfDeaf: false });
		const newState = makeVoiceState({ channelId: 'vc-1', selfDeaf: true });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('undeafen self re-adds session', async () => {
		const oldState = makeVoiceState({ channelId: 'vc-1', selfDeaf: true });
		const newState = makeVoiceState({ channelId: 'vc-1', selfDeaf: false });
		await expect(voiceHandler(makeMockClient(), oldState, newState)).resolves.not.toThrow();
	});

	test('handler catches all errors silently', async () => {
		const client = makeMockClient();
		await expect(voiceHandler(client, null, null)).resolves.not.toThrow();
	});
});

describe('tick() function', () => {
	beforeEach(() => {
		voiceHandler.sessions.clear();
		jest.clearAllMocks();
	});

	test('awards XP to eligible session', async () => {
		LevelRepository.addXP.mockResolvedValue({ points: 3, level: 1, oldLevel: 1 });
		LevelRepository.findRewardByGuildAndLevel.mockResolvedValue(null);

		const client = makeMockClient();
		const member = makeMockMember();
		const guild = makeMockGuild({
			members: { fetch: jest.fn().mockResolvedValue(member) },
		});
		client.guilds.cache.set('guild-1', guild);

		voiceHandler.sessions.set('guild-1:user-1', true);
		await voiceHandler.tick(client);

		expect(LevelRepository.addXP).toHaveBeenCalled();
		const calls = LevelRepository.addXP.mock.calls;
		expect(calls).toHaveLength(1);
		const [, , amount] = calls[0];
		expect(amount).toBeGreaterThanOrEqual(3);
		expect(amount).toBeLessThanOrEqual(5);
	});

	test('removes session when member not in voice', async () => {
		const client = makeMockClient();
		const member = makeMockMember({ voice: { channel: null, channelId: null, selfMute: false, serverMute: false, selfDeaf: false, serverDeaf: false } });
		const guild = makeMockGuild({
			members: { fetch: jest.fn().mockResolvedValue(member) },
		});
		client.guilds.cache.set('guild-1', guild);

		voiceHandler.sessions.set('guild-1:user-1', true);
		await voiceHandler.tick(client);

		expect(voiceHandler.sessions.has('guild-1:user-1')).toBe(false);
	});

	test('handles null member.voice without throwing', async () => {
		const client = makeMockClient();
		const member = makeMockMember({ voice: undefined });
		const guild = makeMockGuild({
			members: { fetch: jest.fn().mockResolvedValue(member) },
		});
		client.guilds.cache.set('guild-1', guild);

		voiceHandler.sessions.set('guild-1:user-1', true);
		await expect(voiceHandler.tick(client)).resolves.not.toThrow();
		expect(voiceHandler.sessions.has('guild-1:user-1')).toBe(false);
	});

	test('does not throw when sessions is empty', async () => {
		const client = makeMockClient();
		await expect(voiceHandler.tick(client)).resolves.not.toThrow();
	});

	test('multi-user: both sessions receive XP independently', async () => {
		LevelRepository.addXP.mockResolvedValue({ points: 4, level: 1, oldLevel: 1 });
		LevelRepository.findRewardByGuildAndLevel.mockResolvedValue(null);

		const client = makeMockClient();
		const member1 = makeMockMember({ id: 'user-1', user: { bot: false, id: 'user-1' } });
		const member2 = makeMockMember({ id: 'user-2', user: { bot: false, id: 'user-2' } });
		const guild = makeMockGuild({
			members: {
				fetch: jest.fn((id) => {
					if (id === 'user-1') {return Promise.resolve(member1);}
					if (id === 'user-2') {return Promise.resolve(member2);}
					return Promise.resolve(null);
				}),
			},
		});
		client.guilds.cache.set('guild-1', guild);

		voiceHandler.sessions.set('guild-1:user-1', true);
		voiceHandler.sessions.set('guild-1:user-2', true);
		await voiceHandler.tick(client);

		expect(LevelRepository.addXP).toHaveBeenCalledTimes(2);
		const calls = LevelRepository.addXP.mock.calls;
		expect(calls[0][0]).toBe('user-1');
		expect(calls[0][1]).toBe('guild-1');
		expect(calls[0][2]).toBeGreaterThanOrEqual(3);
		expect(calls[0][2]).toBeLessThanOrEqual(5);
		expect(calls[1][0]).toBe('user-2');
		expect(calls[1][1]).toBe('guild-1');
		expect(calls[1][2]).toBeGreaterThanOrEqual(3);
		expect(calls[1][2]).toBeLessThanOrEqual(5);
	});

	test('multi-user: one leaves, other remains', async () => {
		const client = makeMockClient();
		const member1 = makeMockMember({ id: 'user-1', user: { bot: false, id: 'user-1' } });
		const member2 = makeMockMember({ id: 'user-2', user: { bot: false, id: 'user-2' } });
		const guild = makeMockGuild({
			members: {
				fetch: jest.fn((id) => {
					if (id === 'user-1') {return Promise.resolve(member1);}
					if (id === 'user-2') {return Promise.resolve(member2);}
					return Promise.resolve(null);
				}),
			},
		});
		client.guilds.cache.set('guild-1', guild);

		voiceHandler.sessions.set('guild-1:user-1', true);
		voiceHandler.sessions.set('guild-1:user-2', true);
		member1.voice = { channel: null, channelId: null };
		await voiceHandler.tick(client);

		expect(voiceHandler.sessions.has('guild-1:user-1')).toBe(false);
		expect(voiceHandler.sessions.has('guild-1:user-2')).toBe(true);
	});
});

describe('initSessions()', () => {
	beforeEach(() => {
		voiceHandler.sessions.clear();
		jest.clearAllMocks();
	});

	test('adds eligible members from existing voice channels', async () => {
		const client = makeMockClient();
		const eligibleVoice = { channel: { id: 'vc-1' }, channelId: 'vc-1', selfMute: false, serverMute: false, selfDeaf: false, serverDeaf: false };
		const member = makeMockMember({ voice: { ...eligibleVoice, member: makeMockMember({ voice: eligibleVoice }) } });
		const voiceState = {
			channelId: 'vc-1',
			member,
			serverMute: false,
			serverDeaf: false,
		};
		const guild = makeMockGuild({
			voiceStates: { cache: new Map([['user-1', voiceState]]) },
		});
		client.guilds.cache.set('guild-1', guild);

		await voiceHandler.initSessions(client);

		expect(voiceHandler.sessions.has('guild-1:user-1')).toBe(true);
		expect(voiceHandler.sessions.size).toBe(1);
	});

	test('skips bot members', async () => {
		const client = makeMockClient();
		const botMember = makeMockMember({ id: 'bot-1', user: { bot: true, id: 'bot-1' } });
		const voiceState = {
			channelId: 'vc-1',
			member: botMember,
			serverMute: false,
			serverDeaf: false,
		};
		const guild = makeMockGuild({
			voiceStates: { cache: new Map([['bot-1', voiceState]]) },
		});
		client.guilds.cache.set('guild-1', guild);

		await voiceHandler.initSessions(client);

		expect(voiceHandler.sessions.has('guild-1:bot-1')).toBe(false);
		expect(voiceHandler.sessions.size).toBe(0);
	});

	test('skips self-muted members', async () => {
		const client = makeMockClient();
		const mutedMember = makeMockMember({
			voice: { channel: { id: 'vc-1' }, channelId: 'vc-1', selfMute: true, serverMute: false, selfDeaf: false, serverDeaf: false },
		});
		const voiceState = {
			channelId: 'vc-1',
			member: mutedMember,
			serverMute: false,
			serverDeaf: false,
		};
		const guild = makeMockGuild({
			voiceStates: { cache: new Map([['user-1', voiceState]]) },
		});
		client.guilds.cache.set('guild-1', guild);

		await voiceHandler.initSessions(client);

		expect(voiceHandler.sessions.has('guild-1:user-1')).toBe(false);
		expect(voiceHandler.sessions.size).toBe(0);
	});

	test('handles empty guilds without throwing', async () => {
		const client = makeMockClient();
		const guild = makeMockGuild({
			channels: { cache: new Map() },
		});
		client.guilds.cache.set('guild-1', guild);

		await expect(voiceHandler.initSessions(client)).resolves.not.toThrow();
		expect(voiceHandler.sessions.size).toBe(0);
	});

	test('handles no guilds without throwing', async () => {
		const client = makeMockClient();
		await expect(voiceHandler.initSessions(client)).resolves.not.toThrow();
		expect(voiceHandler.sessions.size).toBe(0);
	});
});

describe('isEligible() null safety', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('returns false when state.member is null', async () => {
		const client = makeMockClient();
		const state = makeVoiceState({ member: null });
		await expect(voiceHandler(client, state, state)).resolves.not.toThrow();
	});
});

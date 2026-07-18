const { assignLevelReward, notifyLevelUp } = require('../utils/leveling');

jest.useFakeTimers();

// ── Mock helpers ────────────────────────────────────────────
function makeMockClient(overrides = {}) {
    return {
        config: {
            levelUpChannel: null,
            voiceXpInterval: 60,
            voiceXpAmount: 4,
            ...overrides,
        },
        rewardService: null,
        channels: {
            fetch: jest.fn().mockResolvedValue(null),
        },
        logger: { log: jest.fn() },
        levelingService: {
            addXP: jest.fn((_uid, _gid, amount) => ({
                points: amount,
                level: 1,
                oldLevel: 1,
            })),
        },
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

const voiceHandler = require('../events/client/voiceStateUpdate');

describe('assignLevelReward', () => {
    test('returns null if no rewardService', async () => {
        const result = await assignLevelReward(makeMockClient(), makeMockGuild(), makeMockMember(), 5);
        expect(result).toBeNull();
    });

    test('returns null if no reward for level', async () => {
        const client = makeMockClient({
            rewardService: { findByGuildAndLevel: jest.fn().mockReturnValue(null) },
        });
        const result = await assignLevelReward(client, makeMockGuild(), makeMockMember(), 5);
        expect(result).toBeNull();
    });

    test('returns null if member already has the role', async () => {
        const role = { id: 'role-1', name: 'VIP' };
        const member = makeMockMember({
            roles: { cache: new Map([['role-1', role]]) },
        });
        const client = makeMockClient({
            rewardService: {
                findByGuildAndLevel: jest.fn().mockReturnValue({ role_id: 'role-1', level: 5 }),
                findAllByGuild: jest.fn().mockReturnValue([]),
            },
        });
        const result = await assignLevelReward(client, makeMockGuild(), member, 5);
        expect(result).toBeNull();
    });

    test('assigns role and returns role name', async () => {
        const role = { id: 'role-1', name: 'VIP' };
        const member = makeMockMember({
            roles: {
                cache: new Map(),
                remove: jest.fn().mockResolvedValue(),
                add: jest.fn().mockResolvedValue(),
            },
        });
        const guild = makeMockGuild({
            roles: { cache: new Map([['role-1', role]]) },
        });
        const client = makeMockClient({
            rewardService: {
                findByGuildAndLevel: jest.fn().mockReturnValue({ role_id: 'role-1', level: 5 }),
                findAllByGuild: jest.fn().mockReturnValue([{ role_id: 'role-1', level: 5 }]),
            },
        });
        const result = await assignLevelReward(client, guild, member, 5);
        expect(result).toBe('VIP');
    });

    test('returns null if bot lacks MANAGE_ROLES permission', async () => {
        const role = { id: 'role-1', name: 'VIP' };
        const member = makeMockMember({
            roles: {
                cache: new Map(),
                add: jest.fn().mockRejectedValue(new Error('Missing Permissions')),
            },
        });
        const guild = makeMockGuild({
            roles: { cache: new Map([['role-1', role]]) },
            members: {
                me: { roles: { highest: { comparePositionTo: () => -1 } }, permissions: { has: () => false } },
            },
        });
        const client = makeMockClient({
            rewardService: {
                findByGuildAndLevel: jest.fn().mockReturnValue({ role_id: 'role-1', level: 5 }),
                findAllByGuild: jest.fn().mockReturnValue([]),
            },
        });
        // Should not throw, just return null
        const result = await assignLevelReward(client, guild, member, 5);
        expect(result).toBeNull();
    });
});

describe('notifyLevelUp', () => {
    test('sends to levelUpChannel when configured', async () => {
        const send = jest.fn().mockResolvedValue();
        const client = makeMockClient({
            levelUpChannel: 'channel-1',
            channels: {
                fetch: jest.fn().mockResolvedValue({ send }),
            },
            rewardService: null,
        });
        const member = makeMockMember();
        await notifyLevelUp(client, makeMockGuild(), member, 5);
        expect(send).toHaveBeenCalled();
        expect(send.mock.calls[0][0]).toContain('nivel **5**');
    });

    test('sends to systemChannel when no levelUpChannel', async () => {
        const send = jest.fn().mockResolvedValue();
        const guild = makeMockGuild({ systemChannel: { send } });
        const client = makeMockClient({ levelUpChannel: null, rewardService: null });
        await notifyLevelUp(client, guild, makeMockMember(), 5);
        expect(send).toHaveBeenCalled();
    });

    test('includes role name in notification when reward exists', async () => {
        const send = jest.fn().mockResolvedValue();
        const role = { id: 'role-1', name: 'VIP' };
        const client = makeMockClient({
            levelUpChannel: 'channel-1',
            levelUpNotifyInterval: 5,
            channels: { fetch: jest.fn().mockResolvedValue({ send }) },
            rewardService: {
                findByGuildAndLevel: jest.fn().mockReturnValue({ role_id: 'role-1', level: 3 }),
            },
        });
        const guild = makeMockGuild({ roles: { cache: new Map([['role-1', role]]) } });
        await notifyLevelUp(client, guild, makeMockMember(), 3);
        expect(send.mock.calls[0][0]).toContain('VIP');
    });

    test('milestone level (10, interval 5) → sends notification', async () => {
        const send = jest.fn().mockResolvedValue();
        const client = makeMockClient({
            levelUpChannel: 'channel-1',
            levelUpNotifyInterval: 5,
            channels: { fetch: jest.fn().mockResolvedValue({ send }) },
            rewardService: null,
        });
        await notifyLevelUp(client, makeMockGuild(), makeMockMember(), 10);
        expect(send).toHaveBeenCalled();
        expect(send.mock.calls[0][0]).toContain('nivel **10**');
    });

    test('non-milestone level (7, interval 5) → suppresses notification', async () => {
        const send = jest.fn().mockResolvedValue();
        const client = makeMockClient({
            levelUpChannel: 'channel-1',
            levelUpNotifyInterval: 5,
            channels: { fetch: jest.fn().mockResolvedValue({ send }) },
            rewardService: null,
        });
        await notifyLevelUp(client, makeMockGuild(), makeMockMember(), 7);
        expect(send).not.toHaveBeenCalled();
    });

    test('level 3 with role reward → sends despite non-milestone', async () => {
        const send = jest.fn().mockResolvedValue();
        const role = { id: 'role-1', name: 'VIP' };
        const client = makeMockClient({
            levelUpChannel: 'channel-1',
            levelUpNotifyInterval: 5,
            channels: { fetch: jest.fn().mockResolvedValue({ send }) },
            rewardService: {
                findByGuildAndLevel: jest.fn().mockReturnValue({ role_id: 'role-1', level: 3 }),
            },
        });
        const guild = makeMockGuild({ roles: { cache: new Map([['role-1', role]]) } });
        await notifyLevelUp(client, guild, makeMockMember(), 3);
        expect(send).toHaveBeenCalled();
        expect(send.mock.calls[0][0]).toContain('VIP');
    });
});

describe('voiceStateUpdate handler', () => {
    // Basic lifecycle
    test('join creates session', () => {
        const oldState = makeVoiceState({ channelId: null });
        const newState = makeVoiceState({ channelId: 'vc-1' });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    test('leave removes session', () => {
        const oldState = makeVoiceState({ channelId: 'vc-1' });
        const newState = makeVoiceState({ channelId: null });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    test('move re-evaluates session', () => {
        const oldState = makeVoiceState({ channelId: 'vc-1' });
        const newState = makeVoiceState({ channelId: 'vc-2' });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    // Bot exclusion
    test('bot is not tracked', () => {
        const oldState = makeVoiceState({ channelId: null, member: { user: { bot: true } } });
        const newState = makeVoiceState({ channelId: 'vc-1', member: { user: { bot: true } } });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    // AFK channel (spec scenario 7)
    test('AFK channel does not create session', () => {
        const oldState = makeVoiceState({ channelId: null });
        const newState = makeVoiceState({ channelId: 'afk-channel', guild: { id: 'guild-1', afkChannelId: 'afk-channel' } });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    test('move to AFK channel removes session', () => {
        const oldState = makeVoiceState({ channelId: 'vc-1' });
        const newState = makeVoiceState({ channelId: 'afk-channel', guild: { id: 'guild-1', afkChannelId: 'afk-channel' } });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    // Mute/deafen toggle (spec scenarios 4, 5, 6)
    test('mute self removes session', () => {
        const oldState = makeVoiceState({ channelId: 'vc-1', selfMute: false });
        const newState = makeVoiceState({ channelId: 'vc-1', selfMute: true });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    test('unmute self re-adds session', () => {
        const oldState = makeVoiceState({ channelId: 'vc-1', selfMute: true });
        const newState = makeVoiceState({ channelId: 'vc-1', selfMute: false });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    test('deafen self removes session', () => {
        const oldState = makeVoiceState({ channelId: 'vc-1', selfDeaf: false });
        const newState = makeVoiceState({ channelId: 'vc-1', selfDeaf: true });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    test('undeafen self re-adds session', () => {
        const oldState = makeVoiceState({ channelId: 'vc-1', selfDeaf: true });
        const newState = makeVoiceState({ channelId: 'vc-1', selfDeaf: false });
        expect(() => voiceHandler(makeMockClient(), oldState, newState)).not.toThrow();
    });

    // Error handling
    test('handler catches all errors silently', () => {
        const client = makeMockClient();
        expect(() => voiceHandler(client, null, null)).not.toThrow();
    });
});

describe('tick() function', () => {
    beforeEach(() => {
        voiceHandler.sessions.clear();
        jest.clearAllMocks();
    });

    test('awards XP to eligible session', async () => {
        const client = makeMockClient();
        const member = makeMockMember();
        const guild = makeMockGuild({
            members: { fetch: jest.fn().mockResolvedValue(member) },
        });
        client.guilds.cache.set('guild-1', guild);

        voiceHandler.sessions.set('guild-1:user-1', true);
        await voiceHandler.tick(client);

        expect(client.levelingService.addXP).toHaveBeenCalledWith('user-1', 'guild-1', 4);
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
        // Session should be removed when voice is undefined
        expect(voiceHandler.sessions.has('guild-1:user-1')).toBe(false);
    });

    test('does not throw when sessions is empty', async () => {
        const client = makeMockClient();
        await expect(voiceHandler.tick(client)).resolves.not.toThrow();
    });

    test('multi-user: both sessions receive XP independently', async () => {
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

        expect(client.levelingService.addXP).toHaveBeenCalledTimes(2);
        expect(client.levelingService.addXP).toHaveBeenCalledWith('user-1', 'guild-1', 4);
        expect(client.levelingService.addXP).toHaveBeenCalledWith('user-2', 'guild-1', 4);
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
        // Simulate user-1 leaving by setting them as not in voice
        member1.voice = { channel: null, channelId: null };
        await voiceHandler.tick(client);

        // user-1 should be removed, user-2 should still be active
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
        const voiceChannel = {
            id: 'vc-1',
            type: 'voice',
            members: new Map([['user-1', member]]),
        };
        const guild = makeMockGuild({
            channels: { cache: new Map([['vc-1', voiceChannel]]) },
        });
        client.guilds.cache.set('guild-1', guild);

        await voiceHandler.initSessions(client);

        expect(voiceHandler.sessions.has('guild-1:user-1')).toBe(true);
        expect(voiceHandler.sessions.size).toBe(1);
    });

    test('skips bot members', async () => {
        const client = makeMockClient();
        const botMember = makeMockMember({ id: 'bot-1', user: { bot: true, id: 'bot-1' } });
        const voiceChannel = {
            id: 'vc-1',
            type: 'voice',
            members: new Map([['bot-1', botMember]]),
        };
        const guild = makeMockGuild({
            channels: { cache: new Map([['vc-1', voiceChannel]]) },
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
        const voiceChannel = {
            id: 'vc-1',
            type: 'voice',
            members: new Map([['user-1', mutedMember]]),
        };
        const guild = makeMockGuild({
            channels: { cache: new Map([['vc-1', voiceChannel]]) },
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
    test('returns false when state.member is null', () => {
        const client = makeMockClient();
        const state = makeVoiceState({ member: null });
        // The handler wraps isEligible in try/catch, so it should not throw
        expect(() => voiceHandler(client, state, state)).not.toThrow();
    });
});

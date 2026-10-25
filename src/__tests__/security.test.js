'use strict';

jest.mock('../database/repositories/LevelRepository', () => ({
	createReward: jest.fn().mockResolvedValue(true),
}));

const LevelRepository = require('../database/repositories/LevelRepository');
const createReward = require('../commands/levels/create-reward');
const say = require('../commands/core/say');
const evalCmd = require('../commands/core/eval');

const GUILD_ID = 'guild-1';
const OWNER_ID = 'owner-1';

// comparePositionTo returns a positive number when `this` sits above `other`.
function makeRole(id, position, extra = {}) {
	return {
		id,
		position,
		managed: false,
		comparePositionTo: (other) => position - other.position,
		toString: () => `<@&${id}>`,
		...extra,
	};
}

function makeRewardInteraction({ userId = 'mod-1', invokerPos = 5, role }) {
	return {
		user: { id: userId },
		member: { roles: { highest: makeRole('invoker-top', invokerPos) } },
		guild: {
			id: GUILD_ID,
			roles: { cache: new Map([[role.id, role]]) },
			members: { me: { roles: { highest: makeRole('bot-top', 100) }, permissions: { has: () => true } } },
		},
		options: { getRole: () => role, getInteger: () => 10 },
		reply: jest.fn().mockResolvedValue(),
	};
}

const client = { config: { ownerID: OWNER_ID }, user: { username: 'hanako', avatarURL: () => null } };

beforeEach(() => LevelRepository.createReward.mockClear());

describe('create-reward role hierarchy', () => {
	test('rejects a role at or above the invoker highest role', async () => {
		const interaction = makeRewardInteraction({ invokerPos: 5, role: makeRole('admin', 5) });
		await createReward.execute(client, interaction);
		expect(LevelRepository.createReward).not.toHaveBeenCalled();
		expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
	});

	test('rejects @everyone and managed roles', async () => {
		for (const role of [makeRole(GUILD_ID, 0), makeRole('integration', 1, { managed: true })]) {
			const interaction = makeRewardInteraction({ invokerPos: 50, role });
			await createReward.execute(client, interaction);
			expect(LevelRepository.createReward).not.toHaveBeenCalled();
		}
	});

	test('allows a role below the invoker highest role', async () => {
		const interaction = makeRewardInteraction({ invokerPos: 5, role: makeRole('lvl10', 3) });
		await createReward.execute(client, interaction);
		expect(LevelRepository.createReward).toHaveBeenCalledWith(10, 'lvl10');
	});

	test('the owner may assign a role above their own', async () => {
		const interaction = makeRewardInteraction({ userId: OWNER_ID, invokerPos: 1, role: makeRole('high', 50) });
		await createReward.execute(client, interaction);
		expect(LevelRepository.createReward).toHaveBeenCalledWith(10, 'high');
	});
});

describe('say', () => {
	test('sends the message with every mention disabled', async () => {
		const interaction = { options: { getString: () => '@everyone hi' }, reply: jest.fn().mockResolvedValue() };
		await say.execute(client, interaction);
		expect(interaction.reply).toHaveBeenCalledWith({ content: '@everyone hi', allowedMentions: { parse: [] } });
	});
});

describe('eval', () => {
	test('replies ephemerally so output never reaches the channel', async () => {
		const interaction = { options: { getString: () => '1 + 1' }, reply: jest.fn().mockResolvedValue() };
		await evalCmd.execute(client, interaction);
		expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
	});

	test('error output is ephemeral too', async () => {
		const interaction = { options: { getString: () => 'throw new Error("x")' }, reply: jest.fn().mockResolvedValue() };
		await evalCmd.execute(client, interaction);
		expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
	});
});

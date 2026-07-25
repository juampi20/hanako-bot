'use strict';

const AfkController = require('../controllers/AfkController');
const AfkService = require('../services/AfkService');

/**
 * Test AfkController.setAfk function
 */

describe('AfkController.setAfk', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call AfkService.set with correct parameters', async () => {
		const userId = '123';
		const guildId = '456';
		const reason = 'Testing';
		AfkService.set = jest.fn().mockResolvedValue({ id: 'test' });

		const result = await AfkController.setAfk(userId, guildId, reason);

		expect(AfkService.set).toHaveBeenCalledWith(userId, guildId, reason, expect.any(Number));
		expect(result.id).toBe('test');
	});
});

/**
 * Test AfkController.removeAfk function
 */

describe('AfkController.removeAfk', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call AfkService.remove with correct parameters', async () => {
		const userId = '123';
		const guildId = '456';
		AfkService.remove = jest.fn().mockResolvedValue({ id: 'test' });

		const result = await AfkController.removeAfk(userId, guildId);

		expect(AfkService.remove).toHaveBeenCalledWith(userId, guildId);
		expect(result.id).toBe('test');
	});
});

/**
 * Test AfkController.isAfk function
 */

describe('AfkController.isAfk', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call AfkService.isAfk with correct parameters', async () => {
		const userId = '123';
		const guildId = '456';
		AfkService.isAfk = jest.fn().mockResolvedValue({ id: 'test' });

		const result = await AfkController.isAfk(userId, guildId);

		expect(AfkService.isAfk).toHaveBeenCalledWith(userId, guildId);
		expect(result.id).toBe('test');
	});
});

/**
 * Test AfkController.getAfkUsers function
 */

describe('AfkController.getAfkUsers', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call AfkService.getAfkUsers with correct parameters', async () => {
		const guildId = '456';
		const mockUsers = [{ user_id: '123', reason: 'Testing' }];
		AfkService.getAfkUsers = jest.fn().mockResolvedValue(mockUsers);

		const result = await AfkController.getAfkUsers(guildId);

		expect(AfkService.getAfkUsers).toHaveBeenCalledWith(guildId);
		expect(result).toEqual(mockUsers);
	});
});

/**
 * Test AfkController.removeAllAfk function
 */

describe('AfkController.removeAllAfk', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call AfkService.removeAll with correct parameters', async () => {
		const guildId = '456';
		const mockUsers = [{ user_id: '123' }];
		AfkService.removeAll = jest.fn().mockResolvedValue(mockUsers);

		const result = await AfkController.removeAllAfk(guildId);

		expect(AfkService.removeAll).toHaveBeenCalledWith(guildId);
		expect(result).toEqual(mockUsers);
	});
});

/**
 * Test AfkController.resetAfk function
 */

describe('AfkController.resetAfk', () => {
	beforeEach(() => {
		AfkService.isAfk = jest.fn();
		AfkService.remove = jest.fn();
		AfkService.getAfkUsers = jest.fn();
		AfkService.removeAll = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should handle reset with target user', async () => {
		const interaction = {
			options: { getUser: jest.fn().mockReturnValue({ id: '123' }) },
			guildId: '456',
			member: { permissions: { has: jest.fn().mockReturnValue(true) } },
			guild: { channels: { cache: new Map() } },
			editReply: jest.fn().mockResolvedValue(),
			client: { logger: { debug: jest.fn() }, user: { username: 'test', avatarURL: jest.fn() } },
		};
		const config = { afkNotify: false, afkChannelId: null };
		AfkService.isAfk.mockResolvedValue({ user_id: '123', reason: 'Testing' });
		AfkService.remove.mockResolvedValue();

		await AfkController.resetAfk(interaction, '456', config);

		expect(AfkService.isAfk).toHaveBeenCalledWith('123', '456');
		expect(AfkService.remove).toHaveBeenCalledWith('123', '456');
		expect(interaction.editReply).toHaveBeenCalledWith(
			expect.objectContaining({ embeds: expect.any(Array) }),
		);
	});

	it('should handle reset without target user (removes all)', async () => {
		const interaction = {
			options: { getUser: jest.fn().mockReturnValue(null) },
			member: { permissions: { has: jest.fn().mockReturnValue(true) } },
			guild: { channels: { cache: new Map() } },
			editReply: jest.fn().mockResolvedValue(),
			client: { logger: { debug: jest.fn() }, user: { username: 'test', avatarURL: jest.fn() } },
		};
		const config = { afkNotify: false, afkChannelId: null };
		AfkService.getAfkUsers.mockResolvedValue([{ user_id: '123' }]);
		AfkService.removeAll.mockResolvedValue();

		await AfkController.resetAfk(interaction, '456', config);

		expect(AfkService.getAfkUsers).toHaveBeenCalledWith('456');
		expect(AfkService.removeAll).toHaveBeenCalledWith('456');
	});
});
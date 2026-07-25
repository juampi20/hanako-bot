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

	it('should reset for target user and return structured data', async () => {
		const guildId = '456';
		const targetUserId = '123';
		AfkService.isAfk.mockResolvedValue({ user_id: targetUserId, reason: 'Testing' });
		AfkService.remove.mockResolvedValue();

		const result = await AfkController.resetAfk(guildId, targetUserId);

		expect(result).toEqual({
			success: true,
			type: 'user',
			targetUser: { id: targetUserId, reason: 'Testing' },
		});
		expect(AfkService.isAfk).toHaveBeenCalledWith(targetUserId, guildId);
		expect(AfkService.remove).toHaveBeenCalledWith(targetUserId, guildId);
	});

	it('should return not_afk error when target user is not AFK', async () => {
		AfkService.isAfk.mockResolvedValue(null);

		const result = await AfkController.resetAfk('456', 'nonexistent');

		expect(result).toEqual({ success: false, error: 'not_afk' });
	});

	it('should reset all users and return count', async () => {
		const guildId = '456';
		AfkService.getAfkUsers.mockResolvedValue([{ user_id: '123' }, { user_id: '456' }]);
		AfkService.removeAll.mockResolvedValue();

		const result = await AfkController.resetAfk(guildId);

		expect(result).toEqual({ success: true, type: 'all', count: 2 });
		expect(AfkService.getAfkUsers).toHaveBeenCalledWith(guildId);
		expect(AfkService.removeAll).toHaveBeenCalledWith(guildId);
	});

	it('should return no_users error when no AFK users', async () => {
		AfkService.getAfkUsers.mockResolvedValue([]);

		const result = await AfkController.resetAfk('456');

		expect(result).toEqual({ success: false, error: 'no_users' });
	});
});
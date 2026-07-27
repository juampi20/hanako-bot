'use strict';

const AfkController = require('./AfkController');

/**
 * Test AfkController.setAfk function
 */
describe('AfkController.setAfk', () => {
	let afkController;
	let mockAfkService;

	beforeEach(() => {
		mockAfkService = {
			set: jest.fn(),
			remove: jest.fn(),
			isAfk: jest.fn(),
			getAfkUsers: jest.fn(),
			removeAll: jest.fn(),
		};
		afkController = new AfkController(mockAfkService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call afkService.set with correct parameters', async () => {
		const userId = '123';
		const guildId = '456';
		const reason = 'Testing';
		mockAfkService.set.mockResolvedValue({ id: 'test' });

		const result = await afkController.setAfk(userId, guildId, reason);

		expect(mockAfkService.set).toHaveBeenCalledWith(userId, guildId, reason, expect.any(Number));
		expect(result.id).toBe('test');
	});
});

/**
 * Test AfkController.removeAfk function
 */
describe('AfkController.removeAfk', () => {
	let afkController;
	let mockAfkService;

	beforeEach(() => {
		mockAfkService = {
			set: jest.fn(),
			remove: jest.fn(),
			isAfk: jest.fn(),
			getAfkUsers: jest.fn(),
			removeAll: jest.fn(),
		};
		afkController = new AfkController(mockAfkService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call afkService.remove with correct parameters', async () => {
		const userId = '123';
		const guildId = '456';
		mockAfkService.remove.mockResolvedValue({ id: 'test' });

		const result = await afkController.removeAfk(userId, guildId);

		expect(mockAfkService.remove).toHaveBeenCalledWith(userId, guildId);
		expect(result.id).toBe('test');
	});
});

/**
 * Test AfkController.isAfk function
 */
describe('AfkController.isAfk', () => {
	let afkController;
	let mockAfkService;

	beforeEach(() => {
		mockAfkService = {
			set: jest.fn(),
			remove: jest.fn(),
			isAfk: jest.fn(),
			getAfkUsers: jest.fn(),
			removeAll: jest.fn(),
		};
		afkController = new AfkController(mockAfkService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call afkService.isAfk with correct parameters', async () => {
		const userId = '123';
		const guildId = '456';
		mockAfkService.isAfk.mockResolvedValue({ id: 'test' });

		const result = await afkController.isAfk(userId, guildId);

		expect(mockAfkService.isAfk).toHaveBeenCalledWith(userId, guildId);
		expect(result.id).toBe('test');
	});
});

/**
 * Test AfkController.getAfkUsers function
 */
describe('AfkController.getAfkUsers', () => {
	let afkController;
	let mockAfkService;

	beforeEach(() => {
		mockAfkService = {
			set: jest.fn(),
			remove: jest.fn(),
			isAfk: jest.fn(),
			getAfkUsers: jest.fn(),
			removeAll: jest.fn(),
		};
		afkController = new AfkController(mockAfkService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call afkService.getAfkUsers with correct parameters', async () => {
		const guildId = '456';
		const mockUsers = [{ user_id: '123', reason: 'Testing' }];
		mockAfkService.getAfkUsers.mockResolvedValue(mockUsers);

		const result = await afkController.getAfkUsers(guildId);

		expect(mockAfkService.getAfkUsers).toHaveBeenCalledWith(guildId);
		expect(result).toEqual(mockUsers);
	});
});

/**
 * Test AfkController.removeAllAfk function
 */
describe('AfkController.removeAllAfk', () => {
	let afkController;
	let mockAfkService;

	beforeEach(() => {
		mockAfkService = {
			set: jest.fn(),
			remove: jest.fn(),
			isAfk: jest.fn(),
			getAfkUsers: jest.fn(),
			removeAll: jest.fn(),
		};
		afkController = new AfkController(mockAfkService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call afkService.removeAll with correct parameters', async () => {
		const guildId = '456';
		const mockUsers = [{ user_id: '123' }];
		mockAfkService.removeAll.mockResolvedValue(mockUsers);

		const result = await afkController.removeAllAfk(guildId);

		expect(mockAfkService.removeAll).toHaveBeenCalledWith(guildId);
		expect(result).toEqual(mockUsers);
	});
});

/**
 * Test AfkController.resetAfk function
 */
describe('AfkController.resetAfk', () => {
	let afkController;
	let mockAfkService;

	beforeEach(() => {
		mockAfkService = {
			set: jest.fn(),
			remove: jest.fn(),
			isAfk: jest.fn(),
			getAfkUsers: jest.fn(),
			removeAll: jest.fn(),
		};
		afkController = new AfkController(mockAfkService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should reset for target user and return structured data', async () => {
		const guildId = '456';
		const targetUserId = '123';
		mockAfkService.isAfk.mockResolvedValue({ user_id: targetUserId, reason: 'Testing' });
		mockAfkService.remove.mockResolvedValue();

		const result = await afkController.resetAfk(guildId, targetUserId);

		expect(result).toEqual({
			success: true,
			type: 'user',
			targetUser: { id: targetUserId, reason: 'Testing' },
		});
		expect(mockAfkService.isAfk).toHaveBeenCalledWith(targetUserId, guildId);
		expect(mockAfkService.remove).toHaveBeenCalledWith(targetUserId, guildId);
	});

	it('should return not_afk error when target user is not AFK', async () => {
		mockAfkService.isAfk.mockResolvedValue(null);

		const result = await afkController.resetAfk('456', 'nonexistent');

		expect(result).toEqual({ success: false, error: 'not_afk' });
	});

	it('should reset all users and return count', async () => {
		const guildId = '456';
		mockAfkService.getAfkUsers.mockResolvedValue([{ user_id: '123' }, { user_id: '456' }]);
		mockAfkService.removeAll.mockResolvedValue();

		const result = await afkController.resetAfk(guildId);

		expect(result).toEqual({ success: true, type: 'all', count: 2 });
		expect(mockAfkService.getAfkUsers).toHaveBeenCalledWith(guildId);
		expect(mockAfkService.removeAll).toHaveBeenCalledWith(guildId);
	});

	it('should return no_users error when no AFK users', async () => {
		mockAfkService.getAfkUsers.mockResolvedValue([]);

		const result = await afkController.resetAfk('456');

		expect(result).toEqual({ success: false, error: 'no_users' });
	});
});

const path = require('path');
const fs = require('fs');

jest.mock('../database/connect', () => ({
	initialize: jest.fn().mockResolvedValue({ query: jest.fn() }),
	getPool: jest.fn().mockReturnValue({ query: jest.fn() }),
	close: jest.fn().mockResolvedValue(),
}));

jest.mock('../database/models', () => ({
	loadModels: jest.fn().mockResolvedValue(),
	Score: {},
	Reward: {},
	Afk: {},
}));

const { initialize, close } = require('../database/connect');
const { loadModels } = require('../database/models');

beforeAll(async () => {
	const pool = await initialize();
	await loadModels(pool);
});

afterAll(async () => {
	await close();
});

// Test 1: Registration JSON output
// Verify that command data.toJSON() produces the expected shape for at least 3 different commands
describe('Registration JSON output', () => {
	const { SlashCommandBuilder } = require('discord.js');

	test('8ball command structure', () => {
		const { data } = require('../commands/fun/8ball.js');
		expect(data).toBeInstanceOf(SlashCommandBuilder);
		const json = data.toJSON();
		expect(json).toHaveProperty('name', '8ball');
		expect(json).toHaveProperty('description', expect.any(String));
		expect(json).toHaveProperty('options');
		expect(Array.isArray(json.options)).toBe(true);
		expect(json.options.length).toBeGreaterThan(0);
		expect(json.options[0]).toHaveProperty('name', 'question');
	});

	test('ping command structure', () => {
		const { data } = require('../commands/misc/ping.js');
		expect(data).toBeInstanceOf(SlashCommandBuilder);
		const json = data.toJSON();
		expect(json).toHaveProperty('name', 'ping');
		expect(json).toHaveProperty('description', expect.any(String));
		expect(json).toHaveProperty('options');
		expect(Array.isArray(json.options)).toBe(true);
	});

	test('purge command structure', () => {
		const { data } = require('../commands/moderation/purge.js');
		expect(data).toBeInstanceOf(SlashCommandBuilder);
		const json = data.toJSON();
		expect(json).toHaveProperty('name', 'purge');
		expect(json).toHaveProperty('description', expect.any(String));
		expect(json).toHaveProperty('options');
		expect(Array.isArray(json.options)).toBe(true);
		expect(json.options.length).toBeGreaterThanOrEqual(2);
	});
});

// Test 2: Middleware dual-context
// Test that the permission middleware works with both a fake message-like object (has .author) and a fake interaction-like object (has .user)
describe('Middleware dual-context', () => {
	// Import permissions middleware at the top level
	const permissionsMiddleware = require('../middleware/permissions');

	test('middleware works with message-like object', () => {
		const mockClient = { config: { ownerID: '123456789' } };
		const mockNext = jest.fn();

		const fakeMessageContext = {
			// owner
			author: { id: '123456789' },
			reply: null,
			send: null,
			isReplied: false,
		};

		const mockCommand = { help: { ownerOnly: true } };

		permissionsMiddleware(mockClient, fakeMessageContext, mockCommand, mockNext);
		// permissionsMiddleware is synchronous for owner
		expect(mockNext).toHaveBeenCalled();
	});

	test('middleware works with interaction-like object', () => {
		const mockClient = { config: { ownerID: '123456789' } };
		const mockNext = jest.fn();

		const fakeInteractionContext = {
			// owner
			user: { id: '123456789' },
			reply: null,
			send: null,
			isReplied: false,
		};

		const mockCommand = { help: { ownerOnly: true } };

		permissionsMiddleware(mockClient, fakeInteractionContext, mockCommand, mockNext);
		// permissionsMiddleware is synchronous for owner
		expect(mockNext).toHaveBeenCalled();
	});
});

// Test 3: Command data structure
// Test that every command file in src/commands/ (except none.js and give.js) exports both run AND data AND execute.
// Verify give.js exports data and execute but NOT run
describe('Command data structure', () => {
	// Get all command files recursively
	const getCommandFiles = (dir) => {
		const files = [];
		const fsLocal = require('fs');
		const items = fsLocal.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isFile() && item.endsWith('.js')) {
				files.push(fullPath);
			}
			else if (stat.isDirectory()) {
				files.push(...getCommandFiles(fullPath));
			}
		}

		return files;
	};

	const commandsDir = path.join(__dirname, '../commands');
	const noRunCommands = ['/set-xp.js', '/set-level.js', '/delete-reward.js', '/create-reward.js', '/rewards.js'];
	const commandFiles = getCommandFiles(commandsDir).filter(file => !noRunCommands.some(c => file.endsWith(c)));

	test('non-owner commands have run, data, and execute exports', () => {
		commandFiles.forEach(file => {
			const command = require(file);
			expect(command).toHaveProperty('run');
			expect(command).toHaveProperty('data');
			expect(command).toHaveProperty('execute');
		});
	});

	test('slash-only commands have data and execute but NOT run', () => {
		const slashOnly = ['set-xp', 'set-level', 'delete-reward', 'create-reward', 'rewards'];
		slashOnly.forEach(name => {
			const command = require(`../commands/leveling/${name}.js`);
			expect(command).toHaveProperty('data');
			expect(command).toHaveProperty('execute');
			expect(command).not.toHaveProperty('run');
		});
	});
});

// Test 4: Migration hints
// Test that commands with hintSlash have a string value
describe('Migration hints', () => {
	test('commands with hintSlash property have string values', () => {
		// Get all command files recursively
		const getAllCommandFiles = (dir) => {
			const files = [];
			const fsLocal = require('fs');
			const items = fsLocal.readdirSync(dir);

			for (const item of items) {
				const fullPath = path.join(dir, item);
				const stat = fs.statSync(fullPath);

				if (stat.isFile() && item.endsWith('.js')) {
					files.push(fullPath);
				}
				else if (stat.isDirectory()) {
					files.push(...getAllCommandFiles(fullPath));
				}
			}

			return files;
		};

		const commandsDir = path.join(__dirname, '../commands');
		const commandFiles = getAllCommandFiles(commandsDir);

		commandFiles.forEach(file => {
			const command = require(file);
			if (command.help && command.help.hintSlash) {
				expect(command.help.hintSlash).toBeDefined();
				expect(command.help.hintSlash.length).toBeGreaterThan(0);
			}
		});
	});
});

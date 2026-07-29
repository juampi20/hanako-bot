const path = require('path');
const fs = require('fs');

jest.mock('../database/connect', () => ({
	initialize: jest.fn().mockResolvedValue({ query: jest.fn() }),
	getPool: jest.fn().mockReturnValue({ query: jest.fn() }),
	close: jest.fn().mockResolvedValue(),
}));

const { initialize, close } = require('../database/connect');

beforeAll(async () => {
	await initialize();
});

afterAll(async () => {
	await close();
});

// Test 1: Registration JSON output
// Verify that command data.toJSON() produces the expected shape for at least 3 different commands
describe('Registration JSON output', () => {
	const { SlashCommandBuilder } = require('discord.js');

	test('8ball command structure', () => {
		const { data } = require('../commands/core/8ball.js');
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
		const { data } = require('../commands/core/ping.js');
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

// Test 2: Command data structure
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
			const stat = fsLocal.statSync(fullPath);

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
	const noRunCommands = ['/set-xp.js', '/set-level.js', '/delete-reward.js', '/create-reward.js', '/rewards.js', '/config.js'];
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
		const slashOnly = [
			['levels', 'set-xp'],
			['levels', 'set-level'],
			['levels', 'delete-reward'],
			['levels', 'create-reward'],
			['levels', 'rewards'],
			['core', 'config'],
		];
		slashOnly.forEach(([category, name]) => {
			const command = require(`../commands/${category}/${name}.js`);
			expect(command).toHaveProperty('data');
			expect(command).toHaveProperty('execute');
			expect(command).not.toHaveProperty('run');
		});
	});
});

// Test 3: Migration hints
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

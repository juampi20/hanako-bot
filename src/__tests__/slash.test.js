'use strict';

const path = require('path');
const fs = require('fs');

jest.mock('../database/connect', () => ({
	initialize: jest.fn().mockResolvedValue({ query: jest.fn() }),
	getPool: jest.fn().mockReturnValue({ query: jest.fn() }),
	close: jest.fn().mockResolvedValue(),
}));

function getCommandFiles(dir) {
	const files = [];

	for (const item of fs.readdirSync(dir)) {
		const fullPath = path.join(dir, item);

		if (fs.statSync(fullPath).isDirectory()) {
			files.push(...getCommandFiles(fullPath));
		}
		else if (item.endsWith('.js')) {
			files.push(fullPath);
		}
	}

	return files;
}

const commandFiles = getCommandFiles(path.join(__dirname, '../commands'));

describe('command modules', () => {
	test('every command module loads and exposes an execute function', () => {
		expect(commandFiles.length).toBeGreaterThan(0);

		for (const file of commandFiles) {
			const command = require(file);
			expect(typeof command.execute).toBe('function');
		}
	});
});

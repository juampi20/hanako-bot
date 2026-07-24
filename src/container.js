'use strict';

const pool = require('../database/connect').getPool();
const LevelRepository = require('../repositories/LevelRepository');
const LevelService = require('../services/LevelService');

async function initialize() {
	console.log('Initializing DI container for Level domain');

	const repo = new LevelRepository(pool);
	LevelService.useRepository(repo);

	console.log('LevelRepository injected into LevelService');
}

module.exports = initialize;
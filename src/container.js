'use strict';

const pool = require('../database/connect').getPool();
const LevelRepository = require('../repositories/LevelRepository');
const LevelService = require('../services/LevelService');
const RewardRepository = require('../repositories/RewardRepository');
const RewardService = require('../services/RewardService');

async function initialize() {
	console.log('Initializing DI container for Level domain');

	const levelRepo = new LevelRepository(pool);
	LevelService.useRepository(levelRepo);

	console.log('LevelRepository injected into LevelService');

	const rewardRepo = new RewardRepository(pool);
	RewardService.useRepository(rewardRepo);

	console.log('RewardRepository injected into RewardService');
}

module.exports = initialize;
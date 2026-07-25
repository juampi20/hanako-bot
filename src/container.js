'use strict';

const pool = require('./database/connect').getPool();
const LevelRepository = require('./repositories/LevelRepository');
const LevelService = require('./services/LevelService');
const RewardRepository = require('./repositories/RewardRepository');
const RewardService = require('./services/RewardService');
const AfkRepository = require('./repositories/AfkRepository');
const AfkService = require('./services/AfkService');

async function initialize() {
	console.log('Initializing DI container for Level domain');

	const levelRepo = new LevelRepository(pool);
	LevelService.useRepository(levelRepo);

	console.log('LevelRepository injected into LevelService');

	console.log('Initializing DI container for Reward domain');

	const rewardRepo = new RewardRepository(pool);
	RewardService.useRepository(rewardRepo);

	console.log('RewardRepository injected into RewardService');

	// Inject RewardService into LevelService for level reward assignment
	LevelService.useRewardService(RewardService);
	console.log('RewardService injected into LevelService');

	console.log('Initializing DI container for Afk domain');

	const afkRepo = new AfkRepository(pool);
	AfkService.useRepository(afkRepo);

	console.log('AfkRepository injected into AfkService');
}

module.exports = initialize;
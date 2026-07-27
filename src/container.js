'use strict';

const LevelRepository = require('./repositories/LevelRepository');
const LevelService = require('./services/LevelService');
const RewardRepository = require('./repositories/RewardRepository');
const RewardService = require('./services/RewardService');
const AfkRepository = require('./repositories/AfkRepository');
const AfkService = require('./services/AfkService');

async function initialize(pool) {
	console.log('Initializing DI container for Level domain');

	const levelRepo = new LevelRepository(pool);
	const rewardRepo = new RewardRepository(pool);
	const afkRepo = new AfkRepository(pool);

	const rewardService = new RewardService(rewardRepo);
	const levelService = new LevelService(levelRepo, rewardService);
	const afkService = new AfkService(afkRepo);

	console.log('DI container initialized: LevelService, RewardService, AfkService');

	return { levelService, rewardService, afkService };
}

module.exports = initialize;

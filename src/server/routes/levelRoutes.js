'use strict';

const { Router } = require('express');
const { param, body, query } = require('express-validator');
const validationErrorHandler = require('../middleware/validationError');
const LevelRepository = require('../../database/repositories/LevelRepository');

const router = Router();

// ── GET /rank/:userId ─────────────────────────────────────
const getRankValidations = [
	param('userId').isString().notEmpty().trim(),
];

router.get('/rank/:userId', getRankValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const score = await LevelRepository.findByUser(req.params.userId, req.guildId);
		if (!score || score.points === 0) {
			return res.fail(404, 'Resource not found');
		}

		const currentLevel = score.level;
		const currentXP = score.points;
		const xpForCurrent = LevelRepository.getXPForLevel(currentLevel);
		const xpForNext = LevelRepository.getXPForLevel(currentLevel + 1);
		const xpFloor = currentLevel <= 1 ? 0 : xpForCurrent;
		const xpIntoLevel = Math.max(0, currentXP - xpFloor);
		const xpNeeded = xpForNext - xpFloor;
		const leaderboard = await LevelRepository.getLeaderboard(req.guildId, 1000);
		const rank = leaderboard.findIndex(entry => entry.user === req.params.userId) + 1;

		res.success({ score, xpForCurrent, xpForNext, xpFloor, xpIntoLevel, xpNeeded, rank });
	}
	catch (err) {
		next(err);
	}
});

// ── GET /leaderboard ───────────────────────────────────────
const getLeaderboardValidations = [
	query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
	query('offset').optional().isInt({ min: 0 }).toInt(),
];

router.get('/leaderboard', getLeaderboardValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const limit = req.query.limit ?? 10;
		const offset = req.query.offset ?? 0;

		const result = await LevelRepository.getLeaderboard(req.guildId, limit, offset);
		res.success(result, { total: result.length, limit, offset });
	}
	catch (err) {
		next(err);
	}
});

// ── GET /leaderboard/count ─────────────────────────────────
router.get('/leaderboard/count', async (req, res, next) => {
	try {
		const count = await LevelRepository.getLeaderboardCount(req.guildId);
		res.success({ count });
	}
	catch (err) {
		next(err);
	}
});

// ── PUT /xp ────────────────────────────────────────────────
const setXPValidations = [
	body('userId').isString().notEmpty().trim(),
	body('xp').isInt({ min: 0 }).toInt(),
];

router.put('/xp', setXPValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const result = await LevelRepository.setXP(req.body.userId, req.guildId, req.body.xp);
		res.success(result);
	}
	catch (err) {
		next(err);
	}
});

// ── PUT /level ─────────────────────────────────────────────
const setLevelValidations = [
	body('userId').isString().notEmpty().trim(),
	body('level').isInt({ min: 1 }).toInt(),
];

router.put('/level', setLevelValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const result = await LevelRepository.setLevel(req.body.userId, req.guildId, req.body.level);
		res.success(result);
	}
	catch (err) {
		next(err);
	}
});

module.exports = router;

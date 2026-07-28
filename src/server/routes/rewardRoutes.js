'use strict';

const { Router } = require('express');
const { param, body } = require('express-validator');
const validationErrorHandler = require('../middleware/validationError');
const LevelRepository = require('../../database/repositories/LevelRepository');

const router = Router();

// ── GET / ──────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
	try {
		const rewards = await LevelRepository.findAllRewardsByGuild(req.guildId);
		res.success(rewards);
	}
	catch (err) {
		next(err);
	}
});

// ── GET /:id ───────────────────────────────────────────────
const getByIdValidations = [
	param('id').isString().notEmpty().trim(),
];

router.get('/:id', getByIdValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const reward = await LevelRepository.findRewardById(req.params.id);

		if (!reward) {
			return res.fail(404, 'Resource not found');
		}

		res.success(reward);
	}
	catch (err) {
		next(err);
	}
});

// ── POST / ─────────────────────────────────────────────────
const createValidations = [
	body('level').isInt({ min: 1 }).toInt(),
	body('roleId').isString().notEmpty().trim(),
];

router.post('/', createValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const created = await LevelRepository.createReward(
			req.guildId, req.body.level, req.body.roleId,
		);

		if (!created) {
			return res.fail(409, 'Reward already exists for this level');
		}

		res.success(created, null, 201);
	}
	catch (err) {
		next(err);
	}
});

// ── DELETE /:id ────────────────────────────────────────────
const deleteValidations = [
	param('id').isString().notEmpty().trim(),
];

router.delete('/:id', deleteValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const owned = await LevelRepository.verifyRewardOwnership(req.params.id, req.guildId);
		if (!owned) {
			return res.fail(404, 'Resource not found');
		}

		await LevelRepository.deleteReward(req.params.id);
		res.status(204).end();
	}
	catch (err) {
		next(err);
	}
});

module.exports = router;

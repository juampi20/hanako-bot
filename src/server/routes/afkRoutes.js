'use strict';

const { Router } = require('express');
const { param, body } = require('express-validator');
const validationErrorHandler = require('../middleware/validationError');
const AfkRepository = require('../../database/repositories/AfkRepository');

const router = Router();

// ── GET /:userId ───────────────────────────────────────────
const getAfkValidations = [
	param('userId').isString().notEmpty().trim(),
];

router.get('/:userId', getAfkValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const record = await AfkRepository.isAfk(req.params.userId, req.guildId);

		if (!record) {
			return res.fail(404, 'Resource not found');
		}

		res.success(record);
	}
	catch (err) {
		next(err);
	}
});

// ── POST / ─────────────────────────────────────────────────
const setAfkValidations = [
	body('userId').isString().notEmpty().trim(),
	body('reason').isString().notEmpty().trim(),
];

router.post('/', setAfkValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const record = await AfkRepository.set(
			req.body.userId, req.guildId, req.body.reason, Math.floor(Date.now() / 1000),
		);
		res.success(record, null, 201);
	}
	catch (err) {
		next(err);
	}
});

// ── DELETE /reset (must be BEFORE /:userId) ────────────────
router.delete('/reset', async (req, res, next) => {
	try {
		let result;

		if (req.body.userId) {
			const record = await AfkRepository.isAfk(req.body.userId, req.guildId);
			if (!record) {
				return res.fail(409, 'User is not AFK');
			}
			await AfkRepository.remove(req.body.userId, req.guildId);
			result = { success: true, type: 'user', targetUser: { id: req.body.userId, reason: record.reason } };
		}
		else {
			const users = await AfkRepository.getAfkUsers(req.guildId);
			if (users.length === 0) {
				return res.fail(404, 'No users found');
			}
			await AfkRepository.removeAll(req.guildId);
			result = { success: true, type: 'all', count: users.length };
		}

		res.success(result);
	}
	catch (err) {
		next(err);
	}
});

// ── DELETE /:userId ────────────────────────────────────────
const removeAfkValidations = [
	param('userId').isString().notEmpty().trim(),
];

router.delete('/:userId', removeAfkValidations, validationErrorHandler, async (req, res, next) => {
	try {
		const record = await AfkRepository.remove(req.params.userId, req.guildId);

		if (!record) {
			return res.fail(404, 'Resource not found');
		}

		res.status(204).end();
	}
	catch (err) {
		next(err);
	}
});

// ── DELETE / ───────────────────────────────────────────────
router.delete('/', async (req, res, next) => {
	try {
		const result = await AfkRepository.removeAll(req.guildId);
		res.success({ count: result.length || 0 });
	}
	catch (err) {
		next(err);
	}
});

module.exports = router;

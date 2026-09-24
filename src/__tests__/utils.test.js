'use strict';

jest.mock('discord.js', () => {
	const mockEmbedBuilder = {
		setColor: jest.fn().mockReturnThis(),
		setFooter: jest.fn().mockReturnThis(),
		setTimestamp: jest.fn().mockReturnThis(),
	};
	return {
		EmbedBuilder: jest.fn(() => mockEmbedBuilder),
	};
});

const { EmbedBuilder } = require('discord.js');
const { baseEmbed, COLORS } = require('../utils/embed');
const { progressBar } = require('../utils/progress');

const fakeClient = {
	user: {
		username: 'TestBot',
		avatarURL: () => 'https://example.com/avatar.png',
	},
};

describe('COLORS', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('INFO is 0x3498DB', () => {
		expect(COLORS.INFO).toBe(0x3498DB);
	});

	test('SUCCESS is 0x57F287', () => {
		expect(COLORS.SUCCESS).toBe(0x57F287);
	});

	test('ERROR is 0xED4245', () => {
		expect(COLORS.ERROR).toBe(0xED4245);
	});

	test('WARNING is 0xFEE75C', () => {
		expect(COLORS.WARNING).toBe(0xFEE75C);
	});

	test('LEVELING is 0x9B59B6', () => {
		expect(COLORS.LEVELING).toBe(0x9B59B6);
	});

	test('FUN is 0x5865F2', () => {
		expect(COLORS.FUN).toBe(0x5865F2);
	});
});

describe('baseEmbed', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('uses COLORS.INFO by default', () => {
		const embed = baseEmbed(fakeClient);
		expect(embed.setColor).toHaveBeenCalledWith(COLORS.INFO);
	});

	test('accepts explicit color option', () => {
		const embed = baseEmbed(fakeClient, { color: COLORS.ERROR });
		expect(embed.setColor).toHaveBeenCalledWith(COLORS.ERROR);
	});

	test('sets footer text and icon from client user', () => {
		const embed = baseEmbed(fakeClient);
		expect(embed.setFooter).toHaveBeenCalledWith({
			text: 'TestBot',
			iconURL: 'https://example.com/avatar.png',
		});
	});

	test('calls setTimestamp', () => {
		const embed = baseEmbed(fakeClient);
		expect(embed.setTimestamp).toHaveBeenCalledWith();
	});

	test('returns EmbedBuilder instance', () => {
		const embed = baseEmbed(fakeClient);
		expect(EmbedBuilder).toHaveBeenCalledTimes(1);
		expect(embed).toBeDefined();
	});

	test('handles undefined options gracefully (default parameter)', () => {
		const embed = baseEmbed(fakeClient, undefined);
		expect(embed.setColor).toHaveBeenCalledWith(COLORS.INFO);
	});
});

describe('progressBar', () => {
	test('zero value produces empty bar', () => {
		expect(progressBar(0, 100)).toBe('[===============]');
	});

	test('full value produces filled bar', () => {
		expect(progressBar(100, 100)).toBe('[▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇]');
	});

	test('clamps values above max', () => {
		expect(progressBar(200, 100)).toBe('[▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇]');
	});

	test('clamps values below zero', () => {
		expect(progressBar(-10, 100)).toBe('[===============]');
	});

	test('supports custom width', () => {
		expect(progressBar(1, 2, 1)).toBe('[▇]');
	});

	test('50/100 produces 8 filled tiles at width 15', () => {
		expect(progressBar(50, 100)).toBe('[▇▇▇▇▇▇▇▇=======]');
	});

	test('.5 boundary rounds to 1 filled tile', () => {
		expect(progressBar(1, 20, 10)).toBe('[▇=========]');
	});

	test('default width is 15', () => {
		const result = progressBar(50, 100);
		expect(result.length).toBe(17);
	});
});

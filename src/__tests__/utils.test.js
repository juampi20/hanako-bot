'use strict';

const { EmbedBuilder } = require('discord.js');
const { baseEmbed, COLORS } = require('../utils/embed');
const { progressBar } = require('../utils/progress');

const fakeClient = {
	user: {
		username: 'TestBot',
		avatarURL: () => 'https://example.com/avatar.png',
	},
};

describe('baseEmbed', () => {
	test('uses COLORS.INFO by default', () => {
		const embed = baseEmbed(fakeClient);
		expect(embed.data.color).toBe(COLORS.INFO);
	});

	test('accepts explicit color option', () => {
		const embed = baseEmbed(fakeClient, { color: COLORS.ERROR });
		expect(embed.data.color).toBe(COLORS.ERROR);
	});

	test('sets footer text and icon from client user', () => {
		const embed = baseEmbed(fakeClient);
		expect(embed.data.footer).toEqual({
			text: 'TestBot',
			icon_url: 'https://example.com/avatar.png',
		});
	});

	test('sets a timestamp', () => {
		const embed = baseEmbed(fakeClient);
		expect(embed.data.timestamp).toBeDefined();
	});

	test('returns an EmbedBuilder instance', () => {
		expect(baseEmbed(fakeClient)).toBeInstanceOf(EmbedBuilder);
	});

	test('uses the default color when options is undefined', () => {
		const embed = baseEmbed(fakeClient, undefined);
		expect(embed.data.color).toBe(COLORS.INFO);
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

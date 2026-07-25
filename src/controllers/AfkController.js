'use strict';

const AfkService = require('../services/AfkService');

/**
 * Set or update an AFK record for the user.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @param {string} reason - AFK reason.
 * @returns {Promise<Object>} The AFK record.
 */
async function setAfk(userId, guildId, reason) {
	return await AfkService.set(userId, guildId, reason, Math.floor(Date.now() / 1000));
}

/**
 * Remove an AFK record.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Object|null>} The removed record or null.
 */
async function removeAfk(userId, guildId) {
	return await AfkService.remove(userId, guildId);
}

/**
 * Check if a user is AFK.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Object|null>} The record or null.
 */
async function isAfk(userId, guildId) {
	return await AfkService.isAfk(userId, guildId);
}

/**
 * Get all AFK users for a guild.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Array<Object>>} Array of AFK records.
 */
async function getAfkUsers(guildId) {
	return await AfkService.getAfkUsers(guildId);
}

/**
 * Remove all AFK records for a guild.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Array<Object>>} Deleted records.
 */
async function removeAllAfk(guildId) {
	return await AfkService.removeAll(guildId);
}

/**
 * Reset AFK state for a target user or guild.
 * Handles the reset subcommand dispatch logic.
 * @param {Object} interaction - Discord interaction object.
 * @param {string} guildId - Guild ID.
 * @param {Object} config - Bot config (for afkNotify, afkChannelId).
 * @returns {Promise<void>} Resolves when operation complete.
 */
async function resetAfk(interaction, guildId, config) {
	const targetUser = interaction.options.getUser('target');
	const hasManageGuild = interaction.member.permissions.has('ManageGuild');

	if (!hasManageGuild) {
		return interaction.editReply({ content: 'Necesitas el permiso Manage Server para usar este comando' });
	}

	if (targetUser) {
		const record = await isAfk(targetUser.id, guildId);

		if (!record) {
			return interaction.editReply({ content: `${targetUser} no está actualmente AFK` });
		}

		await removeAfk(targetUser.id, guildId);

		const { baseEmbed, COLORS } = require('../utils/embed');
		const embed = baseEmbed(interaction.client, { color: COLORS.SUCCESS })
			.setTitle('✅ AFK')
			.setDescription(`${targetUser} ya no está AFK\n**Motivo:** ${record.reason}`);

		await interaction.editReply({ embeds: [embed] });

		if (config.afkNotify && config.afkChannelId) {
			const channel = interaction.guild?.channels.cache.get(config.afkChannelId);
			if (channel) {
				channel.send(`${targetUser} fue marcado como no AFK por un administrador`).catch(() => null);
			}
		}
	}
	else {
		const users = await getAfkUsers(guildId);

		if (users.length === 0) {
			return interaction.editReply({ content: 'No hay usuarios AFK para reiniciar' });
		}

		await removeAllAfk(guildId);

		const { baseEmbed, COLORS } = require('../utils/embed');
		const embed = baseEmbed(interaction.client, { color: COLORS.SUCCESS })
			.setTitle('✅ AFK')
			.setDescription(`Se reinició AFK a ${users.length} usuario(s)`);

		await interaction.editReply({ embeds: [embed] });

		if (config.afkNotify && config.afkChannelId) {
			const channel = interaction.guild?.channels.cache.get(config.afkChannelId);
			if (channel) {
				channel.send(`${users.length} usuario(s) fueron marcados como no AFK por un administrador`).catch(() => null);
			}
		}
	}
}

module.exports = {
	setAfk,
	removeAfk,
	isAfk,
	getAfkUsers,
	removeAllAfk,
	resetAfk,
};
const { EmbedBuilder } = require('discord.js');

const COLORS = {
	INFO: 0x3498DB,
	SUCCESS: 0x57F287,
	ERROR: 0xED4245,
	WARNING: 0xFEE75C,
	LEVELING: 0x9B59B6,
	FUN: 0x5865F2,
};

function baseEmbed(client, options = {}) {
	return new EmbedBuilder()
		.setColor(options.color ?? COLORS.INFO)
		.setFooter({ text: client.user.username, iconURL: client.user.avatarURL() })
		.setTimestamp();
}

module.exports = { baseEmbed, COLORS };
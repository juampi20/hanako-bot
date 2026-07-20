const { EmbedBuilder } = require('discord.js');

/**
 * Attach reusable helpers to the client instance.
 * These avoid repeating embed/error logic in every command.
 */
module.exports = (client) => {
	/**
     * Send a simple embed with title + description + optional fields.
     * data.type: 'reply' | 'editreply' | 'ephemeral'
     */
	client.embed = async function(data, interaction) {
		const embed = new EmbedBuilder()
			.setColor(data.color ?? client.config.colors.info)
			.setTitle(data.title ?? null)
			.setDescription(data.desc ?? data.description ?? null)
			.setFooter({
				text: client.user.username,
				iconURL: client.user.avatarURL(),
			})
			.setTimestamp();

		if (data.fields) {
			embed.addFields(data.fields);
		}
		if (data.thumbnail) {
			embed.setThumbnail(data.thumbnail);
		}
		if (data.image) {
			embed.setImage(data.image);
		}

		const payload = { embeds: [embed] };
		if (data.components) {
			payload.components = data.components;
		}

		if (data.type === 'editreply') {
			return interaction.editReply(payload);
		}
		if (data.type === 'ephemeral') {
			return interaction.reply({ ...payload, ephemeral: true });
		}
		return interaction.reply(payload);
	};

	/**
     * Send a success-styled embed.
     */
	client.succNormal = async function(data, interaction) {
		return client.embed(
			{
				color: client.config.colors.success,
				desc: data.text,
				fields: data.fields || null,
				type: data.type || 'reply',
			},
			interaction,
		);
	};

	/**
     * Send an error-styled embed.
     */
	client.errNormal = async function(data, interaction) {
		return client.embed(
			{
				color: client.config.colors.error,
				desc: data.error,
				type: data.type || 'reply',
			},
			interaction,
		);
	};

	/**
     * Return a bare EmbedBuilder pre-configured with footer + timestamp.
     */
	client.templateEmbed = function() {
		return new EmbedBuilder()
			.setFooter({
				text: client.user.username,
				iconURL: client.user.avatarURL(),
			})
			.setTimestamp();
	};
};

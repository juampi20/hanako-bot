const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

exports.run = async (client, message, _args) => {
	if (!message.guild) {
		return message.channel.send({
			content: 'Este comando solo funciona en servidores (guilds).',
			ephemeral: true,
		});
	}

	try {
		const embed = await buildServerEmbed(client, message.guild);
		return message.channel.send({ embeds: [embed] });
	}
	catch (err) {
		client.logger?.log?.(err, 'error');
		return message.channel.send({
			content: 'Ocurrió un error al cargar la información del servidor.',
			ephemeral: true,
		});
	}
};

exports.execute = async (client, interaction) => {
	if (!interaction.guild) {
		return interaction.reply({
			content: 'Este comando solo funciona en servidores (guilds).',
			ephemeral: true,
		});
	}

	try {
		const embed = await buildServerEmbed(client, interaction.guild);
		return interaction.reply({ embeds: [embed] });
	}
	catch (err) {
		client.logger?.log?.(err, 'error');
		return interaction.reply({
			content: 'Ocurrió un error al cargar la información del servidor.',
			ephemeral: true,
		});
	}
};

exports.data = new SlashCommandBuilder()
	.setName('server')
	.setDescription('Muestra información del servidor')
	.setContexts(InteractionContextType.Guild);

async function buildServerEmbed(client, guild) {
	const owner = await guild.fetchOwner();
	const memberCount = guild.memberCount || 0;
	const boostTier = guild.premiumTier || 0;
	const boostCount = guild.premiumSubscriptionCount || 0;
	// Exclude @everyone
	const roleCount = guild.roles.cache.size - 1;
	const createdDate = guild.createdAt;

	const textChannels = guild.channels.cache.filter(channel => channel.isTextBased() && channel.type !== 5);
	const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2);
	const categoryChannels = guild.channels.cache.filter(channel => channel.type === 4);

	const embed = baseEmbed(client, { color: COLORS.INFO })
		.setTitle(guild.name)
		.setDescription(`Información general del servidor ${guild.name}.`)
		.setThumbnail(guild.iconURL() || 'https://cdn.discordapp.com/embed/avatars/0.png')
		.addFields(
			{ name: '👑 Owner', value: `${owner.user.username}#${owner.user.discriminator} (${owner.id})`, inline: true },
			{ name: '👥 Members', value: `${memberCount}`, inline: true },
			{ name: '⭐ Boosts', value: `${boostTier} Tier (${boostCount})`, inline: true },
			{ name: '📝 Text Channels', value: `${textChannels.size}`, inline: true },
			{ name: '🔊 Voice Channels', value: `${voiceChannels.size}`, inline: true },
			{ name: '📂 Categories', value: `${categoryChannels.size}`, inline: true },
			{ name: '🎭 Roles', value: `${roleCount}`, inline: true },
			{ name: '📅 Created', value: `<t:${Math.floor(createdDate / 1000)}:D> (<t:${Math.floor(createdDate / 1000)}:R>)`, inline: true },
		);

	return embed;
}

exports.help = {
	name: 'server',
	description: 'Muestra información del servidor (nombre, owner, miembros, boosts, canales, roles, fecha de creación)',
	category: 'misc',
	usage: 'server',
	hintSlash: 'server',
};
const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

exports.run = async (client, message, _args) => {
	const apiPing = client.ws.ping;
	const embed = baseEmbed(client, { color: COLORS.FUN })
		.setTitle('🏓 Pong!')
		.setDescription(`**Calculando...**\n**Ping WebSocket:** \`${apiPing}ms\``);
	const sent = await message.channel.send({ embeds: [embed] });
	const roundTripPing = sent.createdTimestamp - message.createdTimestamp;
	embed.setDescription(
		`**Latencia:** \`${roundTripPing}ms\`\n**Ping WebSocket:** \`${apiPing}ms\``,
	);
	sent.edit({ embeds: [embed] }).catch(err => client.logger.log(err, 'error'));
};

exports.data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Chequea la latencia del bot')
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const apiPing = client.ws.ping;
	const embed = baseEmbed(client, { color: COLORS.FUN })
		.setTitle('🏓 Pong!')
		.setDescription(`**Calculando...**\n**Ping WebSocket:** \`${apiPing}ms\``);
	const sent = await interaction.reply({ embeds: [embed], fetchReply: true });
	const roundTripPing = sent.createdTimestamp - interaction.createdTimestamp;
	embed.setDescription(
		`**Latencia:** \`${roundTripPing}ms\`\n**Ping WebSocket:** \`${apiPing}ms\``,
	);
	await interaction.editReply({ embeds: [embed] });
};

exports.help = {
	name: 'ping',
	description: 'Compueba la latencia del BOT con la API de discord.',
	category: 'misc',
	usage: 'ping',
	hintSlash: 'ping',
};
const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

exports.data = new SlashCommandBuilder()
	.setName('purge')
	.setDescription('Elimina mensajes del canal')
	.addIntegerOption(opt => opt.setName('amount').setDescription('Cantidad de mensajes').setRequired(true).setMinValue(1).setMaxValue(100))
	.addUserOption(opt => opt.setName('user').setDescription('Usuario cuyos mensajes eliminar').setRequired(false))
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const user = interaction.options.getUser('user');
	const amount = interaction.options.getInteger('amount');
	const targetDesc = user ? ` de **${user.username}**` : '';
	const countLabel = `${amount} mensaje${amount !== 1 ? 's' : ''}`;

	const confirm = new ButtonBuilder()
		.setCustomId('purge_confirm')
		.setLabel('Confirmar')
		.setStyle(ButtonStyle.Success);

	const cancel = new ButtonBuilder()
		.setCustomId('purge_cancel')
		.setLabel('Cancelar')
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder().addComponents(cancel, confirm);

	const response = await interaction.reply({
		content: `¿Eliminar ${countLabel}${targetDesc}?`,
		components: [row],
		ephemeral: true,
		withResponse: true,
	});

	try {
		const confirmation = await response.resource.message.awaitMessageComponent({
			filter: i => i.user.id === interaction.user.id,
			time: 30_000,
		});

		if (confirmation.customId !== 'purge_confirm') {
			await confirmation.update({ content: 'Operación cancelada.', components: [] });
			return;
		}

		await confirmation.update({ content: 'Eliminando mensajes...', components: [] });
	}
	catch {
		await interaction.editReply({ content: 'Tiempo de espera agotado. Operación cancelada.', components: [] });
		return;
	}
	const fetched = await interaction.channel.messages.fetch({ limit: 100 });
	let toDelete;
	if (user) {
		const filterBy = user.id;
		toDelete = Array.from(fetched.filter(m => m.author.id === filterBy).values()).slice(0, amount);
	}
	else {
		toDelete = amount;
	}
	await interaction.channel.bulkDelete(toDelete);
	const deletedCount = typeof toDelete === 'number' ? toDelete : toDelete.length;
	await interaction.editReply({
		content: `✅ Eliminados ${deletedCount} mensaje${deletedCount !== 1 ? 's' : ''}${targetDesc}.`,
		components: [],
	});
};

exports.help = {
	name: 'purge',
	description: 'Eliminar mensajes.',
	category: 'moderation',
	usage: 'purge <amount> or <user> <amount>',
	hintSlash: 'purge',
};

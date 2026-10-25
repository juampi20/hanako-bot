const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const LevelRepository = require('../../database/repositories/LevelRepository');

exports.data = new SlashCommandBuilder()
	.setName('create-reward')
	.setDescription('Añade un rol de nivel a un servidor')
	.addIntegerOption(opt => opt.setName('level').setDescription('Nivel para asignar el rol').setRequired(true).setMinValue(1))
	.addRoleOption(opt => opt.setName('role').setDescription('Rol a asignar').setRequired(true))
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

exports.execute = async (client, interaction) => {
	const targetRole = interaction.options.getRole('role');
	const level = interaction.options.getInteger('level');

	// Check if role exists in guild (already covered by Discord.js option validation)
	const role = interaction.guild.roles.cache.get(targetRole.id);
	if (!role) {
		return interaction.reply({ content: 'El rol especificado no se encontró en el servidor.', ephemeral: true });
	}

	if (role.managed || role.id === interaction.guild.id) {
		return interaction.reply({ content: 'Ese rol no se puede usar como recompensa.', ephemeral: true });
	}

	// The bot would bypass Discord's hierarchy check, so enforce it for the invoker.
	const isOwner = interaction.user.id === client.config.ownerID;
	if (!isOwner && interaction.member.roles.highest.comparePositionTo(role) <= 0) {
		return interaction.reply({ content: 'No podés asignar un rol igual o superior a tu rol más alto.', ephemeral: true });
	}

	// Validate bot can manage the role
	const botMember = interaction.guild.members.me;
	if (botMember.roles.highest.comparePositionTo(role) < 0) {
		return interaction.reply({ content: 'No puedo asignar este rol porque mi rol está por debajo del rol objetivo.', ephemeral: true });
	}

	if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
		return interaction.reply({ content: 'No tengo permisos para administrar roles en este servidor.', ephemeral: true });
	}

	const result = await LevelRepository.createReward(level, targetRole.id);

	if (!result) {
		return interaction.reply({ content: `Ya existe un rol asignado para el nivel ${level} en este servidor.`, ephemeral: true });
	}

	const embed = baseEmbed(client, { color: COLORS.SUCCESS })
		.setTitle('🎉 Rol asignado')
		.addFields(
			{ name: 'Nivel', value: `${level}`, inline: true },
			{ name: 'Rol', value: role.toString(), inline: true },

		);

	await interaction.reply({ embeds: [embed] });
};

exports.help = {
	name: 'create-reward',
	description: 'Asignar un rol para un cierto nivel.',
	category: 'leveling',
	usage: 'create-reward <nivel> <rol>',
	hintSlash: 'create-reward',
	ownerOnly: false,
};

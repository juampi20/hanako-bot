const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const GuildConfigRepository = require('../../database/repositories/GuildConfigRepository');

exports.run = (_client, _message, _args) => {
	// Slash-only command; prefix path is not supported
};

exports.data = new SlashCommandBuilder()
	.setName('autorole')
	.setDescription('Configurar el rol automático para miembros nuevos')
	.setContexts(InteractionContextType.Guild)
	.addSubcommand(subcommand =>
		subcommand
			.setName('set')
			.setDescription('Configurar el rol asignado al entrar')
			.addRoleOption(option =>
				option
					.setName('role')
					.setDescription('El rol a asignar a miembros nuevos')
					.setRequired(true)),
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('show')
			.setDescription('Mostrar el rol automático actual'),
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('remove')
			.setDescription('Desactivar el rol automático'),
	);

exports.execute = async (client, interaction) => {
	const sub = interaction.options.getSubcommand();
	client.logger?.debug?.(`AutoRole: comando sub=${sub} por ${interaction.user.tag} (${interaction.user.id})`);

	try {
		if (sub === 'set') {
			const role = interaction.options.getRole('role');

			if (role.id === interaction.guildId) {
				return client.errNormal({ error: 'No podés usar @everyone como rol automático.', type: 'ephemeral' }, interaction);
			}

			client.logger?.debug?.('AutoRole: Deferring reply (Ephemeral)...');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			await GuildConfigRepository.set(interaction.guildId, 'auto-role', role.id);
			client.config.autoRoleId = role.id;

			client.logger?.debug?.('AutoRole: rol automático guardado exitosamente.');

			return client.succNormal({
				text: `Rol automático configurado: **${role.name}**. Los miembros nuevos lo recibirán al entrar.`,
				type: 'editreply',
			}, interaction);
		}
		else if (sub === 'show') {
			client.logger?.debug?.('AutoRole: Deferring reply para show...');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const roleId = client.config.autoRoleId;

			if (!roleId) {
				return client.errNormal({ error: 'No hay un rol automático configurado. Usá `/autorole set <rol>` para configurarlo.', type: 'editreply' }, interaction);
			}

			const role = interaction.guild.roles.cache.get(roleId);

			const embed = baseEmbed(client, { color: COLORS.INFO })
				.setTitle('🛡️ Auto Role')
				.setDescription(`Rol automático actual: ${role ? `<@&${roleId}>` : `<@&${roleId}> *(rol no encontrado en el servidor)*`}`);

			return interaction.editReply({ embeds: [embed] });
		}
		else if (sub === 'remove') {
			client.logger?.debug?.('AutoRole: Deferring reply para remove...');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			if (!client.config.autoRoleId) {
				return client.errNormal({ error: 'No hay un rol automático configurado para desactivar.', type: 'editreply' }, interaction);
			}

			await GuildConfigRepository.remove(interaction.guildId, 'auto-role');
			client.config.autoRoleId = null;

			client.logger?.debug?.('AutoRole: rol automático eliminado exitosamente.');

			return client.succNormal({
				text: 'Rol automático desactivado. Los miembros nuevos ya no recibirán un rol al entrar.',
				type: 'editreply',
			}, interaction);
		}
	}
	catch (err) {
		client.logger?.debug?.(`AutoRole ERROR TRACE: ${err.stack || err.message}`);
		const embed = baseEmbed(client, { color: COLORS.ERROR })
			.setTitle('Error')
			.setDescription('Ocurrió un error al procesar el comando de auto-role.');
		await interaction.editReply({ embeds: [embed] }).catch(() => null);
	}
};

exports.help = {
	name: 'autorole',
	description: 'Configurar el rol automático para miembros nuevos.',
	category: 'core',
	usage: 'autorole set/show/remove',
	hintSlash: 'autorole',
	ownerOnly: true,
};

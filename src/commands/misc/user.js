const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

exports.run = async (client, message, args) => {
	if (!message.guild) {
		return message.channel.send({
			content: 'Este comando solo funciona en servidores (guilds).',
			ephemeral: true,
		});
	}

	// Try mention first, then args
	let target;
	if (message.mentions.users.size > 0) {
		target = message.mentions.users.first();
	}
	else if (args.length > 0) {
		const rawId = args[0];
		if (/^\d{17,19}$/.test(rawId)) {
			try {
				target = await client.users.fetch(rawId);
			}
			catch (err) {
				client.logger?.log?.(err, 'error');
				return message.channel.send({
					content: 'No se pudo encontrar ese usuario.',
					ephemeral: true,
				});
			}
		}
		else {
			return message.channel.send({
				content: 'Formato de ID de usuario inválido.',
				ephemeral: true,
			});
		}
	}
	else {
		target = message.author;
	}

	// Check if target is in the guild (unless it's the author themselves)
	if (target.id !== message.author.id && !message.guild.members.cache.has(target.id)) {
		return message.channel.send({
			content: 'Este usuario no está en este servidor.',
			ephemeral: true,
		});
	}

	// guild.members.fetch() for join date/roles
	let member = null;
	if (target.id !== message.author.id || message.guild.members.cache.has(target.id)) {
		try {
			member = await message.guild.members.fetch(target.id);
		}
		catch {
			// If member not found, skip member-specific data
		}
	}

	try {
		const embed = await buildUserEmbed(client, message.guild, target, target.id === message.author.id, member);
		return message.channel.send({ embeds: [embed] });
	}
	catch {
		client.logger?.log?.(err, 'error');
		return message.channel.send({
			content: 'Ocurrió un error al cargar la información del usuario.',
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

	const targetUser = interaction.options.getUser('user') || interaction.user;
	const isSelf = targetUser.id === interaction.user.id;

	// Check if target is in the guild (unless it's the author themselves)
	if (!isSelf && !interaction.guild.members.cache.has(targetUser.id)) {
		return interaction.reply({
			content: 'Este usuario no está en este servidor.',
			ephemeral: true,
		});
	}

	// guild.members.fetch() for join date/roles
	let member = null;
	try {
		member = await interaction.guild.members.fetch(targetUser.id);
	}
	catch {
		// If member not found, skip member-specific data
	}

	try {
		const embed = await buildUserEmbed(client, interaction.guild, targetUser, isSelf, member);
		return interaction.reply({ embeds: [embed] });
	}
	catch {
		client.logger?.log?.(err, 'error');
		return interaction.reply({
			content: 'Ocurrió un error al cargar la información del usuario.',
			ephemeral: true,
		});
	}
};

exports.data = new SlashCommandBuilder()
	.setName('user')
	.setDescription('Muestra información de un usuario')
	.addUserOption(opt => opt.setName('user').setDescription('Usuario objetivo').setRequired(false))
	.setContexts(InteractionContextType.Guild);

async function buildUserEmbed(client, guild, user, isSelf, member = null) {
	const accountCreated = user.createdAt;
	// moment.duration().humanize() for account age
	const accountAge = `~${calculateHumanReadableAge(accountCreated)}`;

	let joinDate = null;
	let roles = [];
	let memberFlag = '';

	if (member) {
		joinDate = member.joinedAt;
		roles = member.roles.cache
			.filter(role => role.name !== '@everyone')
			.map(role => role.toString())
			.slice(-5);
		roles = roles.length > 5
			? [...roles.slice(0, 4), '... y ' + (roles.length - 4) + ' más']
			: roles;
	}
	else {
		memberFlag = ' (no está en este servidor)';
	}

	const embed = baseEmbed(client, { color: COLORS.INFO })
		.setTitle(isSelf ? 'Tu Cuenta' : `Perfil de ${user.username}`)
		.setDescription(isSelf ? 'Aquí está la información de tu cuenta.' : `Información sobre ${user.username}.`)
		.setThumbnail(user.avatarURL() || 'https://cdn.discordapp.com/embed/avatars/0.png')
		.addFields(
			{ name: '📅 Cuenta Creada', value: `<t:${Math.floor(accountCreated / 1000)}:D> (<t:${Math.floor(accountCreated / 1000)}:R>)`, inline: true },
			{ name: '📅 Última Conexión en el Servidor' + memberFlag, value: joinDate ? `<t:${Math.floor(joinDate / 1000)}:D> (<t:${Math.floor(joinDate / 1000)}:R>)` : 'No está en este servidor', inline: true },
			{ name: '⏳ Edad de la Cuenta', value: accountAge, inline: true },
			{ name: '🎭 Roles', value: roles.length ? roles.join(' ') : 'Ninguno', inline: false },
		);

	embed.setFooter({
		text: isSelf ? `ID de Usuario: ${user.id}` : `Solicitado para: ${user.id}`,
		iconURL: user.avatarURL(),
	});

	return embed;
}

function calculateHumanReadableAge(date) {
	const now = new Date();
	const diff = now - date;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30.44);
	const years = Math.floor(days / 365.25);

	if (years >= 1) return `${years} año${years > 1 ? 's' : ''}`;
	if (months >= 1) return `${months} mes${months > 1 ? 's' : ''}`;
	if (weeks >= 1) return `${weeks} semana${weeks > 1 ? 's' : ''}`;
	if (days >= 1) return `${days} día${days > 1 ? 's' : ''}`;
	if (hours >= 1) return `${hours} hora${hours > 1 ? 's' : ''}`;
	if (minutes >= 1) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
	return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
}

exports.help = {
	name: 'user',
	description: 'Muestra información de un usuario (cuenta, edad, roles, miembro)',
	category: 'misc',
	usage: 'user [@user]',
	hintSlash: 'user',
};
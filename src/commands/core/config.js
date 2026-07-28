const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const GuildConfigRepository = require('../../database/repositories/GuildConfigRepository');
const botConfig = require('../../config/bot');
const { baseEmbed, COLORS } = require('../../utils/embed');

/**
 * Registry-backed validation.
 */
function validateSettingValue(key, rawValue, registry) {
	const def = registry[key];
	if (!def) throw new Error(`La clave '${key}' no existe en el registro.`);

	let value = rawValue;

	switch (def.type) {
	case 'string':
		if (typeof value !== 'string' || value.trim() === '') {throw new Error('El valor debe ser un texto no vacío.');}
		value = value.trim();
		break;

	case 'number':
		value = Number(value);
		if (!Number.isInteger(value)) {throw new Error('El valor debe ser un número entero.');}
		if (value < 1) {throw new Error('El valor debe ser mayor o igual a 1.');}
		break;

	case 'boolean':
		if (value === 'true' || value === true) value = true;
		else if (value === 'false' || value === false) value = false;
		else throw new Error('El valor debe ser \'true\' o \'false\'.');
		break;

	case 'snowflake':
		if (typeof value !== 'string' || !/^\d{17,20}$/.test(value)) {throw new Error('El valor debe ser un ID de Discord válido (17-20 dígitos).');}
		break;
	}

	return value;
}

/**
 * Send a reply regardless of context (prefix message or slash interaction).
 */
async function respond(ctx, payload) {
	if (ctx.channel) {
		return ctx.channel.send(payload);
	}
	if (ctx.replied || ctx.deferred) {
		return ctx.followUp(payload);
	}
	return ctx.reply(payload);
}

/**
 * Build an embed showing one config setting.
 */
function buildSettingEmbed(client, key, def, value, source) {
	return baseEmbed(client, { color: COLORS.INFO, title: `**${key}**` })
		.setDescription(def.description)
		.addFields(
			{ name: 'Valor', value: `\`${value}\` [${source}]`, inline: true },
			{ name: 'Tipo', value: def.type, inline: true },
			{ name: 'Variable .env', value: def.env, inline: true },
		);
}

// ── Prefix command ──────────────────────────────────────────────

exports.run = async (client, message, args) => {
	const guildId = message.guild?.id;
	if (!guildId) {
		return message.channel.send('Este comando solo funciona en servidores.');
	}

	const [cmd, ...rest] = args;

	try {
		switch (cmd) {
		case 'list':
		case '':
			await cmdList(client, message, guildId);
			break;

		case 'get':
			if (!rest.length) {
				return message.channel.send(`Uso: \`${client.config.prefix}config get <key>\``);
			}
			await cmdGet(client, message, guildId, rest[0]);
			break;

		case 'set':
			if (rest.length < 2) {
				return message.channel.send(`Uso: \`${client.config.prefix}config set <key> <value>\``);
			}
			await cmdSet(client, message, guildId, rest[0], rest.slice(1).join(' '));
			break;

		case 'reset':
			if (!rest.length) {
				return message.channel.send(`Uso: \`${client.config.prefix}config reset <key>\``);
			}
			await cmdReset(client, message, guildId, rest[0]);
			break;

		default:
			return message.channel.send(
				`Comando desconocido. Usá \`${client.config.prefix}config list\`, \`get\`, \`set\`, o \`reset\`.`,
			);
		}
	}
	catch (err) {
		client.logger?.error?.(`Config error: ${err.message}`);
		message.channel.send({ content: `❌ ${err.message}` });
	}
};

// ── Slash command ───────────────────────────────────────────────

exports.data = new SlashCommandBuilder()
	.setName('config')
	.setDescription('Ver o cambiar la configuración del bot')
	.setContexts(InteractionContextType.Guild)
	.addSubcommand(sub =>
		sub.setName('list').setDescription('Lista todas las configuraciones'))
	.addSubcommand(sub =>
		sub.setName('get').setDescription('Obtiene un valor de configuración')
			.addStringOption(opt => opt.setName('key').setDescription('Clave').setRequired(true)))
	.addSubcommand(sub =>
		sub.setName('set').setDescription('Establece un valor de configuración')
			.addStringOption(opt => opt.setName('key').setDescription('Clave').setRequired(true))
			.addStringOption(opt => opt.setName('value').setDescription('Valor').setRequired(true)))
	.addSubcommand(sub =>
		sub.setName('reset').setDescription('Restablece un valor de configuración')
			.addStringOption(opt => opt.setName('key').setDescription('Clave').setRequired(true)));

exports.execute = async (client, interaction) => {
	const subcommand = interaction.options.getSubcommand();
	const guildId = interaction.guildId;

	try {
		switch (subcommand) {
		case 'list':
			await cmdList(client, interaction, guildId);
			break;

		case 'get':
			await cmdGet(client, interaction, guildId, interaction.options.getString('key'));
			break;

		case 'set':
			await cmdSet(client, interaction, guildId,
				interaction.options.getString('key'),
				interaction.options.getString('value'));
			break;

		case 'reset':
			await cmdReset(client, interaction, guildId, interaction.options.getString('key'));
			break;
		}
	}
	catch (err) {
		client.logger?.error?.(`Config slash error: ${err.message}`);
		const content = `❌ ${err.message}`;
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content, ephemeral: true });
		}
		else {
			await interaction.reply({ content, ephemeral: true });
		}
	}
};

exports.help = {
	name: 'config',
	description: 'Ver o cambiar la configuración del bot',
	ownerOnly: true,
	category: 'dev',
	usage: 'config list | config get <key> | config set <key> <value> | config reset <key>',
	hintSlash: '/config list | /config get key:<key> | /config set key:<key> value:<value> | /config reset key:<key>',
};

// ── Shared handlers ─────────────────────────────────────────────

async function cmdList(client, ctx, guildId) {
	const registry = botConfig.SETTINGS_REGISTRY;

	const lines = [];
	for (const [key, def] of Object.entries(registry)) {
		const dbValue = await GuildConfigRepository.get(guildId, key);
		const current = dbValue !== null ? dbValue : def.default;
		const source = dbValue !== null ? '🟢 DB' : '⚪ .env';
		lines.push({ name: `**${key}** (${def.description})`, value: `Valor: \`${current}\` ${source}`, inline: false });
	}

	// Split into multiple embeds if needed (Discord limit: 25 fields per embed)
	const CHUNK_SIZE = 25;
	for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
		const chunk = lines.slice(i, i + CHUNK_SIZE);
		const embed = baseEmbed(client, { color: COLORS.INFO })
			.setTitle('Configuración del servidor')
			.setDescription(`Valores actuales para \`${guildId}\`:`)
			.addFields(chunk);
		await respond(ctx, { embeds: [embed] });
	}
}

async function cmdGet(client, ctx, guildId, key) {
	const registry = botConfig.SETTINGS_REGISTRY;
	const def = registry[key];
	if (!def) {
		return respond(ctx, { content: `❌ La clave '${key}' no existe.`, ephemeral: true });
	}

	const dbValue = await GuildConfigRepository.get(guildId, key);
	const value = dbValue !== null ? dbValue : def.default;
	const source = dbValue !== null ? '🟢 DB' : '⚪ .env';

	const embed = buildSettingEmbed(client, key, def, value, source);
	await respond(ctx, { embeds: [embed] });
}

async function cmdSet(client, ctx, guildId, key, rawValue) {
	const registry = botConfig.SETTINGS_REGISTRY;
	const def = registry[key];
	if (!def) {
		return respond(ctx, { content: `❌ La clave '${key}' no existe.`, ephemeral: true });
	}

	const validated = validateSettingValue(key, rawValue, registry);

	await GuildConfigRepository.set(guildId, key, String(validated));
	client.config[def.configKey || key] = validated;

	const embed = baseEmbed(client, { color: COLORS.SUCCESS })
		.setTitle('Configuración actualizada')
		.setDescription(`Se actualizó \`${key}\` a \`${validated}\`.`);

	await respond(ctx, { embeds: [embed] });
}

async function cmdReset(client, ctx, guildId, key) {
	const registry = botConfig.SETTINGS_REGISTRY;
	const def = registry[key];
	if (!def) {
		return respond(ctx, { content: `❌ La clave '${key}' no existe.`, ephemeral: true });
	}

	const deleted = await GuildConfigRepository.remove(guildId, key);
	client.config[def.configKey || key] = def.default;

	const embed = baseEmbed(client, { color: COLORS.WARNING })
		.setTitle('Configuración restablecida')
		.setDescription(
			deleted
				? `Se restauró \`${key}\` al valor por defecto: \`${def.default}\`.`
				: `\`${key}\` ya usaba el valor por defecto: \`${def.default}\`.`,
		);

	await respond(ctx, { embeds: [embed] });
}

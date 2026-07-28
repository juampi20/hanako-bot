'use strict';

const { Client, Collection, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/bot');
const logger = require('../utils/logger');
const { initialize } = require('../database/connect');
const LevelRepository = require('../database/repositories/LevelRepository');
const AfkRepository = require('../database/repositories/AfkRepository');
const GuildConfigRepository = require('../database/repositories/GuildConfigRepository');
const createLevelTable = require('../database/migrations/createLevelTable');
const createLevelRewardsTable = require('../database/migrations/createLevelRewardsTable');
const createAfkTable = require('../database/migrations/createAfkTable');
const createGuildConfigTable = require('../database/migrations/createGuildConfigTable');

// ── Inline middleware ────────────────────────────────────────

/** Cooldown: prevent command spam */
const cooldowns = new Map();
function cooldownMiddleware(client, context, command, next) {
	const cooldownTime = (command.help && command.help.cooldown) || 3000;
	if (cooldownTime <= 0) {return next();}

	const userId = context.author?.id || context.user?.id;
	const guildId = context.guild?.id || 'dm';
	const key = `${userId}:${guildId}`;
	const now = Date.now();

	if (cooldowns.has(key)) {
		const expiration = cooldowns.get(key);
		if (now < expiration) {
			const remaining = ((expiration - now) / 1000).toFixed(1);
			client.logger?.debug?.(`Cooldown: block for ${userId}:${guildId}, remaining=${remaining}s`);
			if (context.reply) {
				return context.reply({
					content: `tomate un tiempo. Esperá ${remaining} segundos.`,
					ephemeral: true,
				});
			}
			else if (context.isReplied) {
				return context.send(`tomate un tiempo. Esperá ${remaining} segundos.`);
			}
		}
	}

	cooldowns.set(key, now + cooldownTime);
	setTimeout(() => cooldowns.delete(key), cooldownTime);
	return next();
}
cooldownMiddleware.priority = 10;

/** Permissions: ownerOnly / moderatorOnly gate */
function permissionsMiddleware(client, context, command, next) {
	if (!command.help) {
		return next();
	}

	const userId = context.author?.id || context.user?.id;

	if (command.help.ownerOnly && userId !== client.config.ownerID) {
		client.logger?.debug?.(`Permissions: owner-only denied for ${userId} on command ${command.help.name}`);
		return denyReply(context, 'no tenés permiso para usar este comando.');
	}

	if (command.help.moderatorOnly) {
		const isOwner = userId === client.config.ownerID;
		if (!isOwner) {
			if (client.config.moderatorRoleId && context.member?.roles?.cache?.has(client.config.moderatorRoleId)) {
				// allowed
			}
			else {
				client.logger?.debug?.(`Permissions: moderator-only denied for ${userId} on command ${command.help.name}`);
				return denyReply(context, 'no tenés permiso para usar este comando.');
			}
		}
	}

	return next();
}
permissionsMiddleware.priority = 20;

/** GuildLock: restrict to configured guild */
function guildLockMiddleware(client, context, command, next) {
	if (!client.config.guildId) {
		return next();
	}

	let contextGuildId = null;
	if (context.guildId) {
		contextGuildId = context.guildId;
	}
	else if (context.guild && context.guild.id) {
		contextGuildId = context.guild.id;
	}

	if (!contextGuildId) {
		return denyReply(context, 'Este comando solo funciona en el servidor configurado');
	}

	if (contextGuildId !== client.config.guildId) {
		return denyReply(context, 'Este comando solo funciona en el servidor configurado');
	}

	return next();
}
guildLockMiddleware.priority = 25;

/** ErrorBoundary: catch-all for command execution errors */
async function errorBoundaryMiddleware(client, context, command, next) {
	try {
		await next();
	}
	catch (err) {
		client.logger.log(err, 'error');
		if (context.channel && context.channel.send) {
			context.channel.send({ content: 'Error: Ha ocurrido un error al ejecutar este comando.' })
				// eslint-disable-next-line no-empty-function
				.catch(() => {});
		}
		else if (context.reply) {
			context.reply({ content: 'Error: Ha ocurrido un error al ejecutar este comando.', ephemeral: true })
				// eslint-disable-next-line no-empty-function
				.catch(() => {});
		}
	}
}
errorBoundaryMiddleware.priority = 30;

function denyReply(context, content) {
	if (context.reply) {
		return context.reply({ content, ephemeral: true });
	}
	if (context.isReplied) {
		return context.send(content);
	}
	console.error(`[Middleware] ${content}`);
}

// ── Bot class ────────────────────────────────────────────────

class Bot extends Client {
	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildVoiceStates,
			],
		});

		this.config = config;
		this.logger = logger;
		this.commands = new Collection();
		this.interactions = new Collection();
		this.middleware = [
			cooldownMiddleware,
			permissionsMiddleware,
			guildLockMiddleware,
			errorBoundaryMiddleware,
		];
	}

	async start(token = this.config.token) {
		try {
			// 1. Init database + repos
			this.logger?.debug?.('Bot: initializing database');
			const pool = await initialize();
			LevelRepository.init(pool);
			AfkRepository.init(pool);
			await createLevelTable();
			await createLevelRewardsTable();
			await createAfkTable();
			this.logger?.debug?.('Bot: database initialization successful');

			// 2. Load guild config table
			GuildConfigRepository.init(pool);
			await createGuildConfigTable();

			// 3. Attach helper functions (embed, succNormal, errNormal, templateEmbed)
			this._attachFunctions();

			// 4. Load events (flat scan of src/events/*.js)
			this._loadEvents();

			// 5. Load commands (recursive from src/commands/*/)
			this._loadCommands();

			// 6. Load guild config overrides
			await this._loadGuildConfig();

			// 7. Login to Discord
			this.logger?.debug?.('Bot: logging into Discord');
			await this.login(token);

			// 6. Register slash commands
			await this._registerSlashCommands();
		}
		catch (err) {
			this.logger.error('Fatal error during startup:', err);
			process.exit(1);
		}
	}

	// ─── Private helpers ──────────────────────────────────────────────

	async _loadGuildConfig() {
		try {
			const { SETTINGS_REGISTRY } = require('../config/bot');
			const rows = await GuildConfigRepository.getAll(this.config.guildId);
			for (const { key, value } of rows) {
				const def = SETTINGS_REGISTRY[key];
				const configKey = def ? def.configKey : key;
				this.config[configKey] = value;
			}
			this.logger?.debug?.(`GuildConfig: loaded ${rows.length} overrides`);
		}
		catch (err) {
			this.logger?.warn?.(`GuildConfig: DB unreachable, using .env defaults — ${err.message}`);
		}
	}

	_attachFunctions() {
		this.embed = async function(data, interaction) {
			const embed = new EmbedBuilder()
				.setColor(data.color ?? this.config.colors.info)
				.setTitle(data.title ?? null)
				.setDescription(data.desc ?? data.description ?? null)
				.setFooter({ text: this.user.username, iconURL: this.user.avatarURL() })
				.setTimestamp();

			if (data.fields) embed.addFields(data.fields);
			if (data.thumbnail) embed.setThumbnail(data.thumbnail);
			if (data.image) embed.setImage(data.image);

			const payload = { embeds: [embed] };
			if (data.components) payload.components = data.components;

			if (data.type === 'editreply') return interaction.editReply(payload);
			if (data.type === 'ephemeral') return interaction.reply({ ...payload, ephemeral: true });
			return interaction.reply(payload);
		};

		this.succNormal = async function(data, interaction) {
			return this.embed(
				{ color: this.config.colors.success, desc: data.text, fields: data.fields || null, type: data.type || 'reply' },
				interaction,
			);
		};

		this.errNormal = async function(data, interaction) {
			return this.embed(
				{ color: this.config.colors.error, desc: data.error, type: data.type || 'reply' },
				interaction,
			);
		};

		this.templateEmbed = function() {
			return new EmbedBuilder()
				.setFooter({ text: this.user.username, iconURL: this.user.avatarURL() })
				.setTimestamp();
		};
	}

	_loadEvents() {
		const eventsDir = path.resolve(__dirname, '..', 'events');
		const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));
		let count = 0;

		for (const file of files) {
			const eventName = file.split('.')[0];
			const eventFn = require(path.join(eventsDir, file));

			this.on(eventName, async (...args) => {
				try {
					await eventFn(this, ...args);
				}
				catch (err) {
					this.logger?.error?.(`Unhandled error in event ${eventName}: ${err?.message || err}`);
				}
			});
			count++;
		}

		this.logger.log(`Cargando un total de ${count} eventos.`, 'log');
	}

	_loadCommands() {
		const commandsDir = path.resolve(__dirname, '..', 'commands');
		const folders = fs.readdirSync(commandsDir);

		for (const folder of folders) {
			const folderPath = path.join(commandsDir, folder);
			if (!fs.statSync(folderPath).isDirectory()) continue;

			const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
			this.logger.log(`Cargando un total de ${files.length} comandos (${folder}).`, 'log');

			for (const file of files) {
				const props = require(path.join(folderPath, file));
				const commandName = file.split('.')[0];

				this.commands.set(commandName, props);
				if (props.data) {
					this.interactions.set(commandName, props);
				}
			}
		}
	}

	async _registerSlashCommands() {
		const guildId = this.config.guildId;
		if (!guildId) {
			this.logger.log('GUILD_ID not set — skipping slash command registration', 'warn');
			return;
		}

		const commands = this.interactions
			.filter(cmd => cmd.data)
			.map(cmd => cmd.data.toJSON());

		const rest = new REST({ version: '10' }).setToken(this.config.token);
		try {
			await rest.put(Routes.applicationGuildCommands(this.user.id, guildId), { body: commands });
			this.logger.log(`Registered ${commands.length} guild commands`, 'ready');
		}
		catch (err) {
			this.logger.warn(`Failed to register guild commands: ${err.message || err}`);
		}
	}
}

module.exports = Bot;

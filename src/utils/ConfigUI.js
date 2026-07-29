const {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,
	StringSelectMenuBuilder,
	ChannelSelectMenuBuilder, RoleSelectMenuBuilder,
	ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const GuildConfigRepository = require('../database/repositories/GuildConfigRepository');
const LevelRepository = require('../database/repositories/LevelRepository');
const AfkRepository = require('../database/repositories/AfkRepository');
const { baseEmbed, COLORS } = require('../utils/embed');
const botConfig = require('../config/bot');

const NAV_TIMEOUT = 120_000;

const CATEGORIES = [
	{
		name: 'General', emoji: '⚙️', color: COLORS.INFO,
		settings: [
			{ key: 'prefix', label: 'Prefijo' },
			{ key: 'moderator-role', label: 'Mod Role', snowflakeKind: 'role' },
		],
		toggles: [],
		extras: [],
	},
	{
		name: 'XP', emoji: '✨', color: COLORS.LEVELING,
		settings: [
			{ key: 'chat-xp-min', label: 'Chat XP Mín' },
			{ key: 'chat-xp-max', label: 'Chat XP Máx' },
			{ key: 'voice-xp-min', label: 'Voice XP Mín' },
			{ key: 'voice-xp-max', label: 'Voice XP Máx' },
		],
		toggles: [],
		extras: [
			{ id: 'rewards', label: '📃 Rewards' },
		],
	},
	{
		name: 'Level-up', emoji: '⬆️', color: COLORS.SUCCESS,
		settings: [
			{ key: 'level-up-notify', label: 'Notificación' },
			{ key: 'level-up-interval', label: 'Intervalo' },
			{ key: 'level-up-channel', label: 'Canal', snowflakeKind: 'channel' },
		],
		toggles: [
			{ key: 'level-up-notify', label: '🔔 Notif.' },
		],
		extras: [],
	},
	{
		name: 'AFK', emoji: '💤', color: COLORS.WARNING,
		settings: [
			{ key: 'afk-notify', label: 'Notificación' },
			{ key: 'afk-autoreply', label: 'Auto-respuesta' },
			{ key: 'afk-channel', label: 'Canal de notif.', snowflakeKind: 'channel' },
		],
		toggles: [
			{ key: 'afk-notify', label: '🔔 Notif.' },
			{ key: 'afk-autoreply', label: '📩 Auto-resp.' },
		],
		extras: [
			{ id: 'afk-members', label: '📃 Listar AFKs' },
		],
	},
];

class ConfigUI {
	constructor(client, guildId) {
		this.client = client;
		this.guildId = guildId;
		this.page = 0;
	}

	// ── Entry point ────────────────────────────────────────────────

	async sendConfigPanel(interaction) {
		if (!this._isOwner(interaction.user)) {
			return interaction.reply({ content: 'no tenés permiso para usar este comando.', ephemeral: true });
		}

		const payload = this._buildMainPage(this.page);
		const reply = await interaction.reply({ ...payload, fetchReply: true });

		const collector = reply.createMessageComponentCollector({ time: NAV_TIMEOUT });

		collector.on('collect', async (i) => {
			try {
				if (!this._isOwner(i.user)) {
					return i.reply({ content: 'no tenés permiso para usar este comando.', ephemeral: true });
				}
				if (i.isStringSelectMenu()) {
					await this._handleSelectMenu(i);
				}
				else if (i.isChannelSelectMenu()) {
					await this._handlePickerSelect(i);
				}
				else if (i.isRoleSelectMenu()) {
					await this._handlePickerSelect(i);
				}
				else if (i.isButton()) {
					await this._handleButton(i);
				}
			}
			catch (err) {
				this.client.logger?.error?.(`ConfigUI: ${err.message}`);
				if (!i.replied && !i.deferred) {
					await i.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => undefined);
				}
			}
		});

		collector.on('end', () => {
			this._disableAll(reply).catch(() => undefined);
		});
	}

	// ── Main page ──────────────────────────────────────────────────

	_buildMainPage(pageIndex) {
		const cat = CATEGORIES[pageIndex];
		const cfg = this.client.config;
		const embed = baseEmbed(this.client, { color: cat.color })
			.setTitle(`${cat.emoji} ${cat.name}`)
			.setDescription(`Categoría ${pageIndex + 1} de ${CATEGORIES.length}`);

		for (const setting of cat.settings) {
			const def = botConfig.SETTINGS_REGISTRY[setting.key];
			if (!def) continue;

			const val = cfg[def.configKey] ?? def.default;
			const display = this._fieldValue(def, val);

			embed.addFields({
				name: setting.label,
				value: display,
				inline: true,
			});
		}

		const rows = [];

		// ── Row 1: Edit + toggles + extras ──
		const actionRow = new ActionRowBuilder();

		actionRow.addComponents(
			new ButtonBuilder()
				.setCustomId('cat_edit')
				.setLabel('🛠️ Editar')
				.setStyle(ButtonStyle.Primary),
		);

		for (const tg of cat.toggles) {
			const def = botConfig.SETTINGS_REGISTRY[tg.key];
			if (!def || def.type !== 'boolean') continue;

			const val = cfg[def.configKey] ?? def.default;
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`cat_toggle_${tg.key}`)
					.setLabel(tg.label)
					.setStyle(val ? ButtonStyle.Success : ButtonStyle.Danger),
			);
		}

		for (const act of cat.extras) {
			if (actionRow.components.length >= 3) break;
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`cat_extra_${act.id}`)
					.setLabel(act.label)
					.setStyle(ButtonStyle.Primary),
			);
		}

		rows.push(actionRow);

		// ── Overflow extras row (max 3 per row) ──
		const firstRowUsed = 1 + cat.toggles.length;
		const maxPerRow = 3;
		if (cat.extras.length > maxPerRow - firstRowUsed) {
			const overflowRow = new ActionRowBuilder();
			for (const act of cat.extras.slice(maxPerRow - firstRowUsed)) {
				if (overflowRow.components.length >= maxPerRow) break;
				overflowRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`cat_extra_${act.id}`)
						.setLabel(act.label)
						.setStyle(ButtonStyle.Primary),
				);
			}
			if (overflowRow.components.length > 0) rows.push(overflowRow);
		}

		// ── Navigation row ──
		rows.push(this._buildNavRow(pageIndex));

		return { embeds: [embed], components: rows };
	}

	_fieldValue(def, val) {
		if (def.type === 'boolean') {
			return val ? '✅ sí' : '❌ no';
		}
		if (def.type === 'snowflake' && val) {
			const mention = this._resolveSnowflake(val);
			if (mention) return mention;
		}
		return `\`${this._formatDisplay(def.type, val)}\``;
	}

	_resolveSnowflake(id) {
		const guild = this.client.guilds.cache.get(this.guildId);
		if (!guild) return null;

		const channel = guild.channels.cache.get(id);
		if (channel) return `${channel}`;

		const role = guild.roles.cache.get(id);
		if (role) return `${role}`;

		return null;
	}

	_buildNavRow(pageIndex) {
		return new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('nav_prev')
				.setLabel('◀')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(pageIndex === 0),
			new ButtonBuilder()
				.setCustomId('nav_next')
				.setLabel('▶')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(pageIndex === CATEGORIES.length - 1),
		);
	}

	// ── Edit Settings — select menu ────────────────────────────────

	_buildSelectView(pageIndex) {
		const cat = CATEGORIES[pageIndex];
		const cfg = this.client.config;
		const embed = baseEmbed(this.client, { color: cat.color })
			.setTitle(`${cat.emoji} ${cat.name}`)
			.setDescription('Seleccioná un parámetro para editar su valor.');

		const select = new StringSelectMenuBuilder()
			.setCustomId('config_select_edit')
			.setPlaceholder('Elegí un parámetro…');

		for (const setting of cat.settings) {
			const def = botConfig.SETTINGS_REGISTRY[setting.key];
			if (!def || def.type === 'boolean') continue;

			const val = cfg[def.configKey] ?? def.default;
			const display = this._formatDisplay(def.type, val);
			const label = setting.label || def.description || setting.key;
			const desc = `Actual: ${display}`.slice(0, 100);

			select.addOptions({
				label: label.slice(0, 100),
				value: setting.key,
				description: desc,
			});
		}

		const selectRow = new ActionRowBuilder().addComponents(select);

		return {
			embeds: [embed],
			components: [selectRow, this._buildNavRow(pageIndex)],
		};
	}

	// ── Rewards sub-page ──────────────────────────────────────────

	async _buildRewardsView() {
		const embed = baseEmbed(this.client, { color: COLORS.LEVELING })
			.setTitle('🏆 Rewards Roles');

		try {
			const rewards = await LevelRepository.findAllRewardsByGuild(this.guildId);
			if (rewards.length === 0) {
				embed.setDescription('No hay rewards configurados aún.');
			}
			else {
				const guild = this.client.guilds.cache.get(this.guildId);
				const lines = rewards.map(r => {
					const role = guild?.roles.cache.get(r.role_id);
					const roleDisplay = role ? `${role}` : `\`${r.role_id}\``;
					return `Level ${r.level} - ${roleDisplay}`;
				});
				embed.setDescription(`\`${rewards.length} reward${rewards.length !== 1 ? 's' : ''}\`\n${lines.join('\n')}`);
			}
		}
		catch (err) {
			this.client.logger?.error?.(`ConfigUI rewards: ${err.message}`);
			embed.setDescription('Error al cargar los rewards.');
		}

		return {
			embeds: [embed],
			components: [this._backRow()],
		};
	}

	// ── AFK Members sub-page ──────────────────────────────────────

	async _buildAfkMembersView() {
		const embed = baseEmbed(this.client, { color: COLORS.WARNING })
			.setTitle('💤 AFK Members')
			.setDescription('Miembros actualmente AFK en el servidor.');

		try {
			const rows = await AfkRepository.getAfkUsers(this.guildId);
			if (rows.length === 0) {
				embed.addFields({ name: 'Sin AFK', value: 'No hay miembros AFK en este momento.' });
			}
			else {
				const display = rows.slice(0, 25);
				const guild = await this.client.guilds.fetch(this.guildId).catch(() => null);
				for (const r of display) {
					const member = guild?.members.cache.get(r.user_id);
					const name = member?.displayName || r.user_id;
					const ago = r.started_at
						? Math.round((Date.now() - new Date(r.started_at).getTime()) / 60000)
						: '?';
					embed.addFields({
						name,
						value: `Razón: ${r.reason || '—'}\nHace \`${ago} min\``,
						inline: true,
					});
				}
				if (rows.length > 25) {
					embed.addFields({ name: `+${rows.length - 25} más`, value: 'Mostrando los primeros 25.' });
				}
			}
		}
		catch (err) {
			this.client.logger?.error?.(`ConfigUI afk-members: ${err.message}`);
			embed.addFields({ name: 'Error', value: 'No se pudieron cargar los miembros AFK.' });
		}

		return {
			embeds: [embed],
			components: [this._backRow()],
		};
	}

	_backRow() {
		return new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('back_main')
				.setLabel('◀ Volver')
				.setStyle(ButtonStyle.Secondary),
		);
	}

	// ── Button routing ────────────────────────────────────────────

	async _handleButton(interaction) {
		const id = interaction.customId;

		if (id === 'nav_prev') {
			this.page = Math.max(0, this.page - 1);
			return interaction.update(this._buildMainPage(this.page));
		}
		if (id === 'nav_next') {
			this.page = Math.min(CATEGORIES.length - 1, this.page + 1);
			return interaction.update(this._buildMainPage(this.page));
		}

		if (id === 'back_main') {
			return interaction.update(this._buildMainPage(this.page));
		}

		if (id === 'cat_edit') {
			return interaction.update(this._buildSelectView(this.page));
		}

		if (id.startsWith('cat_toggle_')) {
			const key = id.replace('cat_toggle_', '');
			return this._toggle(key, interaction);
		}

		if (id.startsWith('cat_extra_')) {
			const actionId = id.replace('cat_extra_', '');
			if (actionId === 'rewards') {
				await interaction.deferUpdate();
				return interaction.editReply(await this._buildRewardsView());
			}
			if (actionId === 'afk-members') {
				await interaction.deferUpdate();
				return interaction.editReply(await this._buildAfkMembersView());
			}
		}
	}

	// ── Select Menu handler ───────────────────────────────────────

	async _handleSelectMenu(interaction) {
		const key = interaction.values[0];
		const def = botConfig.SETTINGS_REGISTRY[key];
		if (!def) return;

		if (def.type === 'snowflake') {
			await this._showPicker(interaction, key);
		}
		else {
			await this._showModal(interaction, key);
		}
	}

	async _showPicker(interaction, key) {
		const cat = CATEGORIES[this.page];
		const setting = cat.settings.find(s => s.key === key);
		const kind = setting?.snowflakeKind;

		let select;
		if (kind === 'channel') {
			select = new ChannelSelectMenuBuilder()
				.setCustomId(`config_picker_${key}`)
				.setPlaceholder('Seleccioná un canal…');
		}
		else if (kind === 'role') {
			select = new RoleSelectMenuBuilder()
				.setCustomId(`config_picker_${key}`)
				.setPlaceholder('Seleccioná un rol…');
		}
		else {
			return this._showModal(interaction, key);
		}

		const embed = baseEmbed(this.client, { color: cat.color })
			.setTitle(`${cat.emoji} ${cat.name}`)
			.setDescription(`Seleccioná ${kind === 'channel' ? 'un canal' : 'un rol'} para **${setting.label}**`);

		const row = new ActionRowBuilder().addComponents(select);
		await interaction.update({ embeds: [embed], components: [row, this._backRow()] });
	}

	async _handlePickerSelect(interaction) {
		await interaction.deferUpdate();

		const key = interaction.customId.replace('config_picker_', '');
		const def = botConfig.SETTINGS_REGISTRY[key];
		if (!def) return;

		const selectedId = interaction.values[0];

		await GuildConfigRepository.set(this.guildId, key, selectedId);
		this.client.config[def.configKey] = selectedId;

		await interaction.editReply(this._buildMainPage(this.page));
	}

	// ── Modal ────────────────────────────────────────────────────

	async _showModal(interaction, key) {
		const def = botConfig.SETTINGS_REGISTRY[key];
		if (!def) throw new Error(`Clave '${key}' no encontrada.`);

		const current = this.client.config[def.configKey] ?? def.default;

		const input = new TextInputBuilder()
			.setCustomId(`config_input_${key}`)
			.setLabel(key)
			.setValue(String(current))
			.setStyle(TextInputStyle.Short)
			.setPlaceholder(`Ingrese un valor de tipo ${def.type}`)
			.setRequired(true);

		const modal = new ModalBuilder()
			.setCustomId(`config_modal_${key}`)
			.setTitle(`Editar: ${key}`)
			.addComponents(new ActionRowBuilder().addComponents(input));

		await interaction.showModal(modal);

		let submitted;
		try {
			submitted = await interaction.awaitModalSubmit({
				filter: (m) => m.user.id === interaction.user.id,
				time: 120_000,
			});
		}
		catch {
			return;
		}

		await this._handleModalSubmit(submitted);
	}

	async _handleModalSubmit(interaction) {
		const key = interaction.customId.replace('config_modal_', '');
		const raw = interaction.fields.getTextInputValue(`config_input_${key}`);
		const def = botConfig.SETTINGS_REGISTRY[key];
		if (!def) {
			return interaction.reply({ content: `❌ Clave '${key}' no encontrada.`, ephemeral: true });
		}

		let validated;
		try {
			validated = this._validate(key, raw);
		}
		catch (err) {
			return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
		}

		await interaction.deferUpdate();

		await GuildConfigRepository.set(this.guildId, key, String(validated));
		this.client.config[def.configKey] = validated;

		await interaction.editReply(this._buildMainPage(this.page));
	}

	// ── Toggle boolean ───────────────────────────────────────────

	async _toggle(key, interaction) {
		await interaction.deferUpdate();

		const def = botConfig.SETTINGS_REGISTRY[key];
		if (!def || def.type !== 'boolean') throw new Error(`'${key}' no es booleano.`);

		const current = this.client.config[def.configKey] ?? def.default;
		const next = !current;

		if (next) {
			await GuildConfigRepository.set(this.guildId, key, 'true');
		}
		else {
			await GuildConfigRepository.remove(this.guildId, key);
		}
		this.client.config[def.configKey] = next;

		await interaction.editReply(this._buildMainPage(this.page));
	}

	// ── Validation ───────────────────────────────────────────────

	_formatDisplay(type, value) {
		switch (type) {
		case 'string': return String(value);
		case 'number': return String(Number(value));
		case 'boolean': return value ? 'true' : 'false';
		case 'snowflake': return value ? String(value) : '—';
		default: return String(value);
		}
	}

	_validate(key, raw) {
		const def = botConfig.SETTINGS_REGISTRY[key];
		if (!def) throw new Error(`Clave '${key}' no existe.`);

		switch (def.type) {
		case 'string': {
			const s = String(raw).trim();
			if (!s) throw new Error('El valor no puede estar vacío.');
			return s;
		}
		case 'number': {
			const n = Number(raw);
			if (!Number.isInteger(n)) throw new Error('Debe ser un número entero.');
			if (n < 1) throw new Error('Debe ser mayor o igual a 1.');
			return n;
		}
		case 'boolean': {
			if (raw === 'true' || raw === true) return true;
			if (raw === 'false' || raw === false) return false;
			throw new Error('Debe ser \'true\' o \'false\'.');
		}
		case 'snowflake': {
			const s = String(raw).trim();
			if (!/^\d{17,20}$/.test(s)) throw new Error('Debe ser un ID de Discord de 17-20 dígitos.');
			return s;
		}
		default:
			throw new Error(`Tipo desconocido: ${def.type}`);
		}
	}

	// ── Timeout handling ──────────────────────────────────────────

	async _disableAll(message) {
		if (!message.editable) return;
		const disabled = message.components.map((row) => {
			const r = ActionRowBuilder.from(row);
			r.setComponents(row.components.map((c) => {
				if (c.type === ComponentType.Button) {
					return ButtonBuilder.from(c).setDisabled(true);
				}
				return c;
			}));
			return r;
		});
		try {
			await message.edit({ components: disabled });
		}
		catch {
			// message may have been deleted or become uneditable
		}
	}

	// ── Owner check ──────────────────────────────────────────────

	_isOwner(user) {
		return user.id === this.client.config.ownerID;
	}
}

module.exports = ConfigUI;

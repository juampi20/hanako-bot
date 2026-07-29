const {
	ActionRowBuilder, ButtonBuilder, ButtonStyle,
	ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const GuildConfigRepository = require('../database/repositories/GuildConfigRepository');
const { baseEmbed, COLORS } = require('../utils/embed');
const botConfig = require('../config/bot');

// 120 seconds
const NAV_TIMEOUT = 120_000;
const PAGES = [
	{ name: 'General', keys: ['prefix', 'moderator-role'] },
	{ name: 'XP', keys: ['chat-xp-min', 'chat-xp-max', 'voice-xp-min', 'voice-xp-max'] },
	{ name: 'Level-up', keys: ['level-up-notify', 'level-up-interval', 'level-up-channel'] },
	{ name: 'AFK', keys: ['afk-notify', 'afk-autoreply', 'afk-channel'] },
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

		const payload = this._buildPage(this.page);
		const reply = await interaction.reply({ ...payload, fetchReply: true });

		const collector = reply.createMessageComponentCollector({ time: NAV_TIMEOUT });

		collector.on('collect', async (btnInt) => {
			if (btnInt.isModalSubmit()) {
				await this._handleModalSubmit(btnInt);
				return;
			}
			if (!this._isOwner(btnInt.user)) {
				return btnInt.reply({ content: 'no tenés permiso para usar este comando.', ephemeral: true });
			}
			try {
				await this._handleButton(btnInt);
			}
			catch (err) {
				this.client.logger?.error?.(`ConfigUI: ${err.message}`);
				if (!btnInt.replied && !btnInt.deferred) {
					await btnInt.reply({ content: `❌ ${err.message}`, ephemeral: true });
				}
			}
		});

		collector.on('end', () => {
			this._disableAll(reply).catch(() => undefined);
		});
	}

	// ── Page building ──────────────────────────────────────────────

	_buildPage(pageIndex) {
		const cat = PAGES[pageIndex];
		const cfg = this.client.config;
		const embed = baseEmbed(this.client, { color: COLORS.INFO })
			.setTitle(`⚙️ Configuración — ${cat.name}`)
			.setDescription(`Página ${pageIndex + 1} de ${PAGES.length}`);

		const navRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('config_nav_prev').setLabel('◀ Anterior')
				.setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === 0),
			new ButtonBuilder()
				.setCustomId('config_nav_next').setLabel('Siguiente ▶')
				.setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === PAGES.length - 1),
		);

		const rows = [navRow];

		for (const key of cat.keys) {
			const def = botConfig.SETTINGS_REGISTRY[key];
			if (!def) continue;

			const val = cfg[def.configKey] ?? def.default;
			const isDbOverride = cfg[def.configKey] !== undefined;
			const indicator = isDbOverride ? '🟢 DB' : '⚪ .env';
			const display = this._formatDisplay(def.type, val);
			const desc = def.description;

			embed.addFields({ name: `**${key}**`, value: `\`${display}\` — ${desc} ${indicator}`, inline: false });

			const btnRow = new ActionRowBuilder();

			if (def.type === 'boolean') {
				btnRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`config_toggle_${key}`)
						.setLabel(val ? '✅ Habilitado' : '❌ Deshabilitado')
						.setStyle(val ? ButtonStyle.Success : ButtonStyle.Secondary),
				);
			}
			else {
				btnRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`config_edit_${key}`)
						.setLabel('✏️ Editar')
						.setStyle(ButtonStyle.Primary),
				);
			}

			btnRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`config_reset_${key}`)
					.setLabel('🔄 Restaurar')
					.setStyle(ButtonStyle.Danger),
			);

			rows.push(btnRow);
		}

		return { embeds: [embed], components: rows };
	}

	_formatDisplay(type, value) {
		switch (type) {
		case 'string': return String(value);
		case 'number': return String(Number(value));
		case 'boolean': return value ? 'true' : 'false';
		case 'snowflake': return String(value) || '—';
		default: return String(value);
		}
	}

	// ── Button routing ────────────────────────────────────────────

	async _handleButton(interaction) {
		const id = interaction.customId;

		if (id === 'config_nav_prev') {
			this.page = Math.max(0, this.page - 1);
			return interaction.update(this._buildPage(this.page));
		}
		if (id === 'config_nav_next') {
			this.page = Math.min(PAGES.length - 1, this.page + 1);
			return interaction.update(this._buildPage(this.page));
		}

		if (id.startsWith('config_edit_')) {
			const key = id.replace('config_edit_', '');
			return this._showModal(interaction, key);
		}
		if (id.startsWith('config_toggle_')) {
			const key = id.replace('config_toggle_', '');
			return this._toggle(key, interaction);
		}
		if (id.startsWith('config_reset_')) {
			const key = id.replace('config_reset_', '');
			return this._reset(key, interaction);
		}
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

		// Await the modal submit
		let submitted;
		try {
			submitted = await interaction.awaitModalSubmit({
				filter: (m) => m.user.id === interaction.user.id,
				time: 120_000,
			});
		}
		catch {
			// Timed out — do nothing
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

		await GuildConfigRepository.set(this.guildId, key, String(validated));
		this.client.config[def.configKey] = validated;

		await interaction.update(this._buildPage(this.page));
	}

	// ── Toggle boolean ───────────────────────────────────────────

	async _toggle(key, interaction) {
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

		await interaction.update(this._buildPage(this.page));
	}

	// ── Reset to default ─────────────────────────────────────────

	async _reset(key, interaction) {
		const def = botConfig.SETTINGS_REGISTRY[key];
		if (!def) throw new Error(`Clave '${key}' no encontrada.`);

		await GuildConfigRepository.remove(this.guildId, key);
		this.client.config[def.configKey] = def.default;

		await interaction.update(this._buildPage(this.page));
	}

	// ── Validation ───────────────────────────────────────────────

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
			r.setComponents(row.components.map((c) => ButtonBuilder.from(c).setDisabled(true)));
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

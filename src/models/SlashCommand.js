const { SlashCommandBuilder } = require('discord.js');

class SlashCommand {
	constructor(data) {
		this.data = data instanceof SlashCommandBuilder ? data : new SlashCommandBuilder();
	}
	toJSON() { return this.data.toJSON(); }
}
module.exports = SlashCommand;

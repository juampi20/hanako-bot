const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

const clean = (text) => {
	if (typeof (text) === 'string') {return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));}
	else {return text;}
};

exports.data = new SlashCommandBuilder()
	.setName('eval')
	.setDescription('Ejecuta codigo JavaScript (owner only)')
	.addStringOption(opt => opt.setName('code').setDescription('Codigo a ejecutar').setRequired(true))
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	try {
		const code = interaction.options.getString('code');
		let evaled = eval(code);
		if (typeof evaled !== 'string') {evaled = require('util').inspect(evaled);}
		await interaction.reply({ content: `\`\`\`xl\n${clean(evaled)}\n\`\`\``, ephemeral: true });
	}
	catch (err) {
		await interaction.reply({ content: `\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``, ephemeral: true });
	}
};

exports.help = {
	name: 'eval',
	description: 'Una función que evalúa cualquier cadena como código javascript y realmente la ejecuta.',
	category: 'dev',
	usage: 'eval <code>',
	ownerOnly: true,
	hintSlash: 'eval',
};
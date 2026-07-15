exports.run = (client, message, args) => {
    const { SlashCommandBuilder } = require("discord.js");

const clean = (text) => {
        if (typeof (text) === "string")
            {return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));}
        else
            {return text;}
    }

    try {
        const code = args.join(" ");
        let evaled = eval(code);

        if (typeof evaled !== "string")
            {evaled = require("util").inspect(evaled);}

        message.channel.send(`\`\`\`xl\n${clean(evaled)}\n\`\`\``);
    } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
};

exports.data = new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Ejecuta codigo JavaScript (owner only)")
    .addStringOption(opt => opt.setName("code").setDescription("Codigo a ejecutar").setRequired(true));

exports.execute = async (client, interaction) => {
    try {
        const code = interaction.options.getString("code");
        let evaled = eval(code);
        if (typeof evaled !== "string")
            {evaled = require("util").inspect(evaled);}
        await interaction.reply(`\`\`\`xl\n${clean(evaled)}\n\`\`\``);
    } catch (err) {
        await interaction.reply(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
};

exports.help = {
    name: "eval",
    description: "Una función que evalúa cualquier cadena como código javascript y realmente la ejecuta.",
    category: "dev",
    usage: "eval <code>",
    ownerOnly: true
};
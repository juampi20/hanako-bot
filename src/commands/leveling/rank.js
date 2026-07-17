const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { baseEmbed, COLORS } = require("../../utils/embed");
const { progressBar } = require("../../utils/progress");

function buildRankEmbed(client, target, score) {
    const levelingService = client.levelingService;
    const currentLevel = score.level;
    const currentXP = score.points;
    const xpForCurrent = levelingService.getXPForLevel(currentLevel);
    const xpForNext = levelingService.getXPForLevel(currentLevel + 1);

    // XP floor for the current level (0 for level 1, getXPForLevel for 2+)
    const xpFloor = currentLevel <= 1 ? 0 : xpForCurrent;
    const xpIntoLevel = Math.max(0, currentXP - xpFloor);
    const xpNeeded = xpForNext - xpFloor;
    const bar = progressBar(xpIntoLevel, xpNeeded);
    const pct = xpNeeded > 0 ? Math.round((xpIntoLevel / xpNeeded) * 100) : 100;

    // Find rank position
    const leaderboard = levelingService.getLeaderboard(target ? score.guild : client.guilds.cache.first()?.id, 100);
    const rank = leaderboard.findIndex(entry => entry.user === target.id) + 1;

    const embed = baseEmbed(client, { color: COLORS.LEVELING })
        .setAuthor({ name: target.username, iconURL: target.avatarURL() })
        .setDescription([
            `${bar}  ${pct}%`,
            `**${currentXP} / ${xpForNext}** XP hacia el nivel **${currentLevel + 1}**`
        ].join("\n"))
        .addFields(
            { name: "Nivel", value: `${currentLevel}`, inline: true },
            { name: "XP Total", value: `${currentXP}`, inline: true },
            { name: "Rank", value: rank > 0 ? `#${rank}` : "—", inline: true }
        );
    return embed;
}

exports.run = async (client, message, _args) => {
    const target = message.author;
    const score = client.levelingService.getScore(target.id, message.guild.id);
    const embed = buildRankEmbed(client, target, { ...score, guild: message.guild.id });
    await message.channel.send({ embeds: [embed] });
};

exports.data = new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Muestra tu nivel y XP")
    .addUserOption(opt => opt.setName("user").setDescription("Usuario a consultar").setRequired(false))
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const target = interaction.options.getUser("user") || interaction.user;
    const score = client.levelingService.getScore(target.id, interaction.guild.id);
    const embed = buildRankEmbed(client, target, { ...score, guild: interaction.guild.id });
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "rank",
    description: "Ver los puntos y nivel.",
    category: "leveling",
    usage: "rank",
    hintSlash: "rank"
};

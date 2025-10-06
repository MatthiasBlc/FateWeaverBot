import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { httpClient } from "../../services/httpClient";

const seasonAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("season-admin")
    .setDescription("Administration du système de saisons")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("info")
        .setDescription("Affiche les informations sur la saison actuelle")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("set")
        .setDescription("Change manuellement la saison")
        .addStringOption(option =>
          option
            .setName("season")
            .setDescription("Nom de la saison à définir")
            .setRequired(true)
            .addChoices(
              { name: "Printemps", value: "spring" },
              { name: "Été", value: "summer" },
              { name: "Automne", value: "autumn" },
              { name: "Hiver", value: "winter" }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("next")
        .setDescription("Affiche la prochaine rotation de saison prévue")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case "info":
          await handleSeasonInfo(interaction);
          break;
        case "set":
          await handleSeasonSet(interaction);
          break;
        case "next":
          await handleSeasonNext(interaction);
          break;
        default:
          await interaction.reply({
            content: "❌ Sous-commande inconnue.",
            flags: ["Ephemeral"]
          });
      }
    } catch (error) {
      logger.error("Erreur dans la commande season-admin:", { error });
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"]
      });
    }
  },
};

async function handleSeasonInfo(interaction: ChatInputCommandInteraction) {
  try {
    const response = await httpClient.get('/seasons/current');
    const currentSeason = response.data;

    if (!currentSeason) {
      await interaction.reply({
        content: "❌ Impossible de récupérer la saison actuelle.",
        flags: ["Ephemeral"]
      });
      return;
    }

    // Récupérer les statistiques de saison
    const statsResponse = await httpClient.get('/seasons/stats');
    const stats = statsResponse.data;

    const embed = {
      color: getSeasonColor(currentSeason.name),
      title: `🌤️ Saison Actuelle : ${formatSeasonName(currentSeason.name)}`,
      fields: [
        {
          name: "📅 Informations",
          value: [
            `**Nom :** ${formatSeasonName(currentSeason.name)}`,
            `**Début :** ${new Date(currentSeason.startDate).toLocaleDateString('fr-FR')}`,
            `**Changements cette semaine :** ${stats?.changesThisWeek || 0}`,
            `**Total des changements :** ${stats?.totalChanges || 0}`
          ].join('\n'),
          inline: false
        }
      ],
      footer: {
        text: "Système de saisons FateWeaver"
      },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la récupération des infos de saison:", error);
    await interaction.reply({
      content: "❌ Erreur lors de la récupération des informations de saison.",
      flags: ["Ephemeral"]
    });
  }
}

async function handleSeasonSet(interaction: ChatInputCommandInteraction) {
  const newSeason = interaction.options.getString("season", true);

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const response = await httpClient.post('/seasons/set', {
      season: newSeason,
      adminId: interaction.user.id
    });

    const result = response.data;

    const embed = {
      color: getSeasonColor(newSeason),
      title: "✅ Saison changée avec succès",
      fields: [
        {
          name: "🔄 Changement",
          value: [
            `**Ancienne saison :** ${formatSeasonName(result.oldSeason)}`,
            `**Nouvelle saison :** ${formatSeasonName(result.newSeason)}`,
            `**Changée par :** ${interaction.user.username}`,
            `**Date :** ${new Date().toLocaleString('fr-FR')}`
          ].join('\n'),
          inline: false
        }
      ],
      footer: {
        text: "Administration - Changement de saison"
      },
      timestamp: new Date().toISOString()
    };

    await interaction.editReply({ embeds: [embed] });

    // Log public du changement
    if (result.publicMessage && interaction.channel && 'send' in interaction.channel) {
      await interaction.channel.send(result.publicMessage);
    }
  } catch (error: any) {
    logger.error("Erreur lors du changement de saison:", error);
    await interaction.editReply({
      content: `❌ Erreur lors du changement de saison : ${error.message || 'Erreur inconnue'}`
    });
  }
}

async function handleSeasonNext(interaction: ChatInputCommandInteraction) {
  try {
    const response = await httpClient.get('/seasons/next-rotation');
    const nextRotation = response.data;

    if (!nextRotation) {
      await interaction.reply({
        content: "❌ Impossible de déterminer la prochaine rotation.",
        flags: ["Ephemeral"]
      });
      return;
    }

    const embed = {
      color: 0x3498db,
      title: "⏰ Prochaine Rotation de Saison",
      fields: [
        {
          name: "📅 Informations",
          value: [
            `**Saison actuelle :** ${formatSeasonName(nextRotation.currentSeason)}`,
            `**Prochaine saison :** ${formatSeasonName(nextRotation.nextSeason)}`,
            `**Rotation prévue :** ${new Date(nextRotation.nextRotationDate).toLocaleString('fr-FR')}`,
            `**Temps restant :** ${formatTimeUntil(nextRotation.nextRotationDate)}`
          ].join('\n'),
          inline: false
        }
      ],
      footer: {
        text: "Système de rotation automatique"
      },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la récupération de la prochaine rotation:", error);
    await interaction.reply({
      content: "❌ Erreur lors de la récupération des informations de rotation.",
      flags: ["Ephemeral"]
    });
  }
}

function getSeasonColor(seasonName: string): number {
  switch (seasonName?.toLowerCase()) {
    case 'spring': return 0x00ff00; // Vert printemps
    case 'summer': return 0xffa500; // Orange été
    case 'autumn': return 0xff4500; // Rouge automne
    case 'winter': return 0x87ceeb; // Bleu hiver
    default: return 0x808080; // Gris par défaut
  }
}

function formatSeasonName(seasonName: string): string {
  switch (seasonName?.toLowerCase()) {
    case 'spring': return 'Printemps';
    case 'summer': return 'Été';
    case 'autumn': return 'Automne';
    case 'winter': return 'Hiver';
    default: return seasonName || 'Inconnue';
  }
}

function formatTimeUntil(targetDate: string): string {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return "En cours";

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}j ${hours}h`;
  } else {
    return `${hours}h`;
  }
}

export default seasonAdminCommand;

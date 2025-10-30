import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { httpClient } from "../../services/httpClient";
import { SEASON } from "../../constants/emojis";
import { STATUS } from "../../constants/emojis.js";


const seasonAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("season-admin")
    .setDescription("Gestion de la saison actuelle")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await interaction.deferReply({ ephemeral: true });

      // Récupérer la saison actuelle
      const response = await httpClient.get('/seasons/current');
      const currentSeason = response.data;

      if (!currentSeason) {
        await interaction.editReply({
          content: `${STATUS.ERROR} Impossible de récupérer la saison actuelle.`
        });
        return;
      }

      // Créer le bouton NEXT SEASON
      const nextSeasonButton = new ButtonBuilder()
        .setCustomId('next_season')
        .setLabel('NEXT SEASON')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(nextSeasonButton);

      const embed = {
        color: getSeasonColor(currentSeason.name),
        title: `${getSeasonEmoji(currentSeason.name)} Saison Actuelle : ${formatSeasonName(currentSeason.name)}`,
        fields: [
          {
            name: "📅 Informations",
            value: [
              `**Nom :** ${formatSeasonName(currentSeason.name)}`,
              `**Dernière mise à jour :** ${new Date(currentSeason.updatedAt).toLocaleDateString('fr-FR')}`
            ].join('\n'),
            inline: false
          }
        ],
        footer: {
          text: "Système de saisons FateWeaver"
        },
        timestamp: new Date().toISOString()
      };

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });

      // Note: Le bouton est maintenant géré par le système centralisé button-handler

    } catch (error) {
      logger.error("Erreur dans la commande season-admin:", { error });
      await interaction.editReply({
        content: `${STATUS.ERROR} Une erreur est survenue lors de l'exécution de la commande.`
      });
    }
  },
};

function getSeasonColor(seasonName: string): number {
  switch (seasonName?.toLowerCase()) {
    case 'summer': return 0xffa500; // Orange été
    case 'winter': return 0x87ceeb; // Bleu hiver
    default: return 0x808080; // Gris par défaut
  }
}

function getSeasonEmoji(seasonName: string): string {
  switch (seasonName?.toLowerCase()) {
    case 'summer': return SEASON.SUMMER; // ☀️
    case 'winter': return SEASON.WINTER; // ❄️
    default: return '🌤️'; // Par défaut
  }
}

function formatSeasonName(seasonName: string): string {
  switch (seasonName?.toLowerCase()) {
    case 'summer': return 'Été';
    case 'winter': return 'Hiver';
    default: return seasonName || 'Inconnue';
  }
}

export default seasonAdminCommand;

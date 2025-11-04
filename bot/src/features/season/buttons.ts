/**
 * Button handlers for Season management
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
import { logger } from "../../services/logger";
import { httpClient } from "../../services/httpClient";
import { STATUS, SYSTEM } from "@shared/constants/emojis";

/**
 * Get color for season embed
 */
function getSeasonColor(season: string): number {
  return season.toLowerCase() === "summer" ? 0xFFA500 : 0x4169E1; // Orange for summer, Royal Blue for winter
}

/**
 * Format season name for display
 */
function formatSeasonName(season: string): string {
  const seasonMap: Record<string, string> = {
    summer: "🌞 Été",
    winter: "❄️ Hiver"
  };
  return seasonMap[season.toLowerCase()] || season;
}

/**
 * Register all Season button handlers
 */
export function registerSeasonButtons(handler: ButtonHandler): void {
  handler.registerHandler("next_season", async (interaction: ButtonInteraction) => {
    logger.info("Bouton NEXT_SEASON cliqué par:", { user: interaction.user.username });

    try {
      await interaction.deferUpdate();

      // Récupérer la saison actuelle pour connaître la suivante
      const currentResponse = await httpClient.get('/seasons/current');

      if (!currentResponse.data) {
        await interaction.editReply({
          content: `${STATUS.ERROR} Impossible de récupérer la saison actuelle.`,
          embeds: [],
          components: []
        });
        return;
      }

      logger.info(`${STATUS.STATS} Saison actuelle récupérée:`, { season: currentResponse.data });

      const currentSeason = currentResponse.data;

      // Vérifier la structure des données
      if (!currentSeason || !currentSeason.name) {
        logger.error(`${STATUS.ERROR} Structure de données invalide:`, { received: currentSeason });
        await interaction.editReply({
          content: `${STATUS.ERROR} Format de données de saison invalide.`,
          embeds: [],
          components: []
        });
        return;
      }

      // Déterminer la prochaine saison (cycle été/hiver uniquement)
      const currentSeasonName = currentSeason.name.toLowerCase();
      const nextSeason = currentSeasonName === 'summer' ? 'winter' : 'summer';

      logger.info(`${SYSTEM.REFRESH} Changement de saison:`, { from: currentSeasonName, to: nextSeason });

      // Changer la saison
      const response = await httpClient.post('/seasons/set', {
        season: nextSeason,
        adminId: interaction.user.id
      });

      logger.info(`${STATUS.SUCCESS} Réponse de changement de saison reçue:`, { status: response.status, data: response.data });

      const result = response.data;
      const embed = {
        color: getSeasonColor(result.newSeason),
        title: `${STATUS.SUCCESS} Saison changée avec succès`,
        fields: [
          {
            name: `${SYSTEM.REFRESH} Changement`,
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

      await interaction.editReply({
        embeds: [embed],
        components: [] // Retirer les boutons après le changement
      });

      // Le message de succès est déjà affiché dans l'embed de réponse

    } catch (error: unknown) {
      logger.error(`${STATUS.ERROR} Erreur lors du changement de saison:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: (error as { response?: { data?: unknown } })?.response?.data,
        status: (error as { response?: { status?: number } })?.response?.status
      });
      await interaction.editReply({
        content: `${STATUS.ERROR} Erreur lors du changement de saison : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        embeds: [],
        components: []
      });
    }
  });
}

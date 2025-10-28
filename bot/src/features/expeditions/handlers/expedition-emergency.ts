/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { validateCharacterExists } from "../../../utils/character-validation";
import { replyEphemeral } from "../../../utils/interaction-helpers";

/**
 * Gestionnaire pour le bouton "Voter retour d'urgence"
 */
export async function handleEmergencyReturnButton(interaction: any) {
  try {
    // Extract expedition ID from customId (format: expedition_emergency_return:expeditionId)
    const expeditionId = interaction.customId.split(":")[1];

    if (!expeditionId) {
      await replyEphemeral(interaction, "❌ ID d'expédition invalide.");
      return;
    }

    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await replyEphemeral(
          interaction,
          "❌ Tu dois avoir un personnage actif pour voter. Utilisez d'abord la commande `/start` pour créer un personnage."
        );
        return;
      }
      throw error;
    }

    if (!character) {
      await replyEphemeral(
        interaction,
        "❌ Tu dois avoir un personnage actif pour voter."
      );
      return;
    }

    try {
      validateCharacterExists(character);
    } catch (error) {
      if (error instanceof Error) {
        await replyEphemeral(interaction, error.message);
        return;
      }
      throw error;
    }

    // Toggle emergency vote via API
    try {
      const result = await apiService.expeditions.toggleEmergencyVote(
        expeditionId,
        interaction.user.id
      );

      const { voted, totalVotes, membersCount, thresholdReached } = result;

      // Build response message
      let message = voted
        ? `✅ Ton vote pour le retour d'urgence a été enregistré.`
        : `✅ Ton vote pour le retour d'urgence a été retiré.`;

      message += `\n\n📊 **Votes:** ${totalVotes}/${membersCount} (Seuil: ${Math.ceil(
        membersCount / 2
      )})`;

      if (thresholdReached) {
        message += `\n\n🚨 **Le retour d'urgence a été voté !**\n\n L'expédition sera de retour demain matin.`;
      }

      await replyEphemeral(interaction, message);

      // Log the vote action
      const logMessage = voted
        ? `🚨 **${character.name}** a voté pour le retour d'urgence (${totalVotes}/${membersCount})`
        : `🔄 **${character.name}** a retiré son vote de retour d'urgence (${totalVotes}/${membersCount})`;

      await apiService.expeditions.sendExpeditionLog(
        expeditionId,
        interaction.guildId!,
        logMessage
      );

      logger.info("Emergency return vote toggled", {
        expeditionId,
        characterId: character.id,
        characterName: character.name,
        userId: interaction.user.id,
        voted,
        totalVotes,
        membersCount,
        thresholdReached,
      });
    } catch (error: any) {
      // Extract error message safely to avoid circular structure
      let errorMessage = "Erreur inconnue";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      await replyEphemeral(
        interaction,
        `❌ Erreur lors du vote: ${errorMessage}`
      );

      // Log error safely without circular references
      logger.error("Error toggling emergency vote:", {
        message: errorMessage,
        statusCode: error?.response?.status,
        expeditionId,
        userId: interaction.user.id,
      });
    }
  } catch (error) {
    logger.error("Error in emergency return button handler:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await replyEphemeral(
      interaction,
      `❌ Erreur lors du traitement de votre vote: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
}

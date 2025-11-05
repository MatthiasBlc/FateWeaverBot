import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { httpClient } from "../../services/httpClient";
import { logger } from "../../services/logger";
import { sendLogMessageWithExpeditionContext } from "../../utils/channels";
import { CAPABILITIES, STATUS } from "../../constants/emojis";
import { handleCapabilityAdminLog } from "../../utils/capability-helpers";

/**
 * Gère le choix du nombre de PA pour pêcher
 */
export async function handleFishingPAChoice(interaction: any) {
  if (!interaction.isButton()) return;

  const [, characterId, userId, paStr] = interaction.customId.split(":");
  const paToUse = parseInt(paStr, 10);

  // Vérifier que l'utilisateur qui clique est bien le propriétaire
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: `${STATUS.ERROR} Vous ne pouvez utiliser que vos propres capacités.`,
      flags: ["Ephemeral"],
    });
    return;
  }

  await interaction.deferReply({ flags: ["Ephemeral"] });

  try {
    await executeFishing(interaction, characterId, paToUse);
  } catch (error: any) {
    logger.error("Error handling fishing PA choice:", { error });
    await interaction.editReply(
      `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
    );
  }
}

/**
 * Exécute la capacité pêcher avec les paramètres donnés
 */
async function executeFishing(
  interaction: any,
  characterId: string,
  paToUse: number
) {
  try {
    // Récupérer la capacité Pêcher pour obtenir son ID
    const capabilitiesResponse = await httpClient.get(`/characters/${characterId}/capabilities`);
    const capabilities = capabilitiesResponse.data;
    const fishingCapability = capabilities.find((cap: any) => cap.capability.name === "Pêcher");

    if (!fishingCapability) {
      throw new Error("Capacité Pêcher non trouvée");
    }

    const response = await httpClient.post(`/characters/${characterId}/capabilities/use`, {
      capabilityId: fishingCapability.capability.id,
      paToUse,
    });

    const result = response.data;

    // Afficher le résultat
    if (result.publicMessage && interaction.guildId) {
      await sendLogMessageWithExpeditionContext(interaction.guildId, interaction.client, result.publicMessage, characterId);
    }

    await interaction.editReply({
      content: `${CAPABILITIES.FISH} **Pêcher**\n${result.message || ""}`,
      components: [],
    });

    // Log admin - Récupérer le nom du personnage
    if (interaction.guildId && result.success) {
      const characterResponse = await httpClient.get(`/characters/${characterId}`);
      const character = characterResponse.data;
      await handleCapabilityAdminLog(
        interaction.guildId,
        interaction.client,
        character.name,
        "Pêcher",
        CAPABILITIES.FISH,
        paToUse,
        result
      );
    }
  } catch (error: any) {
    logger.error("Error executing fishing:", { error });
    throw error;
  }
}

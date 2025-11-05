/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from "../../services/httpClient";
import { logger } from "../../services/logger";
import { sendLogMessageWithExpeditionContext } from "../../utils/channels";
import { CAPABILITIES, STATUS } from "../../constants/emojis";
import { handleCapabilityAdminLog } from "../../utils/capability-helpers";

/**
 * Gère le choix du nombre de PA pour rechercher
 */
export async function handleResearchingPAChoice(interaction: any) {
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
    await executeResearching(interaction, characterId, paToUse);
  } catch (error: any) {
    logger.error("Error handling researching PA choice:", { error });
    await interaction.editReply(
      `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
    );
  }
}

/**
 * Exécute la capacité rechercher avec les paramètres donnés
 */
async function executeResearching(
  interaction: any,
  characterId: string,
  paToUse: number
) {
  try {
    logger.info("Executing researching with PA:", { characterId, paToUse });

    // Récupérer la capacité Rechercher pour obtenir son ID
    const capabilitiesResponse = await httpClient.get(`/characters/${characterId}/capabilities`);
    const capabilities = capabilitiesResponse.data;
    const researchingCapability = capabilities.find((cap: any) => cap.capability.name === "Rechercher");

    if (!researchingCapability) {
      throw new Error("Capacité Rechercher non trouvée");
    }

    const response = await httpClient.post(`/characters/${characterId}/capabilities/use`, {
      capabilityId: researchingCapability.capability.id,
      paToUse,
    });

    const result = response.data;
    logger.info("Researching result received:", { success: result.success });

    // Afficher le résultat public avec remplacement des tags admin
    if (result.publicMessage && interaction.guildId) {
      let finalMessage = result.publicMessage;

      // Remplacer {ADMIN_TAG} par les tags des admins si présent
      if (finalMessage.includes('{ADMIN_TAG}')) {
        const guild = interaction.guild;
        if (guild) {
          try {
            logger.info("Fetching admin roles for researching");
            // Récupérer les rôles avec permission Administrator
            const adminRoles = guild.roles.cache
              .filter((role: any) => role.permissions.has('Administrator'))
              .map((role: any) => `<@&${role.id}>`)
              .join(' ');

            finalMessage = finalMessage.replace('{ADMIN_TAG}', adminRoles || '@everyone');
            logger.info("Admin roles found:", { adminRoles: adminRoles || 'none' });
          } catch (error) {
            logger.error("Error fetching admin roles:", { error });
            finalMessage = finalMessage.replace('{ADMIN_TAG}', '@everyone');
          }
        } else {
          finalMessage = finalMessage.replace('{ADMIN_TAG}', '@everyone');
        }
      }

      logger.info("Sending log message for researching");
      await sendLogMessageWithExpeditionContext(interaction.guildId, interaction.client, finalMessage, characterId);
      logger.info("Log message sent successfully");
    }

    logger.info("Editing reply for researching");
    await interaction.editReply({
      content: `${CAPABILITIES.RESEARCHING} **Rechercher**\n${result.message || ""}`,
      components: [],
    });
    logger.info("Reply edited successfully");

    // Log admin
    if (interaction.guildId && result.success) {
      await handleCapabilityAdminLog(
        interaction.guildId,
        interaction.client,
        interaction.user.username,
        "Rechercher",
        CAPABILITIES.RESEARCHING,
        paToUse,
        result
      );
    }
  } catch (error: any) {
    logger.error("Error executing researching:", { error });
    throw error;
  }
}

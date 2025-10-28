/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from "../../services/httpClient";
import { logger } from "../../services/logger";
import { sendLogMessageWithExpeditionContext } from "../../utils/channels";
import { CAPABILITIES, STATUS } from "../../constants/emojis";

/**
 * Gère le choix du nombre de PA pour cartographier
 */
export async function handleCartographyPAChoice(interaction: any) {
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
    await executeCartography(interaction, characterId, paToUse);
  } catch (error: any) {
    logger.error("Error handling cartography PA choice:", { error });
    await interaction.editReply(
      `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
    );
  }
}

/**
 * Exécute la capacité cartographier avec les paramètres donnés
 */
async function executeCartography(
  interaction: any,
  characterId: string,
  paToUse: number
) {
  try {
    logger.info("Executing cartography with PA:", { characterId, paToUse });

    // Récupérer la capacité Cartographier pour obtenir son ID
    const capabilitiesResponse = await httpClient.get(`/characters/${characterId}/capabilities`);
    const capabilities = capabilitiesResponse.data;
    const cartographyCapability = capabilities.find((cap: any) => cap.capability.name === "Cartographier");

    if (!cartographyCapability) {
      throw new Error("Capacité Cartographier non trouvée");
    }

    const response = await httpClient.post(`/characters/${characterId}/capabilities/use`, {
      capabilityId: cartographyCapability.capability.id,
      paToUse,
    });

    const result = response.data;
    logger.info("Cartography result received:", { success: result.success });

    // Afficher le résultat public avec remplacement des tags admin
    if (result.publicMessage && interaction.guildId) {
      let finalMessage = result.publicMessage;

      // Remplacer {ADMIN_TAG} par les tags des admins si présent
      if (finalMessage.includes('{ADMIN_TAG}')) {
        const guild = interaction.guild;
        if (guild) {
          try {
            logger.info("Fetching admin roles for cartography");
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

      logger.info("Sending log message for cartography");
      await sendLogMessageWithExpeditionContext(interaction.guildId, interaction.client, finalMessage, characterId);
      logger.info("Log message sent successfully");
    }

    logger.info("Editing reply for cartography");
    await interaction.editReply({
      content: `${CAPABILITIES.CARTOGRAPHING} **Cartographier**\n${result.message || ""}`,
      components: [],
    });
    logger.info("Reply edited successfully");
  } catch (error: any) {
    logger.error("Error executing cartography:", { error });
    throw error;
  }
}

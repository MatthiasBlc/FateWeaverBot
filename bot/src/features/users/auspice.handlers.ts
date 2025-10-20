import { httpClient } from "../../services/httpClient";
import { logger } from "../../services/logger";
import { sendLogMessage } from "../../utils/channels";
import { CAPABILITIES, STATUS } from "../../constants/emojis";

/**
 * Gère le choix du nombre de PA pour auspice
 */
export async function handleAuspicePAChoice(interaction: any) {
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
    await executeAuspice(interaction, characterId, paToUse);
  } catch (error: any) {
    logger.error("Error handling auspice PA choice:", { error });
    await interaction.editReply(
      `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
    );
  }
}

/**
 * Exécute la capacité auspice avec les paramètres donnés
 */
async function executeAuspice(
  interaction: any,
  characterId: string,
  paToUse: number
) {
  try {
    logger.info("Executing auspice with PA:", { characterId, paToUse });

    const response = await httpClient.post(`/characters/${characterId}/capabilities/use`, {
      capabilityName: "Auspice",
      paToUse,
    });

    const result = response.data;
    logger.info("Auspice result received:", { success: result.success });

    // Afficher le résultat public avec remplacement des tags admin
    if (result.publicMessage && interaction.guildId) {
      let finalMessage = result.publicMessage;

      // Remplacer {ADMIN_TAG} par les tags des admins si présent
      if (finalMessage.includes('{ADMIN_TAG}')) {
        const guild = interaction.guild;
        if (guild) {
          try {
            logger.info("Fetching admin roles for auspice");
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

      logger.info("Sending log message for auspice");
      await sendLogMessage(interaction.guildId, interaction.client, finalMessage);
      logger.info("Log message sent successfully");
    }

    logger.info("Editing reply for auspice");
    await interaction.editReply({
      content: `${CAPABILITIES.AUGURING} **Auspice**\n${result.message || ""}`,
      components: [],
    });
    logger.info("Reply edited successfully");
  } catch (error: any) {
    logger.error("Error executing auspice:", { error });
    throw error;
  }
}

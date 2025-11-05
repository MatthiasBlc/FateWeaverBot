/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalSubmitInteraction,
} from "discord.js";
import { httpClient } from "../services/httpClient";
import { logger } from "../services/logger";
import { sendLogMessageWithExpeditionContext } from "../utils/channels";
import { CAPABILITIES, STATUS } from "../constants/emojis";
import { handleCapabilityAdminLog } from "../utils/capability-helpers";

/**
 * Crée le modal pour cartographier avec 1 PA (1 case)
 */
export function createCartography1PAModal(characterId: string, userId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`cartography_1pa_modal_${characterId}_${userId}`)
    .setTitle("Cartographier - 1 PA");

  const locationInput = new TextInputBuilder()
    .setCustomId("location")
    .setLabel("Coordonnées du lieu étudié")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("F8")
    .setMinLength(2)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    locationInput
  );

  modal.addComponents([firstRow]);

  return modal;
}

/**
 * Crée le modal pour cartographier avec 2 PA (3 cases)
 */
export function createCartography2PAModal(characterId: string, userId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`cartography_2pa_modal_${characterId}_${userId}`)
    .setTitle("Cartographier - 2 PA");

  const location1Input = new TextInputBuilder()
    .setCustomId("location1")
    .setLabel("Coordonnées du lieu 1")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("F8")
    .setMinLength(2)
    .setMaxLength(10);

  const location2Input = new TextInputBuilder()
    .setCustomId("location2")
    .setLabel("Coordonnées du lieu 2")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("G7")
    .setMinLength(2)
    .setMaxLength(10);

  const location3Input = new TextInputBuilder()
    .setCustomId("location3")
    .setLabel("Coordonnées du lieu 3")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("H4")
    .setMinLength(2)
    .setMaxLength(10);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(location1Input);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(location2Input);
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(location3Input);

  modal.addComponents([firstRow, secondRow, thirdRow]);

  return modal;
}

/**
 * Gère la soumission du modal de cartographie 1 PA
 */
export async function handleCartography1PAModal(
  interaction: ModalSubmitInteraction
) {
  try {
    // customId format: cartography_1pa_modal_<characterId>_<userId>
    const parts = interaction.customId.split("_");
    const characterId = parts[3]; // Index 3 contient le characterId
    const location = interaction.fields.getTextInputValue("location").trim();

    if (!location) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous devez indiquer les coordonnées du lieu.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    await executeCartography(interaction, characterId, 1, [location]);
  } catch (error: any) {
    logger.error("Error handling cartography 1PA modal:", { error });
    await interaction.reply({
      content: `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`,
      flags: ["Ephemeral"],
    }).catch(() => {
      // Si la réponse échoue, essayer editReply
      interaction.editReply(
        `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
      );
    });
  }
}

/**
 * Gère la soumission du modal de cartographie 2 PA
 */
export async function handleCartography2PAModal(
  interaction: ModalSubmitInteraction
) {
  try {
    // customId format: cartography_2pa_modal_<characterId>_<userId>
    const parts = interaction.customId.split("_");
    const characterId = parts[3]; // Index 3 contient le characterId
    const location1 = interaction.fields.getTextInputValue("location1").trim();
    const location2 = interaction.fields.getTextInputValue("location2").trim();
    const location3 = interaction.fields.getTextInputValue("location3").trim();

    if (!location1 || !location2 || !location3) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous devez indiquer les trois coordonnées.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    await executeCartography(interaction, characterId, 2, [location1, location2, location3]);
  } catch (error: any) {
    logger.error("Error handling cartography 2PA modal:", { error });
    await interaction.reply({
      content: `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`,
      flags: ["Ephemeral"],
    }).catch(() => {
      // Si la réponse échoue, essayer editReply
      interaction.editReply(
        `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
      );
    });
  }
}

/**
 * Exécute la capacité cartographier avec les paramètres donnés
 */
async function executeCartography(
  interaction: any,
  characterId: string,
  paToUse: number,
  locations: string[]
) {
  try {
    logger.info("Executing cartography with PA:", { characterId, paToUse, locations });

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
      locations, // Ajout des coordonnées
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

      // Si pas de channel admin configuré, ajouter les coordonnées au message public
      const { getAdminLogChannel } = await import("../services/admin-log.service");
      const adminLogChannel = await getAdminLogChannel(interaction.guildId, interaction.client);
      if (!adminLogChannel && locations.length > 0) {
        finalMessage += `\n**Lieu${locations.length > 1 ? 'x' : ''} :** ${locations.join(', ')}`;
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

    // Log admin - Récupérer le nom du personnage
    if (interaction.guildId && result.success) {
      const characterResponse = await httpClient.get(`/characters/${characterId}`);
      const character = characterResponse.data;
      await handleCapabilityAdminLog(
        interaction.guildId,
        interaction.client,
        character.name, // Utilise le nom du personnage
        "Cartographier",
        CAPABILITIES.CARTOGRAPHING,
        paToUse,
        result,
        locations // Passer les coordonnées au log admin
      );
    }
  } catch (error: any) {
    logger.error("Error executing cartography:", { error });
    throw error;
  }
}

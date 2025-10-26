import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  TextChannel,
  type GuildMember,
  type ModalSubmitInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand, getActiveCharacterFromModal } from "../../../utils/character";
import { createExpeditionCreationModal } from "../../../modals/expedition-modals";
import { getTownByGuildId } from "../../../services/towns.service";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { validateCharacterAlive } from "../../../utils/character-validation";
import { replyEphemeral, replyError } from "../../../utils/interaction-helpers";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { DIRECTION, EXPEDITION, RESOURCES } from "@shared/constants/emojis";
import { expeditionCache } from "../../../services/expedition-cache";
import { emojiCache } from "../../../services/emoji-cache";

/**
 * Gestionnaire pour le bouton "Créer une nouvelle expédition"
 * Version adaptée pour les boutons (convertit ButtonInteraction en ChatInputCommandInteraction)
 */
export async function handleExpeditionCreateNewButton(interaction: any) {
  try {
    // Créer une interaction de commande complète à partir de l'interaction de bouton
    const commandInteraction = {
      ...interaction,
      isChatInputCommand: () => true,
      options: {
        getSubcommand: () => 'start',
        getString: (name: string) => {
          // Pour les boutons, pas de paramètres à récupérer
          return null;
        }
      },
      guildId: interaction.guildId,
      guild: interaction.guild,
      channelId: interaction.channelId,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      client: interaction.client,
      createdAt: interaction.createdAt,
      reply: interaction.reply.bind(interaction),
      deferReply: interaction.deferReply?.bind(interaction),
      editReply: interaction.editReply?.bind(interaction),
      followUp: interaction.followUp?.bind(interaction),
      deferUpdate: interaction.deferUpdate?.bind(interaction),
      update: interaction.update?.bind(interaction),
      showModal: interaction.showModal?.bind(interaction)
    } as ChatInputCommandInteraction;

    await handleExpeditionStartCommand(commandInteraction);
  } catch (error) {
    logger.error("Error in expedition create new button:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de l'ouverture du formulaire de création d'expédition.");
  }
}

export async function handleExpeditionStartCommand(
  interaction: ChatInputCommandInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get town info
    const town = await getTownByGuildId(interaction.guildId!);
    if (!town) {
      await replyEphemeral(interaction, "❌ Aucune ville trouvée pour ce serveur.");
      return;
    }

    // Get user's active character FIRST, before showing modal
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await replyEphemeral(interaction, ERROR_MESSAGES.CHARACTER_DEAD_EXPEDITION);
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await replyEphemeral(interaction, ERROR_MESSAGES.NO_CHARACTER);
      return;
    }

    try {
      validateCharacterAlive(character);
    } catch (error) {
      if (error instanceof Error) {
        await replyEphemeral(interaction, error.message);
        return;
      }
      throw error;
    }

    // Check if character is already on an expedition
    const activeExpeditions =
      await apiService.expeditions.getActiveExpeditionsForCharacter(
        character.id
      );
    if (activeExpeditions && activeExpeditions.length > 0) {
      await replyEphemeral(interaction, `❌ Votre personnage est déjà sur une expédition active: **${activeExpeditions[0].name}**.`);
      return;
    }

    // Show modal for expedition creation
    const modal = createExpeditionCreationModal();
    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in expedition start command:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de la création de l'expédition: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
}

export async function handleExpeditionCreationModal(
  interaction: ModalSubmitInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    const name = interaction.fields.getTextInputValue("expedition_name_input");

    // Récupérer les valeurs des champs séparés pour vivres et repas
    const vivresValue = interaction.fields.getTextInputValue("expedition_vivres_input") || "0";
    const repasValue = interaction.fields.getTextInputValue("expedition_nourriture_input") || "0";

    const duration = interaction.fields.getTextInputValue("expedition_duration_input");

    // Convertir en nombres et calculer le total
    const vivresAmount = parseInt(vivresValue, 10) || 0;
    const repasAmount = parseInt(repasValue, 10) || 0;
    const foodStock = vivresAmount + repasAmount;

    // Validate inputs
    const durationDays = parseInt(duration, 10);

    // Get character ID from modal interaction
    const character = await getActiveCharacterFromModal(interaction);
    if (!character) {
      await replyEphemeral(interaction, ERROR_MESSAGES.NO_CHARACTER);
      return;
    }

    if (isNaN(foodStock) || foodStock <= 0) {
      await replyEphemeral(interaction, "❌ Le stock de nourriture total (vivres + repas) doit être un nombre positif.");
      return;
    }

    if (isNaN(durationDays) || durationDays < 1) {
      await replyEphemeral(interaction, "❌ La durée doit être d'au moins 1 jour.");
      return;
    }

    // Get town info
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    if (!townResponse) {
      await replyEphemeral(interaction, "❌ Aucune ville trouvée pour ce serveur.");
      return;
    }

    // Create expedition
    logger.debug("Creating expedition", {
      name,
      vivresAmount,
      repasAmount,
      totalFoodStock: foodStock,
      duration: durationDays,
      townId: townResponse.id,
      characterId: character.id,
      createdBy: interaction.user.id,
    });

    // Construire le tableau des ressources initiales
    const initialResources = [];

    if (vivresAmount > 0) {
      initialResources.push({ resourceTypeName: "Vivres", quantity: vivresAmount });
    }

    if (repasAmount > 0) {
      initialResources.push({ resourceTypeName: "Repas", quantity: repasAmount });
    }

    // Store expedition data in cache and generate short ID
    const expeditionId = expeditionCache.store(interaction.user.id, {
      name,
      townId: townResponse.id,
      initialResources,
      duration: durationDays,
    });

    // Show direction selection menu with short customId
    const directionMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_direction:${expeditionId}`)
      .setPlaceholder("Choisissez la direction initiale...")
      .addOptions([
        {
          label: "Nord",
          value: "NORD",
          emoji: "⬆️",
        },
        {
          label: "Nord-Est",
          value: "NORD_EST",
          emoji: "↗️",
        },
        {
          label: "Est",
          value: "EST",
          emoji: "➡️",
        },
        {
          label: "Sud-Est",
          value: "SUD_EST",
          emoji: "↘️",
        },
        {
          label: "Sud",
          value: "SUD",
          emoji: "⬇️",
        },
        {
          label: "Sud-Ouest",
          value: "SUD_OUEST",
          emoji: "↙️",
        },
        {
          label: "Ouest",
          value: "OUEST",
          emoji: "⬅️",
        },
        {
          label: "Nord-Ouest",
          value: "NORD_OUEST",
          emoji: "↖️",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      directionMenu
    );

    await interaction.reply({
      content: `📍 Choisissez la direction initiale de l'expédition **${name}** :`,
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    logger.error("Error in expedition creation modal:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de la création de l'expédition: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
}

export async function handleExpeditionDirectionSelect(
  interaction: any
): Promise<void> {
  try {
    const direction = interaction.values[0];
    const expeditionId = interaction.customId.split(":")[1];

    // Retrieve expedition data from cache
    const expeditionData = expeditionCache.retrieve(expeditionId, interaction.user.id);

    if (!expeditionData) {
      await interaction.reply({
        content: "❌ Les données de l'expédition ont expiré ou sont invalides. Veuillez recréer l'expédition.",
        ephemeral: true,
      });
      return;
    }

    const character = await getActiveCharacterFromModal(interaction);

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour créer une expédition.",
        ephemeral: true,
      });
      return;
    }

    // Create expedition with direction
    const createData = {
      name: expeditionData.name,
      townId: expeditionData.townId,
      initialResources: expeditionData.initialResources,
      duration: expeditionData.duration,
      initialDirection: direction,
      createdBy: interaction.user.id,
      characterId: character.id,
    };

    const expedition = await apiService.expeditions.createExpedition(createData);

    // Auto-join creator
    await apiService.expeditions.joinExpedition(
      expedition.data.id,
      character.id
    );

    // Remove from cache after successful creation
    expeditionCache.remove(expeditionId);

    await interaction.update({
      content: `${EXPEDITION.ICON} L'expédition **${expedition.data.name}** se prépare à partir !\nElle prendra la direction : ${getDirectionText(direction)} ${getDirectionEmoji(direction)}`,
      components: [],
    });

    // Send public log message
    try {
      const logMessage = `${EXPEDITION.ICON} **Nouvelle expédition créée**\n**${character.name}** prépare une expédition **${expedition.data.name}**\n\n${RESOURCES.GENERIC} **Ressources** : ${expeditionData.initialResources.map((r: any) => `${emojiCache.getEmoji("resource", r.resourceTypeName)} ${r.quantity}`).join(", ")}\n${EXPEDITION.DURATION} Durée : ${expeditionData.duration} jours\n${EXPEDITION.ICON} Direction : ${getDirectionText(direction)}`;
      await sendLogMessage(
        interaction.guildId!,
        interaction.client,
        logMessage
      );
    } catch (error) {
      logger.warn("Could not send public embed to log channel:", error);
    }

    logger.info("Expedition created via Discord with direction", {
      expeditionId: expedition.data.id,
      name: expedition.data.name,
      createdBy: interaction.user.id,
      guildId: interaction.guildId,
      characterId: character.id,
      characterName: character.name,
      initialDirection: direction,
      duration: expeditionData.duration,
    });
  } catch (error: any) {
    logger.error("Error in expedition direction select:", {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });

    const errorMessage = error?.response?.data?.error || error?.message || "Erreur inconnue";
    await interaction.reply({
      content: `❌ Erreur lors de la création : ${errorMessage}`,
      ephemeral: true,
    });
  }
}

function getDirectionEmoji(direction: string): string {
  const emojis: Record<string, string> = {
    NORD: DIRECTION.NORTH,
    NORD_EST: DIRECTION.NORTHEAST,
    EST: DIRECTION.EAST,
    SUD_EST: DIRECTION.SOUTHEAST,
    SUD: DIRECTION.SOUTH,
    SUD_OUEST: DIRECTION.SOUTHWEST,
    OUEST: DIRECTION.WEST,
    NORD_OUEST: DIRECTION.NORTHWEST,
    UNKNOWN: DIRECTION.UNKNOWN,
  };
  return emojis[direction] || DIRECTION.UNKNOWN;
}

function getDirectionText(direction: string): string {
  const texts: Record<string, string> = {
    NORD: "Nord",
    NORD_EST: "Nord-Est",
    EST: "Est",
    SUD_EST: "Sud-Est",
    SUD: "Sud",
    SUD_OUEST: "Sud-Ouest",
    OUEST: "Ouest",
    NORD_OUEST: "Nord-Ouest",
    UNKNOWN: "Inconnue",
  };
  return texts[direction] || "Inconnue";
}

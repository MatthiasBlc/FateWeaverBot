import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  type GuildMember,
  type ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { getTownByGuildId } from "../../../services/towns.service";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { getStatusEmoji, canJoinExpedition } from "../expedition-utils";
import { Expedition } from "../../../types/entities";
import { validateCharacterAlive } from "../../../utils/character-validation";
import { replyEphemeral, replyError } from "../../../utils/interaction-helpers";
import { ERROR_MESSAGES } from "../../../constants/messages.js";

/**
 * Gestionnaire pour le bouton "Rejoindre une expédition"
 * Version adaptée pour les boutons (convertit ButtonInteraction en ChatInputCommandInteraction)
 */
export async function handleExpeditionJoinExistingButton(interaction: any) {
  try {
    // Créer une interaction de commande complète à partir de l'interaction de bouton
    const commandInteraction = {
      ...interaction,
      isChatInputCommand: () => true,
      options: {
        getSubcommand: () => 'join',
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
      update: interaction.update?.bind(interaction)
    } as ChatInputCommandInteraction;

    await handleExpeditionJoinCommand(commandInteraction);
  } catch (error) {
    logger.error("Error in expedition join existing button:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de l'ouverture de la liste d'expéditions.");
  }
}

export async function handleExpeditionJoinCommand(
  interaction: ChatInputCommandInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get town info
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    if (!townResponse) {
      await replyEphemeral(interaction, "❌ Aucune ville trouvée pour ce serveur.");
      return;
    }

    // Get user's active character
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

    // Check if character is already in an active expedition
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(
      character.id
    );

    if (activeExpeditions && activeExpeditions.length > 0) {
      const activeExpedition = activeExpeditions[0]; // Prend la première expédition active trouvée
      await replyEphemeral(interaction, `❌ Vous êtes déjà dans l'expédition **${activeExpedition.name}** (${getStatusEmoji(activeExpedition.status)} ${activeExpedition.status.toLowerCase()}).`);
      return;
    }

    // Get available expeditions (PLANNING status)
    const expeditions = await apiService.expeditions.getExpeditionsByTown(townResponse.id);

    const availableExpeditions = expeditions.filter(
      (exp: Expedition) => exp.status === "PLANNING"
    );

    if (availableExpeditions.length === 0) {
      await replyEphemeral(interaction, "❌ Aucune expédition en cours de planification disponible.");
      return;
    }

    // Create dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_join_select")
      .setPlaceholder("Sélectionnez une expédition à rejoindre")
      .addOptions(
        availableExpeditions.map((exp: Expedition) => ({
          label: exp.name,
          description: `Durée: ${exp.duration}j, Membres: 0`, // Plus d'accès à foodStock et members
          value: exp.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await replyEphemeral(interaction, "Choisissez une expédition à rejoindre:");
  } catch (error) {
    logger.error("Error in expedition join command:", { error });
    await replyEphemeral(interaction, ERROR_MESSAGES.EXPEDITION_FETCH_ERROR);
  }
}

export async function handleExpeditionJoinSelect(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;
  const expeditionId = interaction.values[0];

  try {
    // Get user's active character
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

    await interaction.update({
      content: `✅ Vous avez rejoint l'expédition avec succès!`,
      components: [],
    });

    logger.info("Character joined expedition via Discord", {
      expeditionId,
      characterId: character.id,
      joinedBy: user.id,
    });
  } catch (error) {
    logger.error("Error in expedition join select:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de la participation à l'expédition: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
}

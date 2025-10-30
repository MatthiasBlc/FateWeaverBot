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
import { getStatusEmoji, getStatusEmojiOnly, canJoinExpedition, getDirectionEmoji, getDirectionText } from "../expedition-utils";
import { Expedition } from "../../../types/entities";
import { validateCharacterAlive } from "../../../utils/character-validation";
import { replyEphemeral, replyError } from "../../../utils/interaction-helpers";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { STATUS } from "../../../constants/emojis.js";
import { withErrorHandler, is404Error } from "../../../utils/error-handlers";


/**
 * Gestionnaire pour le bouton "Rejoindre une expédition"
 * Version adaptée pour les boutons (convertit ButtonInteraction en ChatInputCommandInteraction)
 */
export async function handleExpeditionJoinExistingButton(interaction: any) {
  await withErrorHandler(interaction, async () => {
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
  }, {
    context: "l'ouverture de la liste d'expéditions",
    customMessage: `${STATUS.ERROR} Erreur lors de l'ouverture de la liste d'expéditions.`
  });
}

export async function handleExpeditionJoinCommand(
  interaction: ChatInputCommandInteraction
) {
  await withErrorHandler(interaction, async () => {
    const member = interaction.member as GuildMember;
    const user = interaction.user;

    // Get town info
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    if (!townResponse) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`);
      return;
    }

    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error) {
      // Handle 404 specifically (dead character)
      if (is404Error(error)) {
        await replyEphemeral(interaction, ERROR_MESSAGES.CHARACTER_DEAD_EXPEDITION);
        return;
      }
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
      const activeExpedition = activeExpeditions[0];
      await replyEphemeral(interaction, `❌ Vous êtes déjà dans l'expédition **${activeExpedition.name}** (${getStatusEmoji(activeExpedition.status)} ${activeExpedition.status.toLowerCase()}).`);
      return;
    }

    // Get available expeditions (PLANNING or DEPARTED status)
    const expeditions = await apiService.expeditions.getExpeditionsByTown(townResponse.id);

    const availableExpeditions = expeditions.filter(
      (exp: Expedition) => exp.status === "PLANNING" || exp.status === "DEPARTED"
    );

    if (availableExpeditions.length === 0) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune expédition disponible (en planification ou en cours).`);
      return;
    }

    // Create dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_join_select")
      .setPlaceholder("Sélectionnez une expédition à rejoindre")
      .addOptions(
        availableExpeditions.map((exp: Expedition) => {
          const statusEmoji = getStatusEmojiOnly(exp.status);
          const directionEmoji = getDirectionEmoji(exp.initialDirection);
          const directionText = getDirectionText(exp.initialDirection);
          return {
            label: exp.name,
            description: `${statusEmoji} - ${directionEmoji} ${directionText} - Durée: ${exp.duration}j`,
            value: exp.id,
          };
        })
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez une expédition à rejoindre:",
      components: [row],
      flags: ["Ephemeral"],
    });
  }, {
    context: "la commande de rejoindre une expédition",
    customMessage: ERROR_MESSAGES.EXPEDITION_FETCH_ERROR
  });
}

export async function handleExpeditionJoinSelect(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;
  const expeditionId = interaction.values[0];

  await withErrorHandler(interaction, async () => {
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error) {
      // Handle 404 specifically (dead character)
      if (is404Error(error)) {
        await replyEphemeral(interaction, ERROR_MESSAGES.CHARACTER_DEAD_EXPEDITION);
        return;
      }
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

    // Join the expedition
    await apiService.expeditions.joinExpedition(expeditionId, character.id);

    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);

    await interaction.update({
      content: `✅ Vous avez rejoint l'expédition **${expedition?.name || 'inconnue'}** avec succès!`,
      components: [],
    });

    logger.info("Character joined expedition via Discord", {
      expeditionId,
      expeditionName: expedition?.name,
      characterId: character.id,
      characterName: character.name,
      joinedBy: user.id,
    });
  }, {
    context: "la participation à l'expédition"
  });
}

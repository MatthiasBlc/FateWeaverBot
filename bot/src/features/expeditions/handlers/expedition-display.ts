import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type GuildMember,
  type ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createInfoEmbed, createSuccessEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { Expedition } from "../../../types/entities";
import { getStatusEmoji } from "../expedition-utils";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { validateCharacterAlive } from "../../../utils/character-validation";
import { replyEphemeral } from "../../../utils/interaction-helpers";
import { EXPEDITION, DIRECTION, CONFIG, RESOURCES, CHARACTER } from "@shared/constants/emojis";

/**
 * Nouvelle commande principale pour gérer les expéditions
 * - Si membre d'une expédition : affiche les infos
 * - Si pas membre : affiche la liste avec boutons
 */
export async function handleExpeditionMainCommand(
  interaction: ChatInputCommandInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await interaction.reply({
          content:
            "❌ Aucun personnage vivant trouvé. Utilisez d'abord la commande `/profil` pour créer un personnage.",
          flags: ["Ephemeral"],
        });
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

    // Check if character is already on an active expedition
    const activeExpeditions =
      await apiService.expeditions.getActiveExpeditionsForCharacter(
        character.id,
        user.id // Pass userId to check if user has voted
      );

    if (activeExpeditions && activeExpeditions.length > 0) {
      // Character is a member - show expedition info
      const expedition = activeExpeditions[0];

      // Récupérer les ressources détaillées de l'expédition
      let expeditionResources: any[] = [];
      try {
        expeditionResources = await apiService.getResources(
          "EXPEDITION",
          expedition.id
        );
      } catch (error) {
        logger.warn("Could not fetch expedition resources:", error);
        // Continue without detailed resources if API call fails
      }

      // Build fields array
      const fields: any[] = [
        {
          name: `${EXPEDITION.DURATION} Durée`,
          value: `${expedition.duration} jours`,
          inline: true,
        },
        {
          name: `${CONFIG.LIST} Statut`,
          value: getStatusEmoji(expedition.status),
          inline: true,
        },
      ];

      // Add emergency votes count if DEPARTED and at least 1 vote (after first block)
      if (
        expedition.status === "DEPARTED" &&
        expedition.emergencyVotesCount &&
        expedition.emergencyVotesCount > 0
      ) {
        // Add spacer before votes
        fields.push({ name: "\n", value: "\n", inline: false });

        const membersCount = expedition.members?.length || 0;
        const threshold = Math.ceil(membersCount / 2);
        const votesDisplay = `🚨 **${expedition.emergencyVotesCount}/${membersCount}** (Seuil: ${threshold})`;

        fields.push({
          name: "⚠️ Votes de retour d'urgence",
          value: votesDisplay,
          inline: false,
        });

        // Add countdown to emergency return if threshold is reached
        if (expedition.emergencyVotesCount >= threshold) {
          const now = new Date();
          const tomorrow8am = new Date(now);
          tomorrow8am.setDate(tomorrow8am.getDate() + 1);
          tomorrow8am.setHours(8, 0, 0, 0);

          // If it's already past 8am today, return is tomorrow at 8am
          // If it's before 8am today, return is today at 8am
          const today8am = new Date(now);
          today8am.setHours(8, 0, 0, 0);

          const returnTime = now < today8am ? today8am : tomorrow8am;
          const hoursUntilReturn = Math.floor(
            (returnTime.getTime() - now.getTime()) / (1000 * 60 * 60)
          );
          const minutesUntilReturn = Math.floor(
            ((returnTime.getTime() - now.getTime()) % (1000 * 60 * 60)) /
            (1000 * 60)
          );

          fields.push({
            name: `🚨 Retour d'urgence - Retour dans`,
            value: `${hoursUntilReturn}h ${minutesUntilReturn}min`,
            inline: true,
          });
        }
      }

      // Add initial direction if PLANNING or LOCKED and direction is set
      if (
        (expedition.status === "PLANNING" || expedition.status === "LOCKED") &&
        expedition.initialDirection
      ) {
        fields.push({
          name: `${EXPEDITION.LOCATION} Direction`,
          value: `${getDirectionEmoji(
            expedition.initialDirection
          )} ${getDirectionText(expedition.initialDirection)}`,
          inline: true,
        });
      }

      // Add countdown to departure for LOCKED expeditions
      if (expedition.status === "LOCKED") {
        const now = new Date();
        const tomorrow8am = new Date(now);
        tomorrow8am.setDate(tomorrow8am.getDate() + 1);
        tomorrow8am.setHours(8, 0, 0, 0);

        // If it's already past 8am today, departure is tomorrow at 8am
        // If it's before 8am today, departure is today at 8am
        const today8am = new Date(now);
        today8am.setHours(8, 0, 0, 0);

        const departureTime = now < today8am ? today8am : tomorrow8am;
        const hoursUntilDeparture = Math.floor(
          (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        );
        const minutesUntilDeparture = Math.floor(
          ((departureTime.getTime() - now.getTime()) % (1000 * 60 * 60)) /
          (1000 * 60)
        );

        fields.push({
          name: `${EXPEDITION.DURATION} Départ de l'expédition dans`,
          value: `${hoursUntilDeparture}h ${minutesUntilDeparture}min`,
          inline: true,
        });
      }

      // Add detailed resources if available
      if (expeditionResources && expeditionResources.length > 0) {
        const resourceDetails = expeditionResources
          .filter((resource) => resource.quantity > 0)
          .map(
            (resource) =>
              `${resource.resourceType.emoji} ${resource.resourceType.name}: ${resource.quantity}`
          )
          .join("\n");

        if (resourceDetails) {
          // Add spacer before resources
          fields.push({ name: "\n", value: "\n", inline: false });

          fields.push({
            name: `${RESOURCES.GENERIC} Ressources`,
            value: resourceDetails,
            inline: false,
          });
        }
      }

      // Add path and direction info for DEPARTED expeditions
      if (expedition.status === "DEPARTED") {
        // Add spacer before direction/path block
        if (expedition.currentDayDirection || (expedition.path && expedition.path.length > 0)) {
          fields.push({ name: "\n", value: "\n", inline: false });
        }

        // Add next direction if set (show before path)
        if (expedition.currentDayDirection) {
          fields.push({
            name: `${EXPEDITION.ICON} Prochaine direction`,
            value: `${getDirectionEmoji(
              expedition.currentDayDirection
            )} ${getDirectionText(expedition.currentDayDirection)}\n\n`,
            inline: true,
          });
        }
        // Add path traveled
        if (expedition.path && expedition.path.length > 0) {
          const pathString = expedition.path
            .map((d) => getDirectionEmoji(d))
            .join(" → ");
          fields.push({
            name: "🗺️ Chemin parcouru",
            value: pathString,
            inline: false,
          });
        }
      }

      // Add member list if there are members
      if (expedition.members && expedition.members.length > 0) {
        const memberList = expedition.members
          .map((member) => {
            const characterName = member.character?.name || "Inconnu";
            return `• ${characterName}`;
          })
          .join("\n");

        if (memberList) {
          // Add spacer before member list
          fields.push({ name: "\n", value: "\n", inline: false });

          fields.push({
            name: `${CHARACTER.GROUP} Membres`,
            value: memberList,
            inline: false,
          });
        }
      }

      // Create embed
      const embed = createInfoEmbed(
        `${EXPEDITION.ICON} ${expedition.name}`
      ).addFields(fields);

      logger.info("Expedition embed created", {
        expeditionId: expedition.id,
        fieldsCount: fields.length,
        hasComponents:
          expedition.status === "PLANNING" || expedition.status === "DEPARTED",
      });

      // Add buttons based on expedition status
      const components = [];
      if (expedition.status === "PLANNING") {
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("expedition_leave")
            .setLabel("Quitter")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("expedition_transfer")
            .setLabel("Transférer ressources")
            .setStyle(ButtonStyle.Primary)
        );
        components.push(buttonRow);
      } else if (expedition.status === "DEPARTED") {
        // Determine button label based on vote status
        const emergencyButtonLabel = expedition.currentUserVoted
          ? "❌ Annuler retour d'urgence"
          : "🚨 Voter retour d'urgence";

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`expedition_emergency_return:${expedition.id}`)
            .setLabel(emergencyButtonLabel)
            .setStyle(ButtonStyle.Secondary)
        );

        // Check if it's the last day (day before return)
        const isLastDay = (() => {
          if (!expedition.returnAt) return false;

          const now = new Date();
          const returnDate = new Date(expedition.returnAt);

          // Calculate hours until return
          const hoursUntilReturn =
            (returnDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          // Last day = less than 24 hours until return
          return hoursUntilReturn < 24;
        })();

        // Add direction button if DEPARTED, no direction set, and NOT last day
        if (!expedition.currentDayDirection && !isLastDay) {
          const directionButton = new ButtonBuilder()
            .setCustomId(`expedition_choose_direction:${expedition.id}`)
            .setLabel("Choisir Direction")
            .setEmoji(EXPEDITION.ICON)
            .setStyle(ButtonStyle.Primary);

          buttonRow.addComponents(directionButton);
        }

        components.push(buttonRow);
      }

      try {
        await interaction.reply({
          embeds: [embed],
          components,
          flags: ["Ephemeral"],
        });
        logger.info("Expedition embed sent successfully", {
          expeditionId: expedition.id,
        });
      } catch (replyError) {
        logger.error("Failed to send expedition embed", {
          error: replyError,
          embedData: JSON.stringify(embed.toJSON()),
          componentsCount: components.length,
        });
        throw replyError;
      }
    } else {
      // Character is not a member - show available expeditions
      const townResponse = await apiService.guilds.getTownByGuildId(
        interaction.guildId!
      );
      if (!townResponse) {
        await replyEphemeral(
          interaction,
          "❌ Aucune ville trouvée pour ce serveur."
        );
        return;
      }

      const allExpeditions = await apiService.expeditions.getExpeditionsByTown(
        townResponse.id
      );

      // Filtrer les expéditions terminées (RETURNED)
      const expeditions = allExpeditions.filter(
        (exp: Expedition) => exp.status !== "RETURNED"
      );

      const planningExpeditions = expeditions.filter(
        (exp: Expedition) => exp.status === "PLANNING"
      );

      if (expeditions.length === 0) {
        // No expeditions at all - only show "Create new expedition" button
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("expedition_create_new")
            .setLabel("Créer une nouvelle expédition")
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
          content: `${EXPEDITION.ICON} **Aucune expédition prévue**\n\n`,
          components: [buttonRow],
          flags: ["Ephemeral"],
        });
        return;
      }

      if (planningExpeditions.length === 0) {
        // No planning expeditions but other expeditions exist - show all with create button
        const expeditionList = expeditions
          .map(
            (exp: Expedition, index: number) =>
              `**${index + 1}.** ${exp.name} (${exp.duration
              }j) - ${getStatusEmoji(exp.status)}`
          )
          .join("\n");

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("expedition_create_new")
            .setLabel("Créer une nouvelle expédition")
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
          content: `🏕️ **Expéditions existantes :**\n${expeditionList}\n\n⚠️ Aucune expédition disponible à rejoindre (status PLANNING).\nVous pouvez créer une nouvelle expédition :`,
          components: [buttonRow],
          flags: ["Ephemeral"],
        });
        return;
      }

      // Planning expeditions available - show all expeditions with both buttons
      const expeditionList = expeditions
        .map(
          (exp: Expedition, index: number) =>
            `**${index + 1}.** ${exp.name} (${exp.duration
            }j) - ${getStatusEmoji(exp.status)}`
        )
        .join("\n");

      const buttons = [
        new ButtonBuilder()
          .setCustomId("expedition_create_new")
          .setLabel("Créer une nouvelle expédition")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("expedition_join_existing")
          .setLabel("Rejoindre une expédition")
          .setStyle(ButtonStyle.Secondary),
      ];

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...buttons
      );

      await interaction.reply({
        content: `${EXPEDITION.ICON} **Expéditions existantes :**\n${expeditionList}\n\nChoisissez une action :`,
        components: [buttonRow],
        flags: ["Ephemeral"],
      });
    }
  } catch (error) {
    logger.error("Error in expedition main command:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de l'accès aux expéditions: ${error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionInfoCommand(
  interaction: ChatInputCommandInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

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
        await replyEphemeral(
          interaction,
          "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition."
        );
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await replyEphemeral(interaction, ERROR_MESSAGES.NO_CHARACTER);
      return;
    }

    // Get character's active expeditions
    const activeExpeditions =
      await apiService.expeditions.getActiveExpeditionsForCharacter(
        character.id,
        user.id // Pass userId to check if user has voted
      );

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await replyEphemeral(
        interaction,
        "❌ Votre personnage ne participe à aucune expédition active."
      );
      return;
    }

    const currentExpedition = activeExpeditions[0];

    // Récupérer les ressources détaillées de l'expédition
    let expeditionResources: any[] = [];
    try {
      expeditionResources = await apiService.getResources(
        "EXPEDITION",
        currentExpedition.id
      );
    } catch (error) {
      logger.warn("Could not fetch expedition resources:", error);
      // Continue without detailed resources if API call fails
    }

    // Create embed
    const embed = createInfoEmbed(
      `${EXPEDITION.ICON} ${currentExpedition.name}`
    ).addFields(
      {
        name: "📦 Stock de repas",
        value: `${currentExpedition.foodStock || 0}`,
        inline: true,
      },
      {
        name: "${EXPEDITION.DURATION} Durée",
        value: `${currentExpedition.duration} jours`,
        inline: true,
      },
      {
        name: "📍 Statut",
        value: getStatusEmoji(currentExpedition.status),
        inline: true,
      },
      {
        name: "👥 Membres",
        value: currentExpedition.members?.length.toString() || "0",
        inline: true,
      }
    );

    // Add detailed resources if available
    if (expeditionResources && expeditionResources.length > 0) {
      const resourceDetails = expeditionResources
        .filter((resource) => resource.quantity > 0)
        .map(
          (resource) =>
            `${resource.resourceType.emoji} ${resource.resourceType.name}: ${resource.quantity}`
        )
        .join("\n");

      if (resourceDetails) {
        embed.addFields({
          name: "📦 Ressources détaillées",
          value: resourceDetails,
          inline: false,
        });
      }
    }

    // Direction info
    if (currentExpedition.initialDirection) {
      embed.addFields({
        name: "📍 Direction initiale",
        value: `${getDirectionEmoji(
          currentExpedition.initialDirection
        )} ${getDirectionText(currentExpedition.initialDirection)}`,
        inline: true,
      });
    }

    if (currentExpedition.path && currentExpedition.path.length > 0) {
      const pathString = currentExpedition.path
        .map((d) => getDirectionEmoji(d))
        .join(" → ");
      embed.addFields({
        name: "🗺️ Chemin parcouru",
        value: pathString,
        inline: false,
      });
    }

    if (
      currentExpedition.status === "DEPARTED" &&
      currentExpedition.currentDayDirection
    ) {
      embed.addFields({
        name: "🧭 Direction choisie pour demain",
        value: `${getDirectionEmoji(
          currentExpedition.currentDayDirection
        )} ${getDirectionText(currentExpedition.currentDayDirection)}`,
        inline: true,
      });
    }

    // Add member list if there are members
    if (currentExpedition.members && currentExpedition.members.length > 0) {
      const memberList = currentExpedition.members
        .map((member) => {
          const characterName = member.character?.name || "Inconnu";
          const discordUsername = member.character?.user?.username || "Inconnu";
          return `• **${characterName}** - ${discordUsername}`;
        })
        .join("\n");

      embed.addFields({
        name: "📋 Membres inscrits",
        value: memberList,
        inline: false,
      });
    }

    // Add buttons based on expedition status
    const components = [];
    if (currentExpedition.status === "PLANNING") {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("expedition_leave")
          .setLabel("Quitter")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("expedition_transfer")
          .setLabel("Transférer repas")
          .setStyle(ButtonStyle.Primary)
      );
      components.push(buttonRow);
    } else if (currentExpedition.status === "DEPARTED") {
      // Determine button label based on vote status
      const emergencyButtonLabel = currentExpedition.currentUserVoted
        ? "❌ Annuler retour d'urgence"
        : "🚨 Voter retour d'urgence";

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_emergency_return:${currentExpedition.id}`)
          .setLabel(emergencyButtonLabel)
          .setStyle(ButtonStyle.Secondary)
      );

      // Check if it's the last day (day before return)
      const isLastDay = (() => {
        if (!currentExpedition.returnAt) return false;

        const now = new Date();
        const returnDate = new Date(currentExpedition.returnAt);

        // Calculate hours until return
        const hoursUntilReturn =
          (returnDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Last day = less than 24 hours until return
        return hoursUntilReturn < 24;
      })();

      // Add direction button if DEPARTED, no direction set, and NOT last day
      if (!currentExpedition.currentDayDirection && !isLastDay) {
        const directionButton = new ButtonBuilder()
          .setCustomId(`expedition_choose_direction:${currentExpedition.id}`)
          .setLabel("Choisir Direction")
          .setEmoji(EXPEDITION.ICON)
          .setStyle(ButtonStyle.Primary);

        buttonRow.addComponents(directionButton);
      }

      components.push(buttonRow);
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition info command:", { error });
    await replyEphemeral(
      interaction,
      "❌ Une erreur est survenue lors de la récupération des informations d'expédition."
    );
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

export async function handleExpeditionChooseDirection(
  interaction: any
): Promise<void> {
  try {
    const expeditionId = interaction.customId.split(":")[1];

    const character = await getActiveCharacterFromCommand(interaction);

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif.",
        ephemeral: true,
      });
      return;
    }

    // Show direction menu
    const directionMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_set_direction:${expeditionId}:${character.id}`)
      .setPlaceholder("Prochaine direction...")
      .addOptions([
        { label: "Nord", value: "NORD", emoji: "⬆️" },
        { label: "Nord-Est", value: "NORD_EST", emoji: "↗️" },
        // { label: "Est", value: "EST", emoji: "➡️" },
        { label: "Sud-Est", value: "SUD_EST", emoji: "↘️" },
        { label: "Sud", value: "SUD", emoji: "⬇️" },
        { label: "Sud-Ouest", value: "SUD_OUEST", emoji: "↙️" },
        // { label: "Ouest", value: "OUEST", emoji: "⬅️" },
        { label: "Nord-Ouest", value: "NORD_OUEST", emoji: "↖️" },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      directionMenu
    );

    await interaction.reply({
      content: `${EXPEDITION.LOCATION} Où se dirige l'expédition, maintenant ?`,
      components: [row],
      ephemeral: true,
    });
  } catch (error: any) {
    console.error("Error showing direction menu:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}

export async function handleExpeditionSetDirection(
  interaction: any
): Promise<void> {
  try {
    const [, expeditionId, characterId] = interaction.customId.split(":");
    const direction = interaction.values[0];

    await apiService.expeditions.setExpeditionDirection(
      expeditionId,
      direction,
      characterId
    );

    const directionMessage = `✅ Direction définie : ${getDirectionEmoji(
      direction
    )} ${getDirectionText(direction)}`;

    await interaction.update({
      content: directionMessage,
      components: [],
    });

    // Send log to expedition dedicated channel if configured
    try {
      const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
      if (expedition?.expeditionChannelId && expedition.status === "DEPARTED") {
        const channel = await interaction.client.channels.fetch(expedition.expeditionChannelId);
        if (channel instanceof TextChannel) {
          await channel.send(directionMessage);
        }
      }
    } catch (logError) {
      logger.error("Error sending direction log to expedition channel:", logError);
      // Don't fail the main operation if logging fails
    }
  } catch (error: any) {
    console.error("Error setting direction:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}

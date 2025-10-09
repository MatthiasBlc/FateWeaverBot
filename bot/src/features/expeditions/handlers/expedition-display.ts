import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
  type ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createInfoEmbed, createSuccessEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import { Expedition } from "../../../types/entities";
import { getStatusEmoji } from "../expedition-utils";
import { validateCharacterAlive } from "../../../utils/character-validation";
import { replyEphemeral } from "../../../utils/interaction-helpers";

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
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Aucun personnage vivant trouvé. Utilisez d'abord la commande `/start` pour créer un personnage.",
          flags: ["Ephemeral"],
        });
        return;
      }
      throw error;
    }

    if (!character) {
      await replyEphemeral(interaction, "❌ Aucun personnage actif trouvé.");
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
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(character.id);

    if (activeExpeditions && activeExpeditions.length > 0) {
      // Character is a member - show expedition info
      const expedition = activeExpeditions[0];

      // Récupérer les ressources détaillées de l'expédition
      let expeditionResources: any[] = [];
      try {
        expeditionResources = await apiService.getResources("EXPEDITION", expedition.id);
      } catch (error) {
        logger.warn("Could not fetch expedition resources:", error);
        // Continue without detailed resources if API call fails
      }

      // Build fields array
      const fields: any[] = [
        {
          name: "⏱️ Durée",
          value: `${expedition.duration} jours`,
          inline: true,
        },
        {
          name: "📍 Statut",
          value: getStatusEmoji(expedition.status),
          inline: true,
        },
        {
          name: "👥 Membres",
          value: expedition.members?.length.toString() || "0",
          inline: true,
        }
      ];

      // Add detailed resources if available
      if (expeditionResources && expeditionResources.length > 0) {
        const resourceDetails = expeditionResources
          .filter(resource => resource.quantity > 0)
          .map(resource => `${resource.resourceType.emoji} ${resource.resourceType.name}: ${resource.quantity}`)
          .join("\n");

        if (resourceDetails) {
          fields.push({
            name: "📦 Ressources détaillées",
            value: resourceDetails,
            inline: false,
          });
        }
      }

      // Add member list if there are members
      if (expedition.members && expedition.members.length > 0) {
        const memberList = expedition.members
          .map((member) => {
            const characterName = member.character?.name || "Inconnu";
            const discordUsername = member.character?.user?.username || "Inconnu";
            return `• **${characterName}** - ${discordUsername}`;
          })
          .join("\n");

        if (memberList) {
          fields.push({
            name: "📋 Membres inscrits",
            value: memberList,
            inline: false,
          });
        }
      }

      // Create embed
      const embed = createInfoEmbed(
        `🚀 ${expedition.name}`,
        `Expédition en ${getStatusEmoji(expedition.status)}`
      ).addFields(fields);

      logger.info("Expedition embed created", {
        expeditionId: expedition.id,
        fieldsCount: fields.length,
        hasComponents: expedition.status === "PLANNING" || expedition.status === "DEPARTED"
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
            .setLabel("Transférer nourriture")
            .setStyle(ButtonStyle.Primary)
        );
        components.push(buttonRow);
      } else if (expedition.status === "DEPARTED") {
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`expedition_emergency_return:${expedition.id}`)
            .setLabel("🚨 Voter retour d'urgence")
            .setStyle(ButtonStyle.Secondary)
        );
        components.push(buttonRow);
      }

      try {
        await interaction.reply({
          embeds: [embed],
          components,
          flags: ["Ephemeral"],
        });
        logger.info("Expedition embed sent successfully", { expeditionId: expedition.id });
      } catch (replyError) {
        logger.error("Failed to send expedition embed", {
          error: replyError,
          embedData: JSON.stringify(embed.toJSON()),
          componentsCount: components.length
        });
        throw replyError;
      }
    } else {
      // Character is not a member - show available expeditions
      const townResponse = await apiService.guilds.getTownByGuildId(interaction.guildId!);
      if (!townResponse) {
        await replyEphemeral(interaction, "❌ Aucune ville trouvée pour ce serveur.");
        return;
      }

      const allExpeditions = await apiService.expeditions.getExpeditionsByTown(townResponse.id);

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
          content: "🏕️ **Aucune expédition dans cette ville.**\n\nVous pouvez créer une nouvelle expédition :",
          components: [buttonRow],
          flags: ["Ephemeral"],
        });
        return;
      }

      if (planningExpeditions.length === 0) {
        // No planning expeditions but other expeditions exist - show all with create button
        const expeditionList = expeditions
          .map((exp: Expedition, index: number) =>
            `**${index + 1}.** ${exp.name} (${exp.duration}j) - ${getStatusEmoji(exp.status)}`
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
        .map((exp: Expedition, index: number) =>
          `**${index + 1}.** ${exp.name} (${exp.duration}j) - ${getStatusEmoji(exp.status)}`
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
          .setStyle(ButtonStyle.Secondary)
      ];

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

      await interaction.reply({
        content: `🏕️ **Expéditions existantes :**\n${expeditionList}\n\nChoisissez une action :`,
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
        await replyEphemeral(interaction, "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.");
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await replyEphemeral(interaction, "❌ Aucun personnage actif trouvé.");
      return;
    }

    // Get character's active expeditions
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(
      character.id
    );

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await replyEphemeral(interaction, "❌ Votre personnage ne participe à aucune expédition active.");
      return;
    }

    const currentExpedition = activeExpeditions[0];

    // Récupérer les ressources détaillées de l'expédition
    let expeditionResources: any[] = [];
    try {
      expeditionResources = await apiService.getResources("EXPEDITION", currentExpedition.id);
    } catch (error) {
      logger.warn("Could not fetch expedition resources:", error);
      // Continue without detailed resources if API call fails
    }

    // Create embed
    const embed = createInfoEmbed(
      `🚀 ${currentExpedition.name}`,
      ""
    )
      .addFields(
        {
          name: "📦 Stock de nourriture",
          value: `${currentExpedition.foodStock || 0}`,
          inline: true,
        },
        {
          name: "⏱️ Durée",
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
        },
        {
          name: "🏛️ Ville",
          value: currentExpedition.town?.name || "Inconnue",
          inline: true,
        }
      );

    // Add detailed resources if available
    if (expeditionResources && expeditionResources.length > 0) {
      const resourceDetails = expeditionResources
        .filter(resource => resource.quantity > 0)
        .map(resource => `${resource.resourceType.emoji} ${resource.resourceType.name}: ${resource.quantity}`)
        .join("\n");

      if (resourceDetails) {
        embed.addFields({
          name: "📦 Ressources détaillées",
          value: resourceDetails,
          inline: false,
        });
      }
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
          .setLabel("Transférer nourriture")
          .setStyle(ButtonStyle.Primary)
      );
      components.push(buttonRow);
    } else if (currentExpedition.status === "DEPARTED") {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_emergency_return:${currentExpedition.id}`)
          .setLabel("🚨 Voter retour d'urgence")
          .setStyle(ButtonStyle.Secondary)
      );
      components.push(buttonRow);
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition info command:", { error });
    await replyEphemeral(interaction, "❌ Une erreur est survenue lors de la récupération des informations d'expédition.");
  }
}

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
      await interaction.reply({
        content: "❌ Aucun personnage actif trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (character.isDead) {
      await interaction.reply({
        content: "❌ Un mort ne peut pas gérer les expéditions.",
        flags: ["Ephemeral"],
      });
      return;
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

      // Create embed
      const embed = createInfoEmbed(
        `🚀 ${expedition.name}`,
        ""
      )
      .addFields(
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
        },
        { name: " ", value: " ", inline: true }
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
      if (expedition.members && expedition.members.length > 0) {
        const memberList = expedition.members
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

      // Add buttons only if expedition is PLANNING and user is a member
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
      }

      await interaction.reply({
        embeds: [embed],
        components,
        flags: ["Ephemeral"],
      });
    } else {
      // Character is not a member - show available expeditions
      const townResponse = await apiService.guilds.getTownByGuildId(interaction.guildId!);
      if (!townResponse) {
        await interaction.reply({
          content: "❌ Aucune ville trouvée pour ce serveur.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const expeditions = await apiService.expeditions.getExpeditionsByTown(townResponse.id);
      const availableExpeditions = expeditions.filter(
        (exp: Expedition) => exp.status === "PLANNING"
      );

      if (availableExpeditions.length === 0) {
        // No expeditions available - only show "Create new expedition" button
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("expedition_create_new")
            .setLabel("Créer une nouvelle expédition")
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
          content: "🏕️ **Aucune expédition en cours de planification.**\n\nVous pouvez créer une nouvelle expédition :",
          components: [buttonRow],
          flags: ["Ephemeral"],
        });
        return;
      }

      // Expeditions available - show list with both buttons
      const expeditionList = availableExpeditions
        .map((exp: Expedition, index: number) =>
          `**${index + 1}.** ${exp.name} (${exp.duration}j)`
        )
        .join("\n");

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("expedition_create_new")
          .setLabel("Créer une nouvelle expédition")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("expedition_join_existing")
          .setLabel("Rejoindre une expédition")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content: `🏕️ **Expéditions disponibles :**\n${expeditionList}\n\nChoisissez une action :`,
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
        await interaction.reply({
          content:
            "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Aucun personnage actif trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get character's active expeditions
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(
      character.id
    );

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await interaction.reply({
        content: "❌ Votre personnage ne participe à aucune expédition active.",
        flags: ["Ephemeral"],
      });
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
      },
      { name: " ", value: " ", inline: true }
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

    // Add buttons only if expedition is PLANNING and user is a member
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
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition info command:", { error });
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de la récupération des informations d'expédition.",
      flags: ["Ephemeral"],
    });
  }
}

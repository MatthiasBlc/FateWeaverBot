import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type GuildMember,
  type ModalSubmitInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { apiService } from "../../../services/api";
import { logger } from "../../services/logger";
import { getActiveCharacterForUser } from "../../utils/character";
import { createExpeditionCreationModal } from "../../modals/expedition-modals";

export async function handleExpeditionStartCommand(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get town info
    const townResponse = await apiService.getTownByGuildId(interaction.guildId!);
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get user's active character
    const character = await getActiveCharacterForUser(interaction);
    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour créer une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if character is already on an expedition
    const activeExpeditions = await apiService.getActiveExpeditionsForCharacter(character.id);
    if (activeExpeditions && activeExpeditions.length > 0) {
      await interaction.reply({
        content: `❌ Votre personnage est déjà sur une expédition active: **${activeExpeditions[0].name}**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Show modal for expedition creation
    const modal = createExpeditionCreationModal();
    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in expedition start command:", { error });
    await interaction.reply({
      content: "✅ Votre expédition a été créée avec succès!",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionCreationModal(interaction: ModalSubmitInteraction) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    const name = interaction.fields.getTextInputValue("expedition_name_input");
    const foodStock = interaction.fields.getTextInputValue("expedition_food_input");
    const duration = interaction.fields.getTextInputValue("expedition_duration_input");

    // Validate inputs
    const foodAmount = parseInt(foodStock, 10);
    const durationHours = parseInt(duration, 10);

    if (isNaN(foodAmount) || foodAmount <= 0) {
      await interaction.reply({
        content: "❌ Le stock de nourriture doit être un nombre positif.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (isNaN(durationHours) || durationHours <= 0) {
      await interaction.reply({
        content: "❌ La durée doit être un nombre d'heures positif.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town info
    const townResponse = await apiService.getTownByGuildId(interaction.guildId!);
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get user's active character
    const character = await getActiveCharacterForUser(interaction);
    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour créer une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Create expedition
    const expedition = await apiService.createExpedition({
      name,
      foodStock: foodAmount,
      duration: durationHours,
      townId: townResponse.id,
      createdBy: user.id,
    });

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`🚀 Expédition créée: ${expedition.name}`)
      .addFields(
        { name: "📦 Stock de nourriture", value: `${expedition.foodStock}`, inline: true },
        { name: "⏱️ Durée", value: `${expedition.duration}h`, inline: true },
        { name: "📍 Statut", value: "🔄 PLANIFICATION", inline: true },
        { name: "👥 Membres", value: "0", inline: true },
        { name: "🏛️ Ville", value: townResponse.name, inline: true },
        { name: " ", value: " ", inline: true }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });

    logger.info("Expedition created via Discord", {
      expeditionId: expedition.id,
      name: expedition.name,
      createdBy: user.id,
      guildId: interaction.guildId,
    });

  } catch (error) {
    logger.error("Error in expedition creation modal:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de la création de l'expédition: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionJoinCommand(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get town info
    const townResponse = await apiService.getTownByGuildId(interaction.guildId!);
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get user's active character
    const character = await getActiveCharacterForUser(interaction);
    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour rejoindre une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if character is already on an expedition
    const activeExpeditions = await apiService.getActiveExpeditionsForCharacter(character.id);
    if (activeExpeditions && activeExpeditions.length > 0) {
      await interaction.reply({
        content: `❌ Votre personnage est déjà sur une expédition active: **${activeExpeditions[0].name}**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get available expeditions (PLANNING status)
    const expeditions = await apiService.getExpeditionsByTown(townResponse.id);

    const availableExpeditions = expeditions.filter(exp => exp.status === "PLANNING");

    if (availableExpeditions.length === 0) {
      await interaction.reply({
        content: "❌ Aucune expédition en cours de planification disponible.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Create dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_join_select")
      .setPlaceholder("Sélectionnez une expédition à rejoindre")
      .addOptions(
        availableExpeditions.map(exp => ({
          label: exp.name,
          description: `Stock: ${exp.foodStock}, Membres: ${exp.members.length}`,
          value: exp.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Choisissez une expédition à rejoindre:",
      components: [row],
      flags: ["Ephemeral"],
    });

  } catch (error) {
    logger.error("Error in expedition join command:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la recherche des expéditions.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionJoinSelect(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;
  const expeditionId = interaction.values[0];

  try {
    // Get user's active character
    const character = await getActiveCharacterForUser(interaction);
    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour rejoindre une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Join expedition
    const memberData = await apiService.joinExpedition(expeditionId, character.id);

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
    await interaction.reply({
      content: `❌ Erreur lors de la participation à l'expédition: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionInfoCommand(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get user's active character
    const character = await getActiveCharacterForUser(interaction);
    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour voir les informations d'expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get character's active expeditions
    const activeExpeditions = await apiService.getActiveExpeditionsForCharacter(character.id);

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await interaction.reply({
        content: "❌ Votre personnage ne participe à aucune expédition active.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const expedition = activeExpeditions[0];

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`🚀 ${expedition.name}`)
      .addFields(
        { name: "📦 Stock de nourriture", value: `${expedition.foodStock}`, inline: true },
        { name: "⏱️ Durée", value: `${expedition.duration}h`, inline: true },
        { name: "📍 Statut", value: getStatusEmoji(expedition.status), inline: true },
        { name: "👥 Membres", value: `${expedition.members.length}`, inline: true },
        { name: "🏛️ Ville", value: expedition.town.name, inline: true },
        { name: " ", value: " ", inline: true }
      )
      .setTimestamp();

    // Add buttons only if expedition is PLANNING and user is a member
    const components = [];
    if (expedition.status === "PLANNING") {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
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
      content: "❌ Une erreur est survenue lors de la récupération des informations d'expédition.",
      flags: ["Ephemeral"],
    });
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLANNING": return "🔄 PLANIFICATION";
    case "LOCKED": return "🔒 VERROUILLÉE";
    case "DEPARTED": return "✈️ PARTIE";
    case "RETURNED": return "🏠 REVENUE";
    default: return status;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { logger } from "../../../services/logger";
import { checkAdmin } from "../../../utils/roles";
import { STATUS } from "../../../constants/emojis";

/**
 * Gère la commande /new-element-admin
 */
export async function handleNewElementAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous devez être administrateur pour utiliser cette commande.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const resourceButton = new ButtonBuilder()
      .setCustomId("element_category_resource")
      .setLabel("📦 Ressources")
      .setStyle(ButtonStyle.Primary);

    const objectButton = new ButtonBuilder()
      .setCustomId("element_category_object")
      .setLabel("🎒 Objets")
      .setStyle(ButtonStyle.Primary);

    const skillButton = new ButtonBuilder()
      .setCustomId("element_category_skill")
      .setLabel("⚔️ Compétences")
      .setStyle(ButtonStyle.Primary);

    const capabilityButton = new ButtonBuilder()
      .setCustomId("element_category_capability")
      .setLabel("✨ Capacités")
      .setStyle(ButtonStyle.Primary);

    const emojiButton = new ButtonBuilder()
      .setCustomId("element_category_emoji")
      .setLabel("🎨 Emojis")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      resourceButton,
      objectButton,
      skillButton,
      capabilityButton
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(emojiButton);

    await interaction.reply({
      content: "**Gestion des éléments**\n\nSélectionnez une catégorie :",
      components: [row, row2],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleNewElementAdminCommand", {
      error: error instanceof Error ? error.message : error,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection d'une catégorie d'éléments
 */
export async function handleElementCategoryButton(interaction: ButtonInteraction) {
  try {
    const category = interaction.customId.split('_')[2];

    const addButton = new ButtonBuilder()
      .setCustomId(`new_element_${category}`)
      .setLabel("➕ Ajouter")
      .setStyle(ButtonStyle.Success);

    const editButton = new ButtonBuilder()
      .setCustomId(`edit_element_${category}`)
      .setLabel("✏️ Modifier")
      .setStyle(ButtonStyle.Primary);

    const deleteButton = new ButtonBuilder()
      .setCustomId(`delete_element_${category}`)
      .setLabel("🗑️ Supprimer")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addButton,
      editButton,
      deleteButton
    );

    const categoryNames: Record<string, string> = {
      resource: "Ressources",
      object: "Objets",
      skill: "Compétences",
      capability: "Capacités",
    };

    await interaction.update({
      content: `**${categoryNames[category]}**\n\nSélectionnez une action :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleElementCategoryButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère le clic sur le bouton "Annuler suppression"
 */
export async function handleCancelDeleteButton(interaction: ButtonInteraction) {
  try {
    await interaction.update({
      content: "Suppression annulée.",
      components: [],
    });
  } catch (error) {
    logger.error("Erreur dans handleCancelDeleteButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

// Re-exports from feature modules
export * from "./capability-handlers";
export * from "./resource-handlers";
export * from "./object-handlers";
export * from "./skill-handlers";
export * from "./emoji-handlers";

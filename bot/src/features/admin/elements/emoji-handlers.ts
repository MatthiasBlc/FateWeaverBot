/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ButtonInteraction,
  type ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { apiService } from "../../../services/api";
import { logger } from "../../../services/logger";
import { STATUS } from "../../../constants/emojis";

/**
 * Gère le menu des emojis (depuis /new-element-admin)
 */
export async function handleEmojiMenuButton(interaction: ButtonInteraction) {
  try {
    const addButton = new ButtonBuilder()
      .setCustomId("emoji_add")
      .setLabel("➕ Ajouter")
      .setStyle(ButtonStyle.Success);

    const listButton = new ButtonBuilder()
      .setCustomId("emoji_list")
      .setLabel("📋 Lister")
      .setStyle(ButtonStyle.Primary);

    const removeButton = new ButtonBuilder()
      .setCustomId("emoji_remove")
      .setLabel("🗑️ Supprimer")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addButton,
      listButton,
      removeButton
    );

    await interaction.update({
      content: "**Gestion des Emojis**\n\nSélectionnez une action :",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiMenuButton", {
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
 * Gère l'ajout d'un emoji - Affiche d'abord un select menu pour choisir le type
 */
export async function handleEmojiAddButton(interaction: ButtonInteraction) {
  try {
    const typeSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId("emoji_type_select")
      .setPlaceholder("Sélectionnez une catégorie")
      .addOptions([
        { label: "Ressource", value: "resource", emoji: "📦" },
        { label: "Capacité", value: "capability", emoji: "✨" },
        { label: "Objet", value: "object", emoji: "🎒" },
        { label: "Compétence", value: "skill", emoji: "⚔️" },
        { label: "Action", value: "action", emoji: "➕" },
        { label: "Custom", value: "custom", emoji: "🎨" },
      ]);

    const row = new (ActionRowBuilder as any)().addComponents(
      typeSelect
    );

    await interaction.reply({
      content: "**Ajouter un emoji**\n\nSélectionnez d'abord la catégorie :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiAddButton", {
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
 * Gère la sélection du type d'emoji (depuis le select menu)
 */
export async function handleEmojiTypeSelect(
  interaction: any
) {
  try {
    const selectedType = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`emoji_add_modal:${selectedType}`)
      .setTitle(`Ajouter un emoji - ${selectedType}`);

    const keyInput = new TextInputBuilder()
      .setCustomId("emoji_key")
      .setLabel('Clé (ex: WOOD_OAK)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiInput = new TextInputBuilder()
      .setCustomId("emoji_emoji")
      .setLabel('Emoji (ex: 🌲)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(keyInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleEmojiTypeSelect", {
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
 * Gère la soumission du modal d'ajout d'emoji
 */
export async function handleEmojiAddModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Extraire le type du customId (format: emoji_add_modal:resource)
    const type = interaction.customId.split(':')[1] || 'custom';
    const key = interaction.fields.getTextInputValue("emoji_key");
    const emoji = interaction.fields.getTextInputValue("emoji_emoji");

    // Valider que c'est un emoji
    const emojiRegex = /^(\p{Emoji})$/u;
    if (!emojiRegex.test(emoji.trim())) {
      await interaction.editReply({
        content: `${STATUS.ERROR} "${emoji}" n'est pas un emoji valide. Utilisez un seul emoji.`,
      });
      return;
    }

    // Créer via l'API
    await apiService.emojis.createEmoji(type, key, emoji);

    await interaction.editReply({
      content: `${STATUS.SUCCESS} Emoji ajouté avec succès !\n\n**Type:** ${type}\n**Clé:** ${key}\n**Emoji:** ${emoji}`,
    });

    // Recharger le cache
    const { emojiCache } = await import("../../../services/emoji-cache.js");
    await emojiCache.refresh();
  } catch (error) {
    logger.error("Erreur dans handleEmojiAddModal", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout de l'emoji: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
    });
  }
}

/**
 * Gère l'affichage de la liste des emojis
 */
export async function handleEmojiListButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const emojis = await apiService.emojis.listEmojis();

    if (!emojis || emojis.length === 0) {
      await interaction.editReply({
        content: "Aucun emoji configuré pour le moment.",
      });
      return;
    }

    // Grouper par type
    const byType: Record<string, Array<{ key: string; emoji: string }>> = {};
    for (const config of emojis) {
      if (!byType[config.type]) {
        byType[config.type] = [];
      }
      byType[config.type].push({
        key: config.key,
        emoji: config.emoji,
      });
    }

    // Créer le contenu
    let content = "**Emojis Disponibles**\n\n";
    for (const [type, items] of Object.entries(byType)) {
      content += `**${type.toUpperCase()}**\n`;
      for (const item of items) {
        content += `  ${item.emoji} \`${item.key}\`\n`;
      }
      content += "\n";
    }

    await interaction.editReply({
      content,
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiListButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage de la liste.`,
    });
  }
}

/**
 * Gère la suppression d'un emoji - Affiche d'abord un select menu par catégorie
 */
export async function handleEmojiRemoveButton(interaction: ButtonInteraction) {
  try {
    const typeSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId("emoji_remove_type_select")
      .setPlaceholder("Sélectionnez une catégorie")
      .addOptions([
        { label: "Ressource", value: "resource", emoji: "📦" },
        { label: "Capacité", value: "capability", emoji: "✨" },
        { label: "Objet", value: "object", emoji: "🎒" },
        { label: "Compétence", value: "skill", emoji: "⚔️" },
        { label: "Action", value: "action", emoji: "➕" },
        { label: "Custom", value: "custom", emoji: "🎨" },
      ]);

    const row = new (ActionRowBuilder as any)().addComponents(typeSelect);

    await interaction.reply({
      content: "**Supprimer un emoji**\n\nSélectionnez d'abord la catégorie :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiRemoveButton", {
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
 * Gère la sélection du type d'emoji pour la suppression
 */
export async function handleEmojiRemoveTypeSelect(interaction: any) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const selectedType = interaction.values[0];

    // Récupérer tous les emojis du type sélectionné
    const allEmojis = await apiService.emojis.listEmojis(selectedType);

    if (!allEmojis || allEmojis.length === 0) {
      await interaction.editReply({
        content: `Aucun emoji trouvé pour la catégorie **${selectedType}**.`,
      });
      return;
    }

    // Créer le select menu avec les emojis de cette catégorie
    const emojiSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId(`emoji_remove_select:${selectedType}`)
      .setPlaceholder("Sélectionnez un emoji à supprimer")
      .addOptions(
        allEmojis.map((e: any) => ({
          label: e.key,
          value: e.key,
          emoji: e.emoji,
          description: e.emoji,
        }))
      );

    const row = new (ActionRowBuilder as any)().addComponents(emojiSelect);

    await interaction.editReply({
      content: `**Supprimer un emoji**\n\nCatégorie: **${selectedType}**\n\nSélectionnez l'emoji à supprimer :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiRemoveTypeSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors du chargement des emojis.`,
    });
  }
}

/**
 * Gère la sélection d'un emoji spécifique pour suppression
 */
export async function handleEmojiRemoveSelect(interaction: any) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const selectedKey = interaction.values[0];
    const customIdParts = interaction.customId.split(':');
    const type = customIdParts[1];

    // Afficher une confirmation avant suppression
    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_emoji_${type}_${selectedKey}`)
      .setLabel(`${STATUS.SUCCESS} Confirmer suppression`)
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_delete_emoji")
      .setLabel(`${STATUS.ERROR} Annuler`)
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirmButton,
      cancelButton
    );

    await interaction.editReply({
      content: `**Êtes-vous sûr de vouloir supprimer cet emoji ?**\n\n**Clé:** ${selectedKey}\n\nLes ressources qui utilisent cet emoji afficheront le placeholder 📦.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiRemoveSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la suppression.`,
    });
  }
}

/**
 * Gère la confirmation de suppression d'emoji
 */
export async function handleEmojiDeleteConfirmation(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const customId = interaction.customId;
    const parts = customId.split('_').slice(3); // Remove "confirm_delete_emoji_"
    const type = parts[0];
    const key = parts.slice(1).join('_');

    // Supprimer via l'API
    await apiService.emojis.deleteEmoji(type, key);

    await interaction.editReply({
      content: `${STATUS.SUCCESS} Emoji supprimé avec succès. Les ressources afficheront le placeholder 📦.`,
    });

    // Recharger le cache
    const { emojiCache } = await import("../../../services/emoji-cache.js");
    await emojiCache.refresh();
  } catch (error) {
    logger.error("Erreur dans handleEmojiDeleteConfirmation", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la suppression de l'emoji.`,
    });
  }
}

/**
 * Gère l'annulation de suppression d'emoji
 */
export async function handleEmojiDeleteCancellation(interaction: ButtonInteraction) {
  try {
    await interaction.update({
      content: `${STATUS.SUCCESS} Suppression annulée.`,
      components: [],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiDeleteCancellation", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { apiService } from "../../../services/api";
import { logger } from "../../../services/logger";
import { STATUS } from "../../../constants/emojis";

/**
 * Gère le clic sur le bouton "Nouvelle Ressource"
 */
export async function handleNewResourceButton(interaction: ButtonInteraction) {
  try {
    // Afficher la liste déroulante des catégories d'emoji
    const typeSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId("resource_emoji_type_select")
      .setPlaceholder("Sélectionnez une catégorie d'emoji")
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
      content: "**Création d'une ressource**\n\nÉtape 1: Sélectionnez une catégorie d'emoji",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleNewResourceButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la sélection de la catégorie d'emoji pour la ressource
 */
export async function handleResourceEmojiCategorySelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    const selectedType = interaction.values[0];

    // Récupérer les emojis de la catégorie sélectionnée
    const emojis = await apiService.emojis.listEmojis(selectedType);

    if (emojis.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucun emoji trouvé pour cette catégorie.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer la liste déroulante des emojis
    const emojiOptions = emojis.map((e) => ({
      label: `${e.emoji} ${e.key}`,
      value: `${selectedType}:${e.key}`,
      emoji: e.emoji,
    }));

    const emojiSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId(`resource_emoji_select:${selectedType}`)
      .setPlaceholder("Sélectionnez un emoji")
      .addOptions(emojiOptions);

    const row = new (ActionRowBuilder as any)().addComponents(emojiSelect);

    await interaction.reply({
      content: `**Création d'une ressource**\n\nÉtape 2: Sélectionnez un emoji de la catégorie **${selectedType}**`,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleResourceEmojiCategorySelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors du chargement des emojis.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection d'un emoji pour la ressource
 */
export async function handleResourceEmojiSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    const selectedValue = interaction.values[0];
    const [selectedType, selectedKey] = selectedValue.split(":");

    // Récupérer tous les emojis pour trouver l'emoji sélectionné
    const allEmojis = await apiService.emojis.listEmojis(selectedType);
    const selectedEmoji = allEmojis.find((e) => e.key === selectedKey);

    if (!selectedEmoji) {
      await interaction.reply({
        content: `${STATUS.ERROR} Emoji non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le modal pour les infos de la ressource (nom, catégorie, description)
    const modal = new ModalBuilder()
      .setCustomId(`new_resource_modal:${selectedEmoji.emoji}`)
      .setTitle("Créer un nouveau type de ressource");

    const nameInput = new TextInputBuilder()
      .setCustomId("resource_name")
      .setLabel("Nom de la ressource")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const categoryInput = new TextInputBuilder()
      .setCustomId("resource_category")
      .setLabel("Catégorie (base/transformé/science)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("resource_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    // Stocker l'emoji sélectionné dans l'interaction pour le modal handler
    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleResourceEmojiSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la soumission du modal de ressource
 */
export async function handleResourceModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("resource_name");
  const category = interaction.fields.getTextInputValue("resource_category");
  const description = interaction.fields.getTextInputValue("resource_description") || undefined;

  // Extraire l'emoji du customId (format: new_resource_modal:emoji)
  const emoji = interaction.customId.split(":")[1];

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Valider la catégorie
    const validCategories = ["base", "transformé", "science"];
    if (!validCategories.includes(category)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : base, transformé ou science.`,
      });
      return;
    }

    // Appeler l'API backend pour créer le type de ressource
    await apiService.resources.createResourceType({
      name,
      emoji,
      category,
      description,
    });

    logger.info("Nouveau type de ressource créé", {
      name,
      emoji,
      category,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Type de ressource créé avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Emoji** : ${emoji}\n` +
        `**Catégorie** : ${category}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création du type de ressource", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}

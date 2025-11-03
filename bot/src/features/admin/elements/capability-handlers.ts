/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ButtonInteraction,
  type ModalSubmitInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { apiService } from "../../../services/api";
import { logger } from "../../../services/logger";
import { STATUS } from "../../../constants/emojis";

/**
 * Gère le clic sur le bouton "Nouvelle Capacité"
 */
export async function handleNewCapabilityButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour la capacité
    const modal = new ModalBuilder()
      .setCustomId("new_capability_modal")
      .setTitle("Créer une nouvelle capacité");

    const nameInput = new TextInputBuilder()
      .setCustomId("capability_name")
      .setLabel("Nom de la capacité")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiTagInput = new TextInputBuilder()
      .setCustomId("capability_emoji_tag")
      .setLabel("Tag emoji (ex: HUNT, GATHER)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const categoryInput = new TextInputBuilder()
      .setCustomId("capability_category")
      .setLabel("Catégorie (HARVEST/CRAFT/SCIENCE/SPECIAL)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const costPAInput = new TextInputBuilder()
      .setCustomId("capability_cost_pa")
      .setLabel("Coût en PA (1-4)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(1);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("capability_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiTagInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(costPAInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewCapabilityButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de capacité
 */
export async function handleCapabilityModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("capability_name");
  const emojiTag = interaction.fields.getTextInputValue("capability_emoji_tag");
  const categoryRaw = interaction.fields.getTextInputValue("capability_category").toUpperCase();
  const costPARaw = interaction.fields.getTextInputValue("capability_cost_pa");
  const description = interaction.fields.getTextInputValue("capability_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Valider la catégorie
    const validCategories = ["HARVEST", "CRAFT", "SCIENCE", "SPECIAL"];
    if (!validCategories.includes(categoryRaw)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : HARVEST, CRAFT, SCIENCE ou SPECIAL.`,
      });
      return;
    }
    const category = categoryRaw as "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";

    // Valider le coût PA
    const costPA = parseInt(costPARaw, 10);
    if (isNaN(costPA) || costPA < 1 || costPA > 4) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Coût PA invalide. Utilisez un nombre entre 1 et 4.`,
      });
      return;
    }

    // Appeler l'API backend pour créer la capacité
    await apiService.capabilities.createCapability({
      name,
      emojiTag,
      category,
      costPA,
      description,
    });

    logger.info("Nouvelle capacité créée", {
      name,
      emojiTag,
      category,
      costPA,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité créée avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Tag emoji** : ${emojiTag}\n` +
        `**Catégorie** : ${category}\n` +
        `**Coût PA** : ${costPA}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création de la capacité", {
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

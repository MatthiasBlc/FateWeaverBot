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
 * Gère le clic sur le bouton "Nouvelle Compétence"
 */
export async function handleNewSkillButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour la compétence
    const modal = new ModalBuilder()
      .setCustomId("new_skill_modal")
      .setTitle("Créer une nouvelle compétence");

    const nameInput = new TextInputBuilder()
      .setCustomId("skill_name")
      .setLabel("Nom de la compétence")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("skill_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewSkillButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de compétence
 */
export async function handleSkillModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("skill_name");
  const description = interaction.fields.getTextInputValue("skill_description");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API backend pour créer la compétence
    await apiService.skills.createSkill({
      name,
      description,
    });

    logger.info("Nouvelle compétence créée", {
      name,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Compétence créée avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Description** : ${description}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création de la compétence", {
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

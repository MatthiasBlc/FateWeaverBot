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
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { STATUS } from "../../constants/emojis";

/**
 * Gère le clic sur le bouton "Modifier Compétence"
 */
export async function handleEditSkillButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const skills = await apiService.skills.getAllSkills();

    if (!skills || skills.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune compétence trouvée.`,
      });
      return;
    }

    const selectOptions = skills.map((s: any) => ({
      label: s.name,
      value: String(s.id),
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_skill_to_edit")
      .setPlaceholder("Sélectionnez une compétence")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez la compétence à modifier :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEditSkillButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de la compétence.`,
    });
  }
}

/**
 * Gère la sélection d'une compétence à modifier
 */
export async function handleSelectSkillToEditMenu(
  interaction: any
) {
  try {
    const skillId = interaction.values[0];
    const allSkills = await apiService.skills.getAllSkills();
    const skill = allSkills.find((s: any) => s.id === skillId);

    if (!skill) {
      await interaction.reply({
        content: `${STATUS.ERROR} Compétence non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_skill_modal:${skillId}`)
      .setTitle("Modifier la compétence");

    const nameInput = new TextInputBuilder()
      .setCustomId("skill_name")
      .setLabel("Nom de la compétence")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setValue(skill.name);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("skill_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500)
      .setValue(skill.description);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleSelectSkillToEditMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de modification de compétence
 */
export async function handleEditSkillModalSubmit(interaction: ModalSubmitInteraction) {
  const skillId = interaction.customId.split(':')[1];
  const name = interaction.fields.getTextInputValue("skill_name");
  const description = interaction.fields.getTextInputValue("skill_description");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.skills.updateSkill(skillId, {
      name,
      description,
    });

    logger.info("Compétence mise à jour", {
      skillId,
      name,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Compétence modifiée avec succès !**\n\n` +
        `**Nom** : ${name}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la modification de la compétence", {
      error: error instanceof Error ? error.message : error,
      skillId,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la modification : ${errorMessage}`,
    });
  }
}

/**
 * Gère le clic sur le bouton "Supprimer Compétence"
 */
export async function handleDeleteSkillButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const skills = await apiService.skills.getAllSkills();

    if (!skills || skills.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune compétence trouvée.`,
      });
      return;
    }

    const selectOptions = skills.map((s: any) => ({
      label: s.name,
      value: String(s.id),
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_skill_to_delete")
      .setPlaceholder("Sélectionnez une compétence")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez la compétence à supprimer :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleDeleteSkillButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de la compétence.`,
    });
  }
}

/**
 * Gère la sélection d'une compétence à supprimer
 */
export async function handleSelectSkillToDeleteMenu(
  interaction: any
) {
  try {
    const skillId = interaction.values[0];
    const allSkills = await apiService.skills.getAllSkills();
    const skill = allSkills.find((s: any) => s.id === skillId);

    if (!skill) {
      await interaction.reply({
        content: `${STATUS.ERROR} Compétence non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_skill:${skillId}`)
      .setLabel("✅ Confirmer la suppression")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_delete")
      .setLabel("❌ Annuler")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirmButton,
      cancelButton
    );

    await interaction.update({
      content: `**Êtes-vous sûr de vouloir supprimer la compétence "${skill.name}" ?**\n\nCette action est irréversible.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleSelectSkillToDeleteMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la confirmation de suppression d'une compétence
 */
export async function handleConfirmDeleteSkillButton(interaction: ButtonInteraction) {
  try {
    const skillId = interaction.customId.split(':')[1];

    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.skills.deleteSkill(skillId);

    logger.info("Compétence supprimée", {
      skillId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Compétence supprimée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la suppression de la compétence", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la suppression : ${errorMessage}`,
    });
  }
}

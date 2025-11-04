/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ButtonInteraction,
  type ModalSubmitInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { apiService } from "../../../../services/api";
import { logger } from "../../../../services/logger";
import { STATUS } from "../../../../constants/emojis";

/**
 * Gère le clic sur le bouton de modification du nom
 */
export async function handleModifyObjectNameButton(interaction: ButtonInteraction) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object) {
      await interaction.reply({
        content: `${STATUS.ERROR} Objet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_object_name_modal:${objectId}`)
      .setTitle("Modifier le nom");

    const nameInput = new TextInputBuilder()
      .setCustomId("object_name")
      .setLabel("Nom de l'objet")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setValue(object.name);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleModifyObjectNameButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère le clic sur le bouton de modification de la description
 */
export async function handleModifyObjectDescriptionButton(interaction: ButtonInteraction) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object) {
      await interaction.reply({
        content: `${STATUS.ERROR} Objet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_object_description_modal:${objectId}`)
      .setTitle("Modifier la description");

    const descriptionInput = new TextInputBuilder()
      .setCustomId("object_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500)
      .setValue(object.description || "");

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleModifyObjectDescriptionButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de modification du nom d'objet
 */
export async function handleEditObjectNameModalSubmit(interaction: ModalSubmitInteraction) {
  const objectId = parseInt(interaction.customId.split(':')[1], 10);
  const name = interaction.fields.getTextInputValue("object_name");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.objects.updateObjectType(objectId, {
      name,
    });

    logger.info("Nom d'objet mis à jour", {
      objectId,
      name,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Nom modifié avec succès !**\n\n**Nouveau nom** : ${name}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la modification du nom d'objet", {
      error: error instanceof Error ? error.message : error,
      objectId,
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
 * Gère la soumission du modal de modification de la description d'objet
 */
export async function handleEditObjectDescriptionModalSubmit(interaction: ModalSubmitInteraction) {
  const objectId = parseInt(interaction.customId.split(':')[1], 10);
  const description = interaction.fields.getTextInputValue("object_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.objects.updateObjectType(objectId, {
      description,
    });

    logger.info("Description d'objet mise à jour", {
      objectId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Description modifiée avec succès !**\n\n**Nouvelle description** : ${description || '*Pas de description*'}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la modification de la description d'objet", {
      error: error instanceof Error ? error.message : error,
      objectId,
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
 * Gère la soumission générique du modal d'édition d'objet
 */
export async function handleEditObjectModalSubmit(interaction: ModalSubmitInteraction) {
  const objectId = parseInt(interaction.customId.split(':')[1], 10);
  const name = interaction.fields.getTextInputValue("object_name");
  const description = interaction.fields.getTextInputValue("object_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.objects.updateObjectType(objectId, {
      name,
      description,
    });

    logger.info("Objet modifié", {
      objectId,
      name,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Objet modifié avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Description** : ${description || '*Pas de description*'}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la modification de l'objet", {
      error: error instanceof Error ? error.message : error,
      objectId,
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

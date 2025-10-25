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
 * Gère le clic sur le bouton "Modifier Objet"
 */
export async function handleEditObjectButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const objects = await apiService.objects.getAllObjectTypes();

    if (!objects || objects.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun objet trouvé.`,
      });
      return;
    }

    const selectOptions = objects.map((o: any) => ({
      label: o.name,
      value: String(o.id),
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_object_to_edit")
      .setPlaceholder("Sélectionnez un objet")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez l'objet à modifier :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEditObjectButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de l'objet.`,
    });
  }
}

/**
 * Gère la sélection d'un objet à modifier
 */
export async function handleSelectObjectToEditMenu(
  interaction: any
) {
  try {
    const objectId = parseInt(interaction.values[0], 10);
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
      .setCustomId(`edit_object_modal:${objectId}`)
      .setTitle("Modifier l'objet");

    const nameInput = new TextInputBuilder()
      .setCustomId("object_name")
      .setLabel("Nom de l'objet")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setValue(object.name);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("object_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500)
      .setValue(object.description || "");

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleSelectObjectToEditMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de modification d'objet
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

    logger.info("Objet mis à jour", {
      objectId,
      name,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Objet modifié avec succès !**\n\n` +
        `**Nom** : ${name}`,
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

/**
 * Gère le clic sur le bouton "Supprimer Objet"
 */
export async function handleDeleteObjectButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const objects = await apiService.objects.getAllObjectTypes();

    if (!objects || objects.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun objet trouvé.`,
      });
      return;
    }

    const selectOptions = objects.map((o: any) => ({
      label: o.name,
      value: String(o.id),
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_object_to_delete")
      .setPlaceholder("Sélectionnez un objet")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez l'objet à supprimer :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleDeleteObjectButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de l'objet.`,
    });
  }
}

/**
 * Gère la sélection d'un objet à supprimer
 */
export async function handleSelectObjectToDeleteMenu(
  interaction: any
) {
  try {
    const objectId = parseInt(interaction.values[0], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object) {
      await interaction.reply({
        content: `${STATUS.ERROR} Objet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_object:${objectId}`)
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
      content: `**Êtes-vous sûr de vouloir supprimer l'objet "${object.name}" ?**\n\nCette action est irréversible.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleSelectObjectToDeleteMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la confirmation de suppression d'un objet
 */
export async function handleConfirmDeleteObjectButton(interaction: ButtonInteraction) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);

    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.objects.deleteObjectType(objectId);

    logger.info("Objet supprimé", {
      objectId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Objet supprimé avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la suppression de l'objet", {
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

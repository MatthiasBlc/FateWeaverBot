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
 * Gère le clic sur le bouton "Modifier Capacité"
 */
export async function handleEditCapabilityButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const capabilities = await apiService.capabilities.getAllCapabilities();

    if (!capabilities || capabilities.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune capacité trouvée.`,
      });
      return;
    }

    const selectOptions = capabilities.map((c: any) => ({
      label: c.name,
      value: String(c.id),
      emoji: c.emojiTag,
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_capability_to_edit")
      .setPlaceholder("Sélectionnez une capacité")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez la capacité à modifier :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEditCapabilityButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de la capacité.`,
    });
  }
}

/**
 * Gère la sélection d'une capacité à modifier
 */
export async function handleSelectCapabilityToEditMenu(
  interaction: any
) {
  try {
    const capabilityId = interaction.values[0];
    const allCapabilities = await apiService.capabilities.getAllCapabilities();
    const capability = allCapabilities.find((c: any) => c.id === capabilityId);

    if (!capability) {
      await interaction.reply({
        content: `${STATUS.ERROR} Capacité non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_capability_modal:${capabilityId}`)
      .setTitle("Modifier la capacité");

    const nameInput = new TextInputBuilder()
      .setCustomId("capability_name")
      .setLabel("Nom de la capacité")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setValue(capability.name);

    const emojiTagInput = new TextInputBuilder()
      .setCustomId("capability_emoji_tag")
      .setLabel("Tag emoji")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50)
      .setValue(capability.emojiTag);

    const categoryInput = new TextInputBuilder()
      .setCustomId("capability_category")
      .setLabel("Catégorie")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20)
      .setValue(capability.category);

    const costPAInput = new TextInputBuilder()
      .setCustomId("capability_cost_pa")
      .setLabel("Coût PA")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(1)
      .setValue(String(capability.costPA));

    const descriptionInput = new TextInputBuilder()
      .setCustomId("capability_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500)
      .setValue(capability.description || "");

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
    logger.error("Erreur dans handleSelectCapabilityToEditMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de modification de capacité
 */
export async function handleEditCapabilityModalSubmit(interaction: ModalSubmitInteraction) {
  const capabilityId = interaction.customId.split(':')[1];
  const name = interaction.fields.getTextInputValue("capability_name");
  const emojiTag = interaction.fields.getTextInputValue("capability_emoji_tag");
  const categoryRaw = interaction.fields.getTextInputValue("capability_category").toUpperCase();
  const costPARaw = interaction.fields.getTextInputValue("capability_cost_pa");
  const description = interaction.fields.getTextInputValue("capability_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const validCategories = ["HARVEST", "CRAFT", "SCIENCE", "SPECIAL"];
    if (!validCategories.includes(categoryRaw)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : HARVEST, CRAFT, SCIENCE ou SPECIAL.`,
      });
      return;
    }
    const category = categoryRaw as "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";

    const costPA = parseInt(costPARaw, 10);
    if (isNaN(costPA) || costPA < 1 || costPA > 4) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Coût PA invalide. Utilisez un nombre entre 1 et 4.`,
      });
      return;
    }

    await apiService.capabilities.updateCapability(capabilityId, {
      name,
      emojiTag,
      category,
      costPA,
      description,
    });

    logger.info("Capacité mise à jour", {
      capabilityId,
      name,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité modifiée avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Tag emoji** : ${emojiTag}\n` +
        `**Catégorie** : ${category}\n` +
        `**Coût PA** : ${costPA}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la modification de la capacité", {
      error: error instanceof Error ? error.message : error,
      capabilityId,
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
 * Gère le clic sur le bouton "Supprimer Capacité"
 */
export async function handleDeleteCapabilityButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const capabilities = await apiService.capabilities.getAllCapabilities();

    if (!capabilities || capabilities.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune capacité trouvée.`,
      });
      return;
    }

    const selectOptions = capabilities.map((c: any) => ({
      label: c.name,
      value: String(c.id),
      emoji: c.emojiTag,
    }));

    const selectMenu = new (await import("discord.js")).StringSelectMenuBuilder()
      .setCustomId("select_capability_to_delete")
      .setPlaceholder("Sélectionnez une capacité")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<any>().addComponents(selectMenu);

    await interaction.editReply({
      content: "**Sélectionnez la capacité à supprimer :**",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleDeleteCapabilityButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de la capacité.`,
    });
  }
}

/**
 * Gère la sélection d'une capacité à supprimer
 */
export async function handleSelectCapabilityToDeleteMenu(
  interaction: any
) {
  try {
    const capabilityId = interaction.values[0];
    const allCapabilities = await apiService.capabilities.getAllCapabilities();
    const capability = allCapabilities.find((c: any) => c.id === capabilityId);

    if (!capability) {
      await interaction.reply({
        content: `${STATUS.ERROR} Capacité non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_capability:${capabilityId}`)
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
      content: `**Êtes-vous sûr de vouloir supprimer la capacité "${capability.name}" ?**\n\nCette action est irréversible.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleSelectCapabilityToDeleteMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la confirmation de suppression d'une capacité
 */
export async function handleConfirmDeleteCapabilityButton(interaction: ButtonInteraction) {
  try {
    const capabilityId = interaction.customId.split(':')[1];

    await interaction.deferReply({ flags: ["Ephemeral"] });

    await apiService.capabilities.deleteCapability(capabilityId);

    logger.info("Capacité supprimée", {
      capabilityId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité supprimée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la suppression de la capacité", {
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

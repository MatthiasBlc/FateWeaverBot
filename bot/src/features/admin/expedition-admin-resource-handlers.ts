import { createSuccessEmbed, createErrorEmbed, createWarningEmbed } from "../../utils/embeds";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { apiService } from "../../services/api";
import { replyEphemeral } from "../../utils/interaction-helpers";
import { logger } from "../../services/logger";
import {
  createExpeditionResourceAddModal,
  createExpeditionResourceModifyModal
} from "../../modals/expedition-modals";

/**
 * Handler pour la sélection d'une ressource à ajouter
 */
export async function handleExpeditionAdminResourceAddSelect(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const expeditionId = parts[parts.length - 1];
    const resourceTypeId = parseInt(interaction.values[0]);

    // Get resource type details
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    if (!resourceType) {
      await replyEphemeral(interaction, "❌ Type de ressource introuvable.");
      return;
    }

    // Show modal to enter quantity
    const modal = createExpeditionResourceAddModal(expeditionId, resourceTypeId, resourceType.name);
    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in expedition admin resource add select:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de la sélection de ressource.");
  }
}

/**
 * Handler pour la soumission de la modale d'ajout de ressource
 */
export async function handleExpeditionResourceAddModal(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const expeditionId = parts[parts.length - 2];
    const resourceTypeId = parseInt(parts[parts.length - 1]);

    const quantity = parseInt(interaction.fields.getTextInputValue("resource_quantity_input"), 10);

    if (isNaN(quantity) || quantity <= 0) {
      await replyEphemeral(interaction, "❌ La quantité doit être un nombre positif.");
      return;
    }

    // Add/update resource
    await apiService.resources.addOrUpdateResource("EXPEDITION", expeditionId, resourceTypeId, quantity);

    // Get resource type name for confirmation
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    await interaction.reply({
      content: `✅ ${quantity} ${resourceType?.name || 'ressource(s)'} ajouté(es) à l'expédition!`,
      ephemeral: true,
    });

    logger.info("Resource added to expedition via admin", {
      expeditionId,
      resourceTypeId,
      quantity,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in expedition resource add modal:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de l'ajout de ressource: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Handler pour la sélection d'une ressource à modifier
 */
export async function handleExpeditionAdminResourceModifySelect(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const expeditionId = parts[parts.length - 1];
    const resourceTypeId = parseInt(interaction.values[0]);

    // Get current resource quantity
    const resources = await apiService.resources.getResourcesForLocation("EXPEDITION", expeditionId);
    const resource = resources.find((r: any) => r.resourceTypeId === resourceTypeId);

    if (!resource) {
      await replyEphemeral(interaction, "❌ Ressource introuvable.");
      return;
    }

    // Show modal to modify quantity
    const modal = createExpeditionResourceModifyModal(
      expeditionId,
      resourceTypeId,
      resource.resourceType?.name || 'Ressource',
      resource.quantity
    );
    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in expedition admin resource modify select:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de la sélection de ressource.");
  }
}

/**
 * Handler pour la soumission de la modale de modification de ressource
 */
export async function handleExpeditionResourceModifyModal(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const expeditionId = parts[parts.length - 2];
    const resourceTypeId = parseInt(parts[parts.length - 1]);

    const newQuantity = parseInt(interaction.fields.getTextInputValue("resource_quantity_input"), 10);

    if (isNaN(newQuantity) || newQuantity < 0) {
      await replyEphemeral(interaction, "❌ La quantité doit être un nombre positif ou zéro.");
      return;
    }

    // Update resource quantity
    await apiService.resources.setResourceQuantity("EXPEDITION", expeditionId, resourceTypeId, newQuantity);

    // Get resource type name for confirmation
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    await interaction.reply({
      content: `✅ Quantité de ${resourceType?.name || 'ressource'} modifiée à ${newQuantity}!`,
      ephemeral: true,
    });

    logger.info("Resource modified in expedition via admin", {
      expeditionId,
      resourceTypeId,
      newQuantity,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in expedition resource modify modal:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de la modification de ressource: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Handler pour la sélection d'une ressource à supprimer
 */
export async function handleExpeditionAdminResourceDeleteSelect(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const expeditionId = parts[parts.length - 1];
    const resourceTypeId = parseInt(interaction.values[0]);

    // Get resource details
    const resources = await apiService.resources.getResourcesForLocation("EXPEDITION", expeditionId);
    const resource = resources.find((r: any) => r.resourceTypeId === resourceTypeId);

    if (!resource) {
      await replyEphemeral(interaction, "❌ Ressource introuvable.");
      return;
    }

    // Show confirmation buttons
    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_admin_resource_delete_confirm_${expeditionId}_${resourceTypeId}`)
          .setLabel("✅ Confirmer la suppression")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`expedition_admin_resource_delete_cancel_${expeditionId}`)
          .setLabel("❌ Annuler")
          .setStyle(ButtonStyle.Secondary)
      );

    const embed = createWarningEmbed(
      "⚠️ Confirmation de suppression",
      `Êtes-vous sûr de vouloir supprimer **${resource.resourceType?.name || 'cette ressource'}** (${resource.quantity}) de l'expédition ?\n\n**Cette action est irréversible !**`
    );

    await interaction.update({
      embeds: [embed],
      components: [confirmRow],
    });

  } catch (error) {
    logger.error("Error in expedition admin resource delete select:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de la sélection de ressource.");
  }
}

/**
 * Handler pour la confirmation de suppression de ressource
 */
export async function handleExpeditionAdminResourceDeleteConfirm(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const expeditionId = parts[parts.length - 2];
    const resourceTypeId = parseInt(parts[parts.length - 1]);

    // Get resource type name before deletion
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    // Delete resource
    await apiService.resources.deleteResource("EXPEDITION", expeditionId, resourceTypeId);

    await interaction.update({
      content: `✅ ${resourceType?.name || 'Ressource'} supprimée de l'expédition avec succès!`,
      embeds: [],
      components: [],
    });

    logger.info("Resource deleted from expedition via admin", {
      expeditionId,
      resourceTypeId,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in expedition resource delete confirm:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de la suppression de ressource: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Handler pour l'annulation de suppression de ressource
 */
export async function handleExpeditionAdminResourceDeleteCancel(interaction: any) {
  await interaction.update({
    content: "❌ Suppression annulée.",
    embeds: [],
    components: [],
  });
}

/**
 * Handler pour la modale de modification de durée
 */
export async function handleExpeditionDurationModal(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const expeditionId = parts[parts.length - 1];

    const duration = parseInt(interaction.fields.getTextInputValue("duration_input"), 10);

    if (isNaN(duration) || duration < 1) {
      await replyEphemeral(interaction, "❌ La durée doit être un nombre positif d'au moins 1 jour.");
      return;
    }

    // Call API to modify expedition duration
    const updatedExpedition = await apiService.modifyExpedition(expeditionId, {
      duration,
    });

    await interaction.reply({
      content: `✅ Durée de l'expédition **${updatedExpedition.name}** modifiée à **${duration} jours**!`,
      flags: ["Ephemeral"],
    });

    logger.info("Expedition duration modified via admin command", {
      expeditionId,
      expeditionName: updatedExpedition.name,
      newDuration: duration,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in expedition duration modal:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de la modification de la durée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

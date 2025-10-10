import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand } from "../../../utils/character";
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from "../../../utils/embeds";
import { replyEphemeral } from "../../../utils/interaction-helpers";
import { checkAdmin } from "../../../utils/admin";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { getTownByGuildId } from "../../../utils/town";

/**
 * Handler pour le bouton "Retirer des ressources"
 */
export async function handleStockAdminRemoveButton(interaction: any) {
  try {
    await interaction.deferUpdate();

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Récupérer les ressources disponibles dans la ville (avec stock > 0)
    const resources = await apiService.getResources("CITY", town.id);
    const availableResources =
      resources?.filter((resource: any) => resource.quantity > 0) || [];

    if (availableResources.length === 0) {
      await interaction.editReply({
        content: "❌ La ville n'a aucune ressource en stock.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Créer le menu de sélection de ressource
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("stock_admin_remove_select")
      .setPlaceholder("Sélectionnez le type de ressource à retirer")
      .addOptions(
        availableResources.map((resource: any) => ({
          label: `${resource.resourceType.emoji} ${resource.resourceType.name}`,
          description: `Stock actuel: ${resource.quantity} unités`,
          value: resource.resourceType.id.toString(),
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const embed = createInfoEmbed(
      `➖ Retirer des Ressources - ${town.name}`,
      "Sélectionnez le type de ressource que vous souhaitez retirer :"
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    logger.info("Stock admin remove interface displayed", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      userId: interaction.user.id,
      availableResources: availableResources.length,
    });
  } catch (error) {
    logger.error("Error in stock admin remove button:", { error });
    await interaction.editReply({
      content: ERROR_MESSAGES.ADMIN_STOCK_REMOVE_PREP_ERROR,
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour la sélection de ressource lors du retrait
 */
export async function handleStockAdminRemoveSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    const resourceTypeId = parseInt(interaction.values[0]);
    const town = await getTownByGuildId(interaction.guildId || "");

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les ressources disponibles dans la ville (avec stock > 0)
    const resources = await apiService.getResources("CITY", town.id);
    const selectedResource = resources?.find(
      (resource: any) => resource.resourceType.id === resourceTypeId
    );

    if (!selectedResource) {
      await interaction.reply({
        content: "❌ Ressource non trouvée dans la ville.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le modal pour saisir la quantité
    const modal = new ModalBuilder()
      .setCustomId(`stock_admin_remove_modal_${resourceTypeId}`)
      .setTitle(
        `Retirer ${selectedResource.resourceType.emoji} ${selectedResource.resourceType.name}`
      );

    const amountInput = new TextInputBuilder()
      .setCustomId("amount_input")
      .setLabel(`Quantité de ${selectedResource.resourceType.name} à retirer`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder(`Maximum: ${selectedResource.quantity} unités`)
      .setMinLength(1)
      .setMaxLength(10);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
      amountInput
    );
    modal.addComponents([row]);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in stock admin remove select:", { error });
    await interaction.reply({
      content: ERROR_MESSAGES.ADMIN_STOCK_RESOURCE_SELECT_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la soumission du modal de retrait de ressource
 */
export async function handleStockAdminRemoveModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const amount = parseInt(
      interaction.fields.getTextInputValue("amount_input"),
      10
    );

    if (isNaN(amount) || amount <= 0) {
      await interaction.editReply({
        content: "❌ Veuillez entrer un nombre valide (supérieur à 0).",
      });
      return;
    }

    // Extraire l'ID du type de ressource du custom ID du modal
    const modalCustomId = interaction.customId;
    const resourceTypeId = parseInt(modalCustomId.split("_")[4]);

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || "");
    const resources = await apiService.getResources("CITY", town.id);
    const selectedResource = resources?.find(
      (resource: any) => resource.resourceType.id === resourceTypeId
    );

    if (!town) {
      await interaction.editReply({
        content: "❌ Informations manquantes pour effectuer l'opération.",
      });
      return;
    }

    // Récupérer tous les types de ressources pour avoir les détails du type sélectionné
    let allResourceTypes = [];
    try {
      allResourceTypes = (await apiService.getAllResourceTypes()) || [];
      logger.info(
        `Found ${allResourceTypes.length} resource types from getAllResourceTypes()`
      );
    } catch (error) {
      logger.error("Could not get resource types for modal", { error });
      await interaction.editReply({
        content:
          "❌ Service de récupération des types de ressources non disponible.",
      });
      return;
    }

    const selectedResourceType = allResourceTypes.find(
      (resourceType: any) => resourceType.id === resourceTypeId
    );

    if (!selectedResourceType) {
      await interaction.editReply({
        content: "❌ Type de ressource non trouvé.",
      });
      return;
    }

    // Vérifier si la ressource existe déjà dans la ville et si on a assez de stock
    if (selectedResource) {
      // Vérifier que la quantité demandée ne dépasse pas le stock disponible
      if (amount > selectedResource.quantity) {
        await interaction.editReply({
          content: `❌ Quantité insuffisante. Stock disponible: **${selectedResource.quantity}** unités de ${selectedResourceType.name}.`,
        });
        return;
      }

      // Ressource existe : mettre à jour la quantité existante (retrait)
      await apiService.updateResource(
        "CITY",
        town.id,
        resourceTypeId,
        selectedResource.quantity - amount
      );

      // Créer l'embed de confirmation pour retrait de ressource existante
      const embed = createSuccessEmbed(
        `${selectedResource.resourceType.emoji} ${selectedResource.resourceType.name} Retirés`,
        `**${amount}** unités de ${selectedResourceType.name} ont été retirées de la ville **${town.name}**.`
      ).addFields(
        {
          name: "Ancien stock",
          value: `${selectedResource.quantity}`,
          inline: true,
        },
        { name: "Montant retiré", value: `-${amount}`, inline: true },
        {
          name: "Nouveau stock",
          value: `${selectedResource.quantity - amount}`,
          inline: true,
        }
      );

      await interaction.editReply({
        embeds: [embed],
      });

      logger.info("Resource removed successfully via stock admin (existing)", {
        guildId: interaction.guildId,
        townId: town.id,
        townName: town.name,
        resourceTypeId,
        resourceTypeName: selectedResourceType.name,
        amount,
        previousStock: selectedResource.quantity,
        newStock: selectedResource.quantity - amount,
        userId: interaction.user.id,
      });
    } else {
      // Ressource n'existe pas : erreur car on ne peut pas retirer une ressource qui n'existe pas
      await interaction.editReply({
        content: "❌ Impossible de retirer une ressource qui n'existe pas dans la ville.",
      });
      return;
    }
  } catch (error) {
    logger.error("Error in stock admin remove modal:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });
    await interaction.editReply({
      content: `❌ Erreur lors du retrait de ressource : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    });
  }
}

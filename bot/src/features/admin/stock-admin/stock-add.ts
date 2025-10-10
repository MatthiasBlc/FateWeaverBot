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
import { createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { replyEphemeral } from "../../../utils/interaction-helpers";
import { checkAdmin } from "../../../utils/admin";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { getTownByGuildId } from "../../../utils/town";

/**
 * Handler pour le bouton "Ajouter des ressources"
 */
export async function handleStockAdminAddButton(interaction: any) {
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

    // Récupérer tous les types de ressources disponibles depuis la nouvelle API dédiée
    let allResourceTypes = [];
    try {
      allResourceTypes = (await apiService.getAllResourceTypes()) || [];
      logger.info(
        `Found ${allResourceTypes.length} resource types from getAllResourceTypes()`
      );
    } catch (error) {
      logger.error("Could not get resource types from getAllResourceTypes()", {
        error,
      });
      // Si l'API dédiée ne fonctionne pas, affiche le message d'erreur
      await interaction.editReply({
        content:
          "❌ Service de récupération des types de ressources non disponible. Veuillez contacter un administrateur.",
        embeds: [],
        components: [],
      });
      return;
    }

    const townResources = await apiService.getResources("CITY", town.id);

    // Créer le menu de sélection avec TOUS les types de ressources disponibles
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("stock_admin_add_select")
      .setPlaceholder("Sélectionnez le type de ressource à ajouter")
      .addOptions(
        allResourceTypes.map((resourceType: any) => {
          // Trouver le stock actuel de cette ressource dans la ville (sera 0 si n'existe pas)
          const currentStock = townResources?.find(
            (townResource: any) =>
              townResource.resourceType.id === resourceType.id
          );
          const currentQuantity = currentStock?.quantity || 0;

          return {
            label: `${resourceType.emoji} ${resourceType.name}`,
            description: `Stock actuel: ${currentQuantity} unités${
              resourceType.description ? ` - ${resourceType.description}` : ""
            }`,
            value: resourceType.id.toString(),
          };
        })
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    const embed = createSuccessEmbed(
      `➕ Ajouter des Ressources - ${town.name}`,
      "Sélectionnez le type de ressource que vous souhaitez ajouter :"
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    logger.info("Stock admin add interface displayed", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      userId: interaction.user.id,
      availableResourceTypes: allResourceTypes.length,
    });
  } catch (error) {
    logger.error("Error in stock admin add button:", { error });
    await interaction.editReply({
      content: ERROR_MESSAGES.ADMIN_STOCK_ADD_PREP_ERROR,
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour la sélection de ressource lors de l'ajout
 */
export async function handleStockAdminAddSelect(
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

    // Récupérer tous les types de ressources pour avoir les détails du type sélectionné
    let allResourceTypes = [];
    try {
      allResourceTypes = (await apiService.getAllResourceTypes()) || [];
    } catch (error) {
      logger.error("Could not get resource types for select", { error });
      await interaction.reply({
        content:
          "❌ Service de récupération des types de ressources non disponible.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const selectedResourceType = allResourceTypes.find(
      (resourceType: any) => resourceType.id === resourceTypeId
    );

    if (!selectedResourceType) {
      await interaction.reply({
        content: "❌ Type de ressource non trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le modal pour saisir la quantité
    const modal = new ModalBuilder()
      .setCustomId(`stock_admin_add_modal_${resourceTypeId}`)
      .setTitle(
        `Ajouter ${selectedResourceType.emoji} ${selectedResourceType.name}`
      );

    const amountInput = new TextInputBuilder()
      .setCustomId("amount_input")
      .setLabel(`Quantité de ${selectedResourceType.name} à ajouter`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Entrez un nombre (ex: 100)")
      .setMinLength(1)
      .setMaxLength(10);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
      amountInput
    );
    modal.addComponents([row]);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in stock admin add select:", { error });
    await interaction.reply({
      content: ERROR_MESSAGES.ADMIN_STOCK_RESOURCE_SELECT_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la soumission du modal d'ajout de ressource
 */
export async function handleStockAdminAddModal(
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
    if (!town) {
      await interaction.editReply({
        content: "❌ Informations manquantes pour effectuer l'opération.",
      });
      return;
    }

    const resources = await apiService.getResources("CITY", town.id);
    const selectedResource = resources?.find(
      (resource: any) => resource.resourceType.id === resourceTypeId
    );

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

    // Vérifier si la ressource existe déjà dans la ville
    if (selectedResource) {
      // Ressource existe : mettre à jour la quantité existante (ajout)
      await apiService.updateResource(
        "CITY",
        town.id,
        resourceTypeId,
        selectedResource.quantity + amount
      );

      // Créer l'embed de confirmation pour ajout de ressource existante
      const embed = createSuccessEmbed(
        `${selectedResource.resourceType.emoji} ${selectedResource.resourceType.name} Ajoutés`,
        `**${amount}** unités de ${selectedResourceType.name} ont été ajoutées à la ville **${town.name}**.`
      ).addFields(
        {
          name: "Ancien stock",
          value: `${selectedResource.quantity}`,
          inline: true,
        },
        { name: "Montant ajouté", value: `+${amount}`, inline: true },
        {
          name: "Nouveau stock",
          value: `${selectedResource.quantity + amount}`,
          inline: true,
        }
      );

      await interaction.editReply({
        embeds: [embed],
      });

      logger.info("Resource added successfully via stock admin (existing)", {
        guildId: interaction.guildId,
        townId: town.id,
        townName: town.name,
        resourceTypeId,
        resourceTypeName: selectedResourceType.name,
        amount,
        previousStock: selectedResource.quantity,
        newStock: selectedResource.quantity + amount,
        userId: interaction.user.id,
      });
    } else {
      // Ressource n'existe pas : la créer avec la nouvelle quantité
      await apiService.updateResource(
        "CITY",
        town.id,
        resourceTypeId,
        amount
      );

      // Créer l'embed de confirmation pour création de nouvelle ressource
      const embed = createSuccessEmbed(
        `${selectedResourceType.emoji} ${selectedResourceType.name} Ajoutés`,
        `**${amount}** unités de ${selectedResourceType.name} ont été ajoutées à la ville **${town.name}**.`
      ).addFields(
        {
          name: "Ancien stock",
          value: "0",
          inline: true,
        },
        { name: "Montant ajouté", value: `+${amount}`, inline: true },
        {
          name: "Nouveau stock",
          value: `${amount}`,
          inline: true,
        }
      );

      await interaction.editReply({
        embeds: [embed],
      });

      logger.info("Resource added successfully via stock admin (new)", {
        guildId: interaction.guildId,
        townId: town.id,
        townName: town.name,
        resourceTypeId,
        resourceTypeName: selectedResourceType.name,
        amount,
        newStock: amount,
        userId: interaction.user.id,
      });
    }
  } catch (error) {
    logger.error("Error in stock admin add modal:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });
    await interaction.editReply({
      content: `❌ Erreur lors de l'ajout de ressource : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    });
  }
}

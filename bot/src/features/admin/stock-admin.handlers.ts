import {
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { getTownByGuildId } from "../../utils/town";
import { checkAdmin } from "../../utils/admin";

/**
 * Handler principal pour la commande /stock-admin unifiée
 * Affiche directement les stocks avec boutons d'actions en dessous
 */
export async function handleStockAdminCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn("Utilisateur non admin tente d'utiliser la commande stock admin", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });
      return;
    }

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || '');
    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les ressources de la ville
    const resources = await apiService.getResources('CITY', town.id);

    // Créer l'embed avec les stocks
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`🏛️ Ressources de ${town.name}`)
      .setDescription("Vue complète des stocks de ressources de la ville")
      .setTimestamp();

    // Ajouter chaque ressource avec son stock
    if (resources && resources.length > 0) {
      resources.forEach((resource: any) => {
        const resourceType = resource.resourceType;
        const quantity = resource.quantity;

        // Déterminer la couleur selon le niveau de stock
        let color = 0x00ff00; // Vert par défaut
        if (quantity < 10) color = 0xff0000; // Rouge si très faible
        else if (quantity < 50) color = 0xffa500; // Orange si faible
        else if (quantity < 100) color = 0xffff00; // Jaune si moyen

        embed.addFields({
          name: `${resourceType.emoji} ${resourceType.name}`,
          value: `**${quantity}** unités`,
          inline: true,
        });
      });
    } else {
      embed.addFields({
        name: "📦 Ressources",
        value: "Aucune ressource trouvée",
        inline: false,
      });
    }

    // Créer les boutons d'actions (seulement ajouter et retirer)
    const addButton = new ButtonBuilder()
      .setCustomId("stock_admin_add")
      .setLabel("➕ Ajouter")
      .setStyle(ButtonStyle.Success);

    const removeButton = new ButtonBuilder()
      .setCustomId("stock_admin_remove")
      .setLabel("➖ Retirer")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(addButton, removeButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    });

    logger.info("Stock admin interface with stocks displayed", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      userId: interaction.user.id,
      resourcesCount: resources?.length || 0,
    });

  } catch (error) {
    logger.error("Error in stock admin command:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'affichage de l'interface.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Voir les stocks"
 */
export async function handleStockAdminViewButton(interaction: any) {
  try {
    await interaction.deferUpdate();

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || '');
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Récupérer les ressources de la ville
    const resources = await apiService.getResources('CITY', town.id);

    if (!resources || resources.length === 0) {
      await interaction.editReply({
        content: "❌ Aucune ressource trouvée",
        embeds: [],
        components: [],
      });
      return;
    }

    // Créer l'embed avec toutes les ressources
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`🏛️ Ressources de ${town.name}`)
      .setDescription("Vue complète des stocks de ressources de la ville")
      .setTimestamp();

    // Ajouter chaque ressource avec son stock
    resources.forEach((resource: any) => {
      const resourceType = resource.resourceType;
      const quantity = resource.quantity;

      // Déterminer la couleur selon le niveau de stock
      let color = 0x00ff00; // Vert par défaut
      if (quantity < 10) color = 0xff0000; // Rouge si très faible
      else if (quantity < 50) color = 0xffa500; // Orange si faible
      else if (quantity < 100) color = 0xffff00; // Jaune si moyen

      embed.addFields({
        name: `${resourceType.emoji} ${resourceType.name}`,
        value: `**${quantity}** unités`,
        inline: true,
      });
    });

    await interaction.editReply({
      embeds: [embed],
      components: [],
    });

    logger.info("Stock admin view displayed via button", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      userId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in stock admin view button:", { error });
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors de la récupération des ressources.",
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour le bouton "Ajouter des ressources"
 */
export async function handleStockAdminAddButton(interaction: any) {
  try {
    await interaction.deferUpdate();

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || '');
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Récupérer les ressources de la ville actuelle pour extraire tous les types de ressources disponibles
    const townResources = await apiService.getResources('CITY', town.id);
    const allResourceTypes = townResources || []; // Utiliser les ressources de la ville comme référence pour les types

    if (!allResourceTypes || allResourceTypes.length === 0) {
      await interaction.editReply({
        content: "❌ Aucun type de ressource trouvé.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Créer le menu de sélection de ressource avec TOUS les types disponibles
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("stock_admin_add_select")
      .setPlaceholder("Sélectionnez le type de ressource à ajouter")
      .addOptions(
        allResourceTypes.map((resource: any) => {
          // Trouver le stock actuel de cette ressource dans la ville
          const currentStock = townResources?.find((townResource: any) => townResource.resourceType.id === resource.resourceType.id);
          const currentQuantity = currentStock?.quantity || 0;

          return {
            label: `${resource.resourceType.emoji} ${resource.resourceType.name}`,
            description: `Stock actuel: ${currentQuantity} unités${resource.resourceType.description ? ` - ${resource.resourceType.description}` : ''}`,
            value: resource.resourceType.id.toString(),
          };
        })
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`➕ Ajouter des Ressources - ${town.name}`)
      .setDescription("Sélectionnez le type de ressource que vous souhaitez ajouter :")
      .setTimestamp();

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
      content: "❌ Une erreur est survenue lors de la préparation de l'ajout de ressources.",
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour le bouton "Retirer des ressources"
 */
export async function handleStockAdminRemoveButton(interaction: any) {
  try {
    await interaction.deferUpdate();

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || '');
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Récupérer les ressources disponibles dans la ville (avec stock > 0)
    const resources = await apiService.getResources('CITY', town.id);
    const availableResources = resources?.filter((resource: any) => resource.quantity > 0) || [];

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

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle(`➖ Retirer des Ressources - ${town.name}`)
      .setDescription("Sélectionnez le type de ressource que vous souhaitez retirer :")
      .setTimestamp();

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
      content: "❌ Une erreur est survenue lors de la préparation du retrait de ressources.",
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour la sélection de ressource lors de l'ajout
 */
export async function handleStockAdminAddSelect(interaction: StringSelectMenuInteraction) {
  try {
    const resourceTypeId = parseInt(interaction.values[0]);
    const town = await getTownByGuildId(interaction.guildId || '');

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les détails du type de ressource
    const resources = await apiService.getResources('CITY', town.id);
    const selectedResource = resources?.find((resource: any) => resource.resourceType.id === resourceTypeId);

    if (!selectedResource) {
      await interaction.reply({
        content: "❌ Type de ressource non trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le modal pour saisir la quantité
    const modal = new ModalBuilder()
      .setCustomId(`stock_admin_add_modal_${resourceTypeId}`)
      .setTitle(`Ajouter ${selectedResource.resourceType.emoji} ${selectedResource.resourceType.name}`);

    const amountInput = new TextInputBuilder()
      .setCustomId("amount_input")
      .setLabel(`Quantité de ${selectedResource.resourceType.name} à ajouter`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Entrez un nombre (ex: 100)")
      .setMinLength(1)
      .setMaxLength(10);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    modal.addComponents([row]);

    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in stock admin add select:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la sélection de la ressource.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la sélection de ressource lors du retrait
 */
export async function handleStockAdminRemoveSelect(interaction: StringSelectMenuInteraction) {
  try {
    const resourceTypeId = parseInt(interaction.values[0]);
    const town = await getTownByGuildId(interaction.guildId || '');

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les détails du type de ressource et le stock actuel
    const resources = await apiService.getResources('CITY', town.id);
    const selectedResource = resources?.find((resource: any) => resource.resourceType.id === resourceTypeId);

    if (!selectedResource) {
      await interaction.reply({
        content: "❌ Type de ressource non trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le modal pour saisir la quantité
    const modal = new ModalBuilder()
      .setCustomId(`stock_admin_remove_modal_${resourceTypeId}`)
      .setTitle(`Retirer ${selectedResource.resourceType.emoji} ${selectedResource.resourceType.name}`);

    const amountInput = new TextInputBuilder()
      .setCustomId("amount_input")
      .setLabel(`Quantité de ${selectedResource.resourceType.name} à retirer`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder(`Maximum: ${selectedResource.quantity} unités`)
      .setMinLength(1)
      .setMaxLength(10);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    modal.addComponents([row]);

    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in stock admin remove select:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la sélection de la ressource.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la soumission du modal d'ajout de ressource
 */
export async function handleStockAdminAddModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const amount = parseInt(interaction.fields.getTextInputValue("amount_input"), 10);

    if (isNaN(amount) || amount <= 0) {
      await interaction.editReply({
        content: "❌ Veuillez entrer un nombre valide (supérieur à 0).",
      });
      return;
    }

    // Extraire l'ID du type de ressource du custom ID du modal
    const modalCustomId = interaction.customId;
    const resourceTypeId = parseInt(modalCustomId.split('_')[4]);

    // Récupérer la ville et le type de ressource
    const town = await getTownByGuildId(interaction.guildId || '');
    const resources = await apiService.getResources('CITY', town.id);
    const selectedResource = resources?.find((resource: any) => resource.resourceType.id === resourceTypeId);

    if (!town || !selectedResource) {
      await interaction.editReply({
        content: "❌ Informations manquantes pour effectuer l'opération.",
      });
      return;
    }

    // Ajouter la ressource via l'API
    await apiService.updateResource('CITY', town.id, resourceTypeId, selectedResource.quantity + amount);

    // Créer l'embed de confirmation
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`✅ ${selectedResource.resourceType.emoji} ${selectedResource.resourceType.name} Ajoutés`)
      .setDescription(`**${amount}** unités de ${selectedResource.resourceType.name} ont été ajoutées à la ville **${town.name}**.`)
      .addFields(
        { name: "Ancien stock", value: `${selectedResource.quantity}`, inline: true },
        { name: "Montant ajouté", value: `+${amount}`, inline: true },
        { name: "Nouveau stock", value: `${selectedResource.quantity + amount}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });

    logger.info("Resource added successfully via stock admin", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      resourceTypeId,
      resourceTypeName: selectedResource.resourceType.name,
      amount,
      previousStock: selectedResource.quantity,
      newStock: selectedResource.quantity + amount,
      userId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in stock admin add modal:", { error });
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors de l'ajout de la ressource.",
    });
  }
}

/**
 * Handler pour la soumission du modal de retrait de ressource
 */
export async function handleStockAdminRemoveModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const amount = parseInt(interaction.fields.getTextInputValue("amount_input"), 10);

    if (isNaN(amount) || amount <= 0) {
      await interaction.editReply({
        content: "❌ Veuillez entrer un nombre valide (supérieur à 0).",
      });
      return;
    }

    // Extraire l'ID du type de ressource du custom ID du modal
    const modalCustomId = interaction.customId;
    const resourceTypeId = parseInt(modalCustomId.split('_')[4]);

    // Récupérer la ville et le type de ressource
    const town = await getTownByGuildId(interaction.guildId || '');
    const resources = await apiService.getResources('CITY', town.id);
    const selectedResource = resources?.find((resource: any) => resource.resourceType.id === resourceTypeId);

    if (!town || !selectedResource) {
      await interaction.editReply({
        content: "❌ Informations manquantes pour effectuer l'opération.",
      });
      return;
    }

    if (selectedResource.quantity < amount) {
      await interaction.editReply({
        content: `❌ La ville n'a que **${selectedResource.quantity}** unités de ${selectedResource.resourceType.name}. Vous ne pouvez pas en retirer **${amount}**.`,
      });
      return;
    }

    // Retirer la ressource via l'API
    await apiService.updateResource('CITY', town.id, resourceTypeId, selectedResource.quantity - amount);

    // Créer l'embed de confirmation
    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle(`✅ ${selectedResource.resourceType.emoji} ${selectedResource.resourceType.name} Retirés`)
      .setDescription(`**${amount}** unités de ${selectedResource.resourceType.name} ont été retirées de la ville **${town.name}**.`)
      .addFields(
        { name: "Ancien stock", value: `${selectedResource.quantity}`, inline: true },
        { name: "Montant retiré", value: `-${amount}`, inline: true },
        { name: "Nouveau stock", value: `${selectedResource.quantity - amount}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });

    logger.info("Resource removed successfully via stock admin", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      resourceTypeId,
      resourceTypeName: selectedResource.resourceType.name,
      amount,
      previousStock: selectedResource.quantity,
      newStock: selectedResource.quantity - amount,
      userId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in stock admin remove modal:", { error });
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors du retrait de la ressource.",
    });
  }
}

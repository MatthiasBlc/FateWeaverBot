import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { getActiveCharacterFromCommand, getActiveCharacterFromModal } from "../../../utils/character";
import { createInfoEmbed, createSuccessEmbed } from "../../../utils/embeds";
import { replyEphemeral } from "../../../utils/interaction-helpers";
import { RESOURCES } from "@shared/constants/emojis";
import { ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { STATUS } from "../../../constants/emojis.js";


/**
 * Handler for "Gérer ressources" button
 * Shows interface with Add/Remove buttons
 */
export async function handleExpeditionManageResources(interaction: ButtonInteraction) {
  try {
    // Get user's active character
    const character = await getActiveCharacterFromCommand(interaction as any);
    if (!character) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Vous devez avoir un personnage actif.`);
      return;
    }

    // Get character's active expedition
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(character.id);
    if (!activeExpeditions || activeExpeditions.length === 0) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Votre personnage ne participe à aucune expédition active.`);
      return;
    }

    const expedition = activeExpeditions[0];

    // Check if expedition is in PLANNING status
    if (expedition.status !== "PLANNING") {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Vous ne pouvez gérer les ressources que pendant la phase de planification.`
      );
      return;
    }

    // Get expedition resources
    const expeditionResources = await apiService.getResources("EXPEDITION", expedition.id);

    // Build resource list
    const resourcesList = expeditionResources.length > 0
      ? expeditionResources
          .map((r: any) => `${r.resourceType.emoji} **${r.resourceType.name}:** ${r.quantity}`)
          .join("\n")
      : "_Aucune ressource dans l'expédition_";

    const embed = createInfoEmbed(`${RESOURCES.GENERIC} Gestion des ressources`)
      .setDescription(`**Expédition:** ${expedition.name}\n\nGérez les ressources de votre expédition.`)
      .addFields({
        name: "📦 Ressources de l'expédition",
        value: resourcesList,
        inline: false,
      });

    const addButton = new ButtonBuilder()
      .setCustomId(`expedition_resource_add:${expedition.id}`)
      .setLabel("Ajouter ressource")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Success);

    const removeButton = new ButtonBuilder()
      .setCustomId(`expedition_resource_remove:${expedition.id}`)
      .setLabel("Retirer ressource")
      .setEmoji("➖")
      .setStyle(ButtonStyle.Danger);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(addButton, removeButton);

    await interaction.reply({
      embeds: [embed],
      components: [buttonRow],
      flags: ["Ephemeral"],
    });

    logger.info("Expedition resource management interface shown", {
      expeditionId: expedition.id,
      characterId: character.id,
    });
  } catch (error) {
    logger.error("Error in expedition manage resources:", { error });
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Erreur lors de l'affichage de la gestion des ressources: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
}

/**
 * Handler for "Ajouter ressource" button
 * Shows menu of town resources
 */
export async function handleExpeditionResourceAdd(interaction: ButtonInteraction) {
  try {
    const expeditionId = interaction.customId.split(":")[1];

    // Get character
    const character = await getActiveCharacterFromCommand(interaction as any);
    if (!character) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Vous devez avoir un personnage actif.`);
      return;
    }

    // Get town ID
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);
    if (!town) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`);
      return;
    }

    // Get town resources (only those with quantity > 0)
    const townResources = await apiService.getResources("CITY", town.id);
    const availableResources = townResources.filter((r: any) => r.quantity > 0);

    if (availableResources.length === 0) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune ressource disponible dans le stock de la ville.`);
      return;
    }

    // Create select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_resource_add_select:${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à ajouter...")
      .addOptions(
        availableResources.map((r: any) => ({
          label: r.resourceType.name,
          value: r.resourceTypeId.toString(),
          description: `Disponible: ${r.quantity}`,
          emoji: r.resourceType.emoji || "📦",
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "📦 Sélectionnez une ressource à transférer de la ville vers l'expédition :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition resource add:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de l'affichage des ressources.`);
  }
}

/**
 * Handler for "Retirer ressource" button
 * Shows menu of expedition resources
 */
export async function handleExpeditionResourceRemove(interaction: ButtonInteraction) {
  try {
    const expeditionId = interaction.customId.split(":")[1];

    // Get character
    const character = await getActiveCharacterFromCommand(interaction as any);
    if (!character) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Vous devez avoir un personnage actif.`);
      return;
    }

    // Get expedition resources (only those with quantity > 0)
    const expeditionResources = await apiService.getResources("EXPEDITION", expeditionId);
    const availableResources = expeditionResources.filter((r: any) => r.quantity > 0);

    if (availableResources.length === 0) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune ressource dans l'expédition.`);
      return;
    }

    // Create select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_resource_remove_select:${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à retirer...")
      .addOptions(
        availableResources.map((r: any) => ({
          label: r.resourceType.name,
          value: r.resourceTypeId.toString(),
          description: `Dans l'expédition: ${r.quantity}`,
          emoji: r.resourceType.emoji || "📦",
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "📦 Sélectionnez une ressource à transférer de l'expédition vers la ville :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition resource remove:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de l'affichage des ressources.`);
  }
}

/**
 * Handler for resource selection when adding (town -> expedition)
 */
export async function handleExpeditionResourceAddSelect(interaction: StringSelectMenuInteraction) {
  try {
    const expeditionId = interaction.customId.split(":")[1];
    const resourceTypeId = parseInt(interaction.values[0], 10);

    // Get resource type details
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    if (!resourceType) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Type de ressource introuvable.`);
      return;
    }

    // Get town ID
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);
    if (!town) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune ville trouvée.`);
      return;
    }

    // Get available quantity in town
    const townResources = await apiService.getResources("CITY", town.id);
    const townResource = townResources.find((r: any) => r.resourceTypeId === resourceTypeId);
    const maxAvailable = townResource?.quantity || 0;

    // Show modal to enter quantity
    const modal = new ModalBuilder()
      .setCustomId(`expedition_resource_add_quantity:${expeditionId}:${resourceTypeId}`)
      .setTitle(`Ajouter ${resourceType.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("resource_quantity_input")
      .setLabel(`${resourceType.emoji} Quantité de ${resourceType.name}`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder(`Max disponible: ${maxAvailable}`)
      .setMinLength(1)
      .setMaxLength(10);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);
    modal.addComponents([firstRow]);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in expedition resource add select:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de la sélection de ressource.`);
  }
}

/**
 * Handler for resource selection when removing (expedition -> town)
 */
export async function handleExpeditionResourceRemoveSelect(interaction: StringSelectMenuInteraction) {
  try {
    const expeditionId = interaction.customId.split(":")[1];
    const resourceTypeId = parseInt(interaction.values[0], 10);

    // Get resource type details
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    if (!resourceType) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Type de ressource introuvable.`);
      return;
    }

    // Get available quantity in expedition
    const expeditionResources = await apiService.getResources("EXPEDITION", expeditionId);
    const expeditionResource = expeditionResources.find((r: any) => r.resourceTypeId === resourceTypeId);
    const maxAvailable = expeditionResource?.quantity || 0;

    // Show modal to enter quantity
    const modal = new ModalBuilder()
      .setCustomId(`expedition_resource_remove_quantity:${expeditionId}:${resourceTypeId}`)
      .setTitle(`Retirer ${resourceType.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("resource_quantity_input")
      .setLabel(`${resourceType.emoji} Quantité de ${resourceType.name}`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder(`Max disponible: ${maxAvailable}`)
      .setMinLength(1)
      .setMaxLength(10);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);
    modal.addComponents([firstRow]);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in expedition resource remove select:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de la sélection de ressource.`);
  }
}

/**
 * Handler for add quantity modal submission
 */
export async function handleExpeditionResourceAddQuantity(interaction: ModalSubmitInteraction) {
  try {
    const parts = interaction.customId.split(":");
    const expeditionId = parts[1];
    const resourceTypeId = parseInt(parts[2], 10);

    const quantityStr = interaction.fields.getTextInputValue("resource_quantity_input");
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(quantity) || quantity <= 0) {
      await replyEphemeral(interaction, `${STATUS.ERROR} La quantité doit être un nombre positif.`);
      return;
    }

    // Get character
    const character = await getActiveCharacterFromModal(interaction);
    if (!character) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Vous devez avoir un personnage actif.`);
      return;
    }

    // Get town
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);
    if (!town) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune ville trouvée.`);
      return;
    }

    // Get resource type for name
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    // Transfer resource from town to expedition
    await apiService.transferResource("CITY", town.id, "EXPEDITION", expeditionId, resourceTypeId, quantity);

    const embed = createSuccessEmbed(
      `${STATUS.SUCCESS} Ressource transférée`,
      `**${quantity}x ${resourceType?.name || "ressource"}** transféré(es) de la ville vers l'expédition !`
    );

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });

    logger.info("Resource transferred to expedition", {
      expeditionId,
      resourceTypeId,
      quantity,
      characterId: character.id,
      direction: "town_to_expedition",
    });
  } catch (error: any) {
    logger.error("Error in expedition resource add quantity:", { error });
    const errorMessage = error?.response?.data?.error || error?.message || "Erreur inconnue";
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Erreur lors du transfert: ${errorMessage}`
    );
  }
}

/**
 * Handler for remove quantity modal submission
 */
export async function handleExpeditionResourceRemoveQuantity(interaction: ModalSubmitInteraction) {
  try {
    const parts = interaction.customId.split(":");
    const expeditionId = parts[1];
    const resourceTypeId = parseInt(parts[2], 10);

    const quantityStr = interaction.fields.getTextInputValue("resource_quantity_input");
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(quantity) || quantity <= 0) {
      await replyEphemeral(interaction, `${STATUS.ERROR} La quantité doit être un nombre positif.`);
      return;
    }

    // Get character
    const character = await getActiveCharacterFromModal(interaction);
    if (!character) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Vous devez avoir un personnage actif.`);
      return;
    }

    // Get town
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);
    if (!town) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Aucune ville trouvée.`);
      return;
    }

    // Get resource type for name
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    // Transfer resource from expedition to town
    await apiService.transferResource("EXPEDITION", expeditionId, "CITY", town.id, resourceTypeId, quantity);

    const embed = createSuccessEmbed(
      `${STATUS.SUCCESS} Ressource retirée`,
      `**${quantity}x ${resourceType?.name || "ressource"}** transféré(es) de l'expédition vers la ville !`
    );

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });

    logger.info("Resource transferred from expedition", {
      expeditionId,
      resourceTypeId,
      quantity,
      characterId: character.id,
      direction: "expedition_to_town",
    });
  } catch (error: any) {
    logger.error("Error in expedition resource remove quantity:", { error });
    const errorMessage = error?.response?.data?.error || error?.message || "Erreur inconnue";
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Erreur lors du transfert: ${errorMessage}`
    );
  }
}

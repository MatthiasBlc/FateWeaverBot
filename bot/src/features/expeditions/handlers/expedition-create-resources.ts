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
import { createInfoEmbed } from "../../../utils/embeds";
import { replyEphemeral } from "../../../utils/interaction-helpers";
import { EXPEDITION, RESOURCES, STATUS } from "@shared/constants/emojis";
import { expeditionCache } from "../../../services/expedition-cache";
import { createExpeditionResourceQuantityModal } from "../../../modals/expedition-modals";

/**
 * Handler for "Add Resources" button during expedition creation
 */
export async function handleExpeditionAddResources(
  interaction: ButtonInteraction
) {
  try {
    const cacheId = interaction.customId.split(":")[1];

    // Retrieve expedition data from cache
    const expeditionData = expeditionCache.retrieve(cacheId, interaction.user.id);

    if (!expeditionData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Oups, on dirait que tu as mis un peu trop de temps à créer ton expédition. Recommence !`
      );
      return;
    }

    // Get town resources
    const townResources = await apiService.getResources(
      "CITY",
      expeditionData.townId
    );

    // Filter available resources (quantity > 0)
    const availableResources = townResources.filter((r: any) => r.quantity > 0);

    if (availableResources.length === 0) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Aucune ressource disponible dans le stock de la ville.`
      );
      return;
    }

    // Create select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_create_select_resource:${cacheId}`)
      .setPlaceholder("Ajout d'une ressource...")
      .addOptions(
        availableResources.map((r: any) => ({
          label: r.resourceType.name,
          value: r.resourceTypeId.toString(),
          description: `Disponible: ${r.quantity}`,
          emoji: r.resourceType.emoji || "📦",
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.update({
      content: `${RESOURCES.GENERIC} Préparation des ressources :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Error in handleExpeditionAddResources:", { error });
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Erreur lors de l'affichage des ressources.`
    );
  }
}

/**
 * Handler for resource selection during expedition creation
 */
export async function handleExpeditionResourceSelected(
  interaction: StringSelectMenuInteraction
) {
  try {
    const customId = interaction.customId;
    const cacheId = customId.split(":")[1];
    const resourceTypeId = parseInt(interaction.values[0], 10);

    // Retrieve expedition data from cache
    const expeditionData = expeditionCache.retrieve(cacheId, interaction.user.id);

    if (!expeditionData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Oups, on dirait que tu as mis un peu trop de temps à créer ton expédition. Recommence !`
      );
      return;
    }

    // Get town resources to find the selected resource
    const townResources = await apiService.getResources(
      "CITY",
      expeditionData.townId
    );

    const selectedResource = townResources.find(
      (r: any) => r.resourceTypeId === resourceTypeId
    );

    if (!selectedResource || selectedResource.quantity <= 0) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Cette ressource n'est plus disponible.`
      );
      return;
    }

    // Show modal to enter quantity
    const modal = createExpeditionResourceQuantityModal(
      cacheId,
      resourceTypeId,
      selectedResource.resourceType.name,
      selectedResource.resourceType.emoji,
      selectedResource.quantity
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in handleExpeditionResourceSelected:", { error });
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Erreur lors de la sélection de la ressource.`
    );
  }
}

/**
 * Handler for resource quantity modal submission
 */
export async function handleExpeditionResourceQuantityModal(
  interaction: ModalSubmitInteraction
) {
  try {
    const customIdParts = interaction.customId.split(":");
    const cacheId = customIdParts[1];
    const resourceTypeId = parseInt(customIdParts[2], 10);

    const quantityStr = interaction.fields.getTextInputValue("resource_quantity_input");
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(quantity) || quantity <= 0) {
      await replyEphemeral(interaction, `${STATUS.ERROR} La quantité doit être un nombre positif.`);
      return;
    }

    // Retrieve expedition data from cache
    const expeditionData = expeditionCache.retrieve(cacheId, interaction.user.id);

    if (!expeditionData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Oups, on dirait que tu as mis un peu trop de temps à créer ton expédition. Recommence !`
      );
      return;
    }

    // Get resource type info
    const resourceTypes = await apiService.getResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    if (!resourceType) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Type de ressource introuvable.`);
      return;
    }

    // Verify town has enough stock
    const townResources = await apiService.getResources("CITY", expeditionData.townId);
    const townResource = townResources.find((r: any) => r.resourceTypeId === resourceTypeId);

    if (!townResource || townResource.quantity < quantity) {
      await replyEphemeral(
        interaction,
        `❌ Stock insuffisant. Disponible: ${townResource?.quantity || 0}`
      );
      return;
    }

    // Add resource to cache
    const existingResourceIndex = expeditionData.resources.findIndex(
      (r: any) => r.resourceTypeId === resourceTypeId
    );

    if (existingResourceIndex >= 0) {
      // Update existing resource
      expeditionData.resources[existingResourceIndex].quantity += quantity;
    } else {
      // Add new resource
      expeditionData.resources.push({
        resourceTypeId,
        resourceTypeName: resourceType.name,
        emoji: resourceType.emoji,
        quantity,
      });
    }

    // Update cache
    expeditionCache.store(interaction.user.id, expeditionData, cacheId);

    logger.debug("Resource added to expedition draft", {
      cacheId,
      resourceTypeId,
      quantity,
      totalResources: expeditionData.resources.length,
    });

    // Show updated interface with resources
    await showResourceManagementInterface(interaction, cacheId, expeditionData);
  } catch (error) {
    logger.error("Error in handleExpeditionResourceQuantityModal:", { error });
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Erreur lors de l'ajout de la ressource.`
    );
  }
}

/**
 * Handler for "Validate and choose direction" button
 */
export async function handleExpeditionValidateResources(
  interaction: ButtonInteraction
) {
  try {
    const cacheId = interaction.customId.split(":")[1];

    // Retrieve expedition data from cache
    const expeditionData = expeditionCache.retrieve(cacheId, interaction.user.id);

    if (!expeditionData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Oups, on dirait que tu as mis un peu trop de temps à créer ton expédition. Recommence !`
      );
      return;
    }

    // Show direction selection menu
    const directionMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_direction:${cacheId}`)
      .setPlaceholder("Direction initiale...")
      .addOptions([
        { label: "Nord", value: "NORD", emoji: "⬆️" },
        { label: "Nord-Est", value: "NORD_EST", emoji: "↗️" },
        // { label: "Est", value: "EST", emoji: "➡️" },
        { label: "Sud-Est", value: "SUD_EST", emoji: "↘️" },
        { label: "Sud", value: "SUD", emoji: "⬇️" },
        { label: "Sud-Ouest", value: "SUD_OUEST", emoji: "↙️" },
        // { label: "Ouest", value: "OUEST", emoji: "⬅️" },
        { label: "Nord-Ouest", value: "NORD_OUEST", emoji: "↖️" },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      directionMenu
    );

    await interaction.update({
      content: `${EXPEDITION.LOCATION} Choix de la direction initiale :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Error in handleExpeditionValidateResources:", { error });
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Erreur lors de la validation des ressources.`
    );
  }
}

/**
 * Helper function to show the resource management interface
 */
async function showResourceManagementInterface(
  interaction: ModalSubmitInteraction,
  cacheId: string,
  expeditionData: any
) {
  const resourcesList =
    expeditionData.resources.length > 0
      ? expeditionData.resources
        .map((r: any) => `${r.emoji} **${r.resourceTypeName}:** ${r.quantity}`)
        .join("\n")
      : "_Aucune ressource pour le moment_";

  const embed = createInfoEmbed(`${EXPEDITION.ICON} ${expeditionData.name}`)
    .setDescription(
      `**Durée :** ${expeditionData.duration} jour${expeditionData.duration > 1 ? "s" : ""}\n\n`
    )
    .addFields({
      name: `${RESOURCES.GENERIC} Ressources embarquées`,
      value: resourcesList,
      inline: false,
    });

  const addButton = new ButtonBuilder()
    .setCustomId(`expedition_create_add_resources:${cacheId}`)
    .setLabel("Ajouter d'autres ressources")
    .setEmoji("➕")
    .setStyle(ButtonStyle.Primary);

  const validateButton = new ButtonBuilder()
    .setCustomId(`expedition_create_validate:${cacheId}`)
    .setLabel("Valider et choisir direction")
    .setEmoji(`${STATUS.SUCCESS}`)
    .setStyle(ButtonStyle.Success);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    addButton,
    validateButton
  );

  await interaction.reply({
    embeds: [embed],
    components: [buttonRow],
    ephemeral: true,
  });
}

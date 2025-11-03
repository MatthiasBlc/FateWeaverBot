import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { logger } from "../../../../services/logger";
import { apiService } from "../../../../services/api";
import { httpClient } from "../../../../services/httpClient";
import { PROJECT, STATUS } from "@shared/constants/emojis";
import { projectCreationCache } from "../../../../services/project-creation-cache";
import { replyEphemeral } from "../../../../utils/interaction-helpers";

/**
 * Helper pour catégoriser les objets selon leurs bonus
 */
function categorizeObjects(objects: any[]) {
  const simple: any[] = [];
  const withCapacity: any[] = [];
  const withSkill: any[] = [];
  const resourceBags: any[] = [];

  objects.forEach(obj => {
    if (obj.resourceConversions && obj.resourceConversions.length > 0) {
      resourceBags.push(obj);
    } else if (obj.capacityBonuses && obj.capacityBonuses.length > 0) {
      withCapacity.push(obj);
    } else if (obj.skillBonuses && obj.skillBonuses.length > 0) {
      withSkill.push(obj);
    } else {
      simple.push(obj);
    }
  });

  return { simple, withCapacity, withSkill, resourceBags };
}

/**
 * ÉTAPE 2: Handler pour la sélection de ressource
 */
export async function handleProjectAddSelectResource(
  interaction: StringSelectMenuInteraction
) {
  try {
    const cacheId = interaction.customId.split(":")[1];
    const resourceTypeId = parseInt(interaction.values[0], 10);

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Session expirée. Veuillez recommencer.`
      );
      return;
    }

    // Afficher modal pour la quantité ET les PA
    const modal = new ModalBuilder()
      .setCustomId(`project_add_quantity_modal:${cacheId}:${resourceTypeId}`)
      .setTitle("Production et Coûts");

    const quantityInput = new TextInputBuilder()
      .setCustomId("output_quantity")
      .setLabel("Quantité produite")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Ex: 50")
      .setMinLength(1)
      .setMaxLength(5);

    const paInput = new TextInputBuilder()
      .setCustomId("pa_required")
      .setLabel("Points d'Action (PA) requis")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Ex: 100")
      .setMinLength(1)
      .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(paInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in handleProjectAddSelectResource:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de la sélection.`);
  }
}

/**
 * ÉTAPE 2: Handler pour naviguer dans une catégorie d'objets avec pagination
 */
export async function handleProjectAddObjectCategory(
  interaction: ButtonInteraction
) {
  try {
    await interaction.deferUpdate();

    const parts = interaction.customId.split(":");
    const cacheId = parts[1];
    const category = parts[2] as 'simple' | 'capacity' | 'skill' | 'resource';
    const page = parseInt(parts[3], 10);

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer.`,
        components: [],
      });
      return;
    }

    // Récupérer tous les objets
    const response = await httpClient.get('/objects');
    const objects = response.data || [];

    // Catégoriser
    const categories = categorizeObjects(objects);

    // Sélectionner la catégorie appropriée
    let categoryObjects: any[] = [];
    let categoryName = '';

    switch (category) {
      case 'simple':
        categoryObjects = categories.simple;
        categoryName = '📦 Objets simples';
        break;
      case 'capacity':
        categoryObjects = categories.withCapacity;
        categoryName = '⚡ Objets capacité+';
        break;
      case 'skill':
        categoryObjects = categories.withSkill;
        categoryName = '🎯 Objets compétence+';
        break;
      case 'resource':
        categoryObjects = categories.resourceBags;
        categoryName = '💰 Sacs ressources';
        break;
    }

    if (categoryObjects.length === 0) {
      await interaction.editReply({
        content: `ℹ️ Aucun objet dans la catégorie ${categoryName}`,
        components: [],
      });
      return;
    }

    // Pagination (25 objets par page max)
    const MAX_PER_PAGE = 25;
    const totalPages = Math.ceil(categoryObjects.length / MAX_PER_PAGE);
    const currentPage = Math.min(page, totalPages - 1);
    const startIdx = currentPage * MAX_PER_PAGE;
    const endIdx = Math.min(startIdx + MAX_PER_PAGE, categoryObjects.length);
    const objectsOnPage = categoryObjects.slice(startIdx, endIdx);

    // Créer le menu de sélection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`project_add_select_object_from_category:${cacheId}`)
      .setPlaceholder("Sélectionnez l'objet produit")
      .addOptions(
        objectsOnPage.map((obj: any) => ({
          label: obj.name,
          value: obj.id.toString(),
          description: obj.description ? obj.description.substring(0, 100) : undefined,
        }))
      );

    const components: any[] = [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
    ];

    // Boutons de pagination si nécessaire
    if (totalPages > 1) {
      const paginationButtons = [];

      if (currentPage > 0) {
        paginationButtons.push(
          new ButtonBuilder()
            .setCustomId(`project_add_object_category:${cacheId}:${category}:${currentPage - 1}`)
            .setLabel('◀️ Précédent')
            .setStyle(ButtonStyle.Secondary)
        );
      }

      paginationButtons.push(
        new ButtonBuilder()
          .setCustomId(`pagination_info`)
          .setLabel(`Page ${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      if (currentPage < totalPages - 1) {
        paginationButtons.push(
          new ButtonBuilder()
            .setCustomId(`project_add_object_category:${cacheId}:${category}:${currentPage + 1}`)
            .setLabel('Suivant ▶️')
            .setStyle(ButtonStyle.Secondary)
        );
      }

      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(...paginationButtons)
      );
    }

    await interaction.editReply({
      content: `${PROJECT.ICON} **Étape 2/4** - ${categoryName}\n\n` +
        `Affichage de ${objectsOnPage.length} objet(s) (${startIdx + 1}-${endIdx} sur ${categoryObjects.length})`,
      components,
    });
  } catch (error) {
    logger.error("Error in handleProjectAddObjectCategory:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage de la catégorie.`,
      components: [],
    });
  }
}

/**
 * ÉTAPE 2: Handler pour la sélection d'objet depuis une catégorie
 */
export async function handleProjectAddSelectObject(
  interaction: StringSelectMenuInteraction
) {
  try {
    const cacheId = interaction.customId.split(":")[1];
    const objectTypeId = parseInt(interaction.values[0], 10);

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Session expirée. Veuillez recommencer.`
      );
      return;
    }

    // Afficher modal pour la quantité ET les PA
    const modal = new ModalBuilder()
      .setCustomId(`project_add_quantity_modal:${cacheId}:${objectTypeId}`)
      .setTitle("Production et Coûts");

    const quantityInput = new TextInputBuilder()
      .setCustomId("output_quantity")
      .setLabel("Quantité produite")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Ex: 1")
      .setMinLength(1)
      .setMaxLength(3);

    const paInput = new TextInputBuilder()
      .setCustomId("pa_required")
      .setLabel("Points d'Action (PA) requis")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Ex: 100")
      .setMinLength(1)
      .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(paInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in handleProjectAddSelectObject:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de la sélection.`);
  }
}

/**
 * ÉTAPE 2: Handler pour le modal de quantité + PA
 * Passe à l'étape 3 (gestion ressources)
 */
export async function handleProjectAddQuantityModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const parts = interaction.customId.split(":");
    const cacheId = parts[1];
    const outputId = parseInt(parts[2], 10);

    const quantityStr = interaction.fields.getTextInputValue("output_quantity");
    const quantity = parseInt(quantityStr, 10);

    const paStr = interaction.fields.getTextInputValue("pa_required");
    const paRequired = parseInt(paStr, 10);

    if (isNaN(quantity) || quantity <= 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} La quantité doit être un nombre positif.`,
      });
      return;
    }

    if (isNaN(paRequired) || paRequired <= 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Le nombre de PA doit être un nombre positif.`,
      });
      return;
    }

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer.`,
      });
      return;
    }

    // Mettre à jour le cache avec l'output et les PA
    if (projectData.outputType === "RESOURCE") {
      projectData.outputResourceTypeId = outputId;
    } else {
      projectData.outputObjectTypeId = outputId;
    }
    projectData.outputQuantity = quantity;
    projectData.paRequired = paRequired;

    projectCreationCache.store(interaction.user.id, projectData, cacheId);

    // Afficher l'interface de gestion des ressources
    await showResourceManagementInterface(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddQuantityModal:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors du traitement.`,
    });
  }
}

/**
 * Helper pour afficher l'interface de gestion des ressources du projet
 */
export async function showResourceManagementInterface(
  interaction: ModalSubmitInteraction | ButtonInteraction | StringSelectMenuInteraction,
  cacheId: string,
  projectData: any
) {
  const resourcesList =
    projectData.resourceCosts && projectData.resourceCosts.length > 0
      ? projectData.resourceCosts
        .map((r: any) => `${r.emoji || "📦"} **${r.resourceTypeName || `Resource #${r.resourceTypeId}`}:** ${r.quantityRequired}`)
        .join("\n")
      : "_Aucune ressource pour le moment_";

  const content = `${PROJECT.ICON} **Étape 3/4** - Coûts du projet\n\n` +
    `**${projectData.name}**\n` +
    `PA requis : **${projectData.paRequired}**\n\n` +
    `**Ressources nécessaires :**\n${resourcesList}\n\n` +
    `Ajoutez des ressources ou validez pour passer à l'étape suivante.`;

  const addButton = new ButtonBuilder()
    .setCustomId(`project_add_add_resource:${cacheId}`)
    .setLabel("➕ Ajouter une ressource")
    .setStyle(ButtonStyle.Success);

  const validateButton = new ButtonBuilder()
    .setCustomId(`project_add_validate_costs:${cacheId}`)
    .setLabel(`${STATUS.SUCCESS} Valider et continuer`)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    addButton,
    validateButton
  );

  await interaction.editReply({
    content,
    components: [row],
  });
}

/**
 * ÉTAPE 3: Handler pour le bouton "Ajouter une ressource"
 */
export async function handleProjectAddAddResource(
  interaction: ButtonInteraction
) {
  try {
    const cacheId = interaction.customId.split(":")[1];

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Session expirée. Veuillez recommencer.`
      );
      return;
    }

    // Récupérer toutes les ressources disponibles
    const resourceTypes = await apiService.getAllResourceTypes();

    if (!resourceTypes || resourceTypes.length === 0) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Aucun type de ressource disponible.`
      );
      return;
    }

    // Créer select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`project_add_select_cost_resource:${cacheId}`)
      .setPlaceholder("Sélectionnez une ressource")
      .addOptions(
        resourceTypes.slice(0, 25).map((rt: any) => ({
          label: rt.name,
          value: rt.id.toString(),
          emoji: rt.emoji || "📦",
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.update({
      content: `📦 Sélectionnez une ressource nécessaire au projet :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Error in handleProjectAddAddResource:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de l'affichage des ressources.`);
  }
}

/**
 * ÉTAPE 3: Handler pour la sélection d'une ressource de coût
 */
export async function handleProjectAddSelectCostResource(
  interaction: StringSelectMenuInteraction
) {
  try {
    const cacheId = interaction.customId.split(":")[1];
    const resourceTypeId = parseInt(interaction.values[0], 10);

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Session expirée. Veuillez recommencer.`
      );
      return;
    }

    // Récupérer les infos de la ressource
    const resourceTypes = await apiService.getAllResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    if (!resourceType) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Ressource introuvable.`);
      return;
    }

    // Afficher modal pour la quantité
    const modal = new ModalBuilder()
      .setCustomId(`project_add_resource_quantity_modal:${cacheId}:${resourceTypeId}`)
      .setTitle(`Quantité: ${resourceType.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("resource_quantity")
      .setLabel("Quantité requise")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Ex: 20")
      .setMinLength(1)
      .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in handleProjectAddSelectCostResource:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de la sélection.`);
  }
}

/**
 * ÉTAPE 3: Handler pour le modal de quantité de ressource
 */
export async function handleProjectAddResourceQuantityModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const parts = interaction.customId.split(":");
    const cacheId = parts[1];
    const resourceTypeId = parseInt(parts[2], 10);

    const quantityStr = interaction.fields.getTextInputValue("resource_quantity");
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(quantity) || quantity <= 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} La quantité doit être un nombre positif.`,
      });
      return;
    }

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer.`,
      });
      return;
    }

    // Récupérer les infos de la ressource
    const resourceTypes = await apiService.getAllResourceTypes();
    const resourceType = resourceTypes.find((rt: any) => rt.id === resourceTypeId);

    if (!resourceType) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Ressource introuvable.`,
      });
      return;
    }

    // Vérifier si la ressource existe déjà
    const existingIndex = projectData.resourceCosts.findIndex(
      (r: any) => r.resourceTypeId === resourceTypeId
    );

    if (existingIndex >= 0) {
      // Mettre à jour
      projectData.resourceCosts[existingIndex].quantityRequired += quantity;
    } else {
      // Ajouter
      projectData.resourceCosts.push({
        resourceTypeId,
        quantityRequired: quantity,
        resourceTypeName: resourceType.name,
        emoji: resourceType.emoji,
      });
    }

    // Mettre à jour le cache
    projectCreationCache.store(interaction.user.id, projectData, cacheId);

    // Afficher l'interface mise à jour
    await showResourceManagementInterface(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddResourceQuantityModal:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout.`,
    });
  }
}

/**
 * ÉTAPE 3: Handler pour valider les coûts et passer à l'étape 4 (Blueprint optionnel)
 */
export async function handleProjectAddValidateCosts(
  interaction: ButtonInteraction
) {
  try {
    await interaction.deferUpdate();

    const cacheId = interaction.customId.split(":")[1];

    // Récupérer les données du cache
    const projectData = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!projectData) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Session expirée. Veuillez recommencer.`,
        components: [],
      });
      return;
    }

    // Import step 4 function
    const { showBlueprintInterface } = await import("./step-4-blueprint.js");

    // Afficher l'interface de blueprint (étape 4 - optionnelle)
    await showBlueprintInterface(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddValidateCosts:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la validation.`,
      components: [],
    });
  }
}

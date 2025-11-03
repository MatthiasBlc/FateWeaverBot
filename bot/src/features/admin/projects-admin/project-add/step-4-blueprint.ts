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
import { PROJECT, STATUS } from "@shared/constants/emojis";
import { projectCreationCache } from "../../../../services/project-creation-cache";
import { replyEphemeral } from "../../../../utils/interaction-helpers";

/**
 * ÉTAPE 4: Afficher l'interface de configuration du blueprint (optionnel)
 */
export async function showBlueprintInterface(
  interaction: ButtonInteraction,
  cacheId: string,
  projectData: any
) {
  const content = `${PROJECT.ICON} **Étape 4/4** - Configuration Blueprint (optionnel)\n\n` +
    `Un **blueprint** permet de recommencer le même projet plusieurs fois.\n\n` +
    `Voulez-vous configurer ce projet comme un blueprint ?`;

  const yesButton = new ButtonBuilder()
    .setCustomId(`project_add_blueprint_yes:${cacheId}`)
    .setLabel(`${STATUS.SUCCESS} Oui, configurer le blueprint`)
    .setStyle(ButtonStyle.Success);

  const noButton = new ButtonBuilder()
    .setCustomId(`project_add_blueprint_no:${cacheId}`)
    .setLabel(`${STATUS.ERROR} Non, créer le projet maintenant`)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    yesButton,
    noButton
  );

  await interaction.editReply({
    content,
    components: [row],
  });
}

/**
 * ÉTAPE 4: Handler pour "Non" - Créer le projet directement
 */
export async function handleProjectAddBlueprintNo(
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

    // Import step 5 function
    const { createProject } = await import("./step-5-finalize.js");

    // Créer le projet
    await createProject(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddBlueprintNo:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création.`,
      components: [],
    });
  }
}

/**
 * ÉTAPE 4: Handler pour "Oui" - Configurer le blueprint
 */
export async function handleProjectAddBlueprintYes(
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

    // Afficher modal pour PA blueprint
    const modal = new ModalBuilder()
      .setCustomId(`project_add_blueprint_pa_modal:${cacheId}`)
      .setTitle("Blueprint - PA requis");

    const paInput = new TextInputBuilder()
      .setCustomId("blueprint_pa")
      .setLabel("PA requis pour relancer le blueprint")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder(`Ex: ${Math.floor(projectData.paRequired * 0.7)}`)
      .setMinLength(1)
      .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(paInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in handleProjectAddBlueprintYes:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de l'affichage du formulaire.`);
  }
}

/**
 * ÉTAPE 4: Handler pour le modal de PA blueprint
 */
export async function handleProjectAddBlueprintPAModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const cacheId = interaction.customId.split(":")[1];
    const paBlueprintStr = interaction.fields.getTextInputValue("blueprint_pa");
    const paBlueprintRequired = parseInt(paBlueprintStr, 10);

    if (isNaN(paBlueprintRequired) || paBlueprintRequired <= 0) {
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

    // Mettre à jour le cache
    projectData.isBlueprint = true;
    projectData.paBlueprintRequired = paBlueprintRequired;
    projectData.blueprintResourceCosts = [];
    projectCreationCache.store(interaction.user.id, projectData, cacheId);

    // Afficher l'interface de gestion des ressources blueprint
    await showBlueprintResourceManagementInterface(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddBlueprintPAModal:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors du traitement.`,
    });
  }
}

/**
 * Helper pour afficher l'interface de gestion des ressources blueprint
 */
export async function showBlueprintResourceManagementInterface(
  interaction: ModalSubmitInteraction | ButtonInteraction | StringSelectMenuInteraction,
  cacheId: string,
  projectData: any
) {
  const resourcesList =
    projectData.blueprintResourceCosts && projectData.blueprintResourceCosts.length > 0
      ? projectData.blueprintResourceCosts
        .map((r: any) => `${r.emoji || "📦"} **${r.resourceTypeName || `Resource #${r.resourceTypeId}`}:** ${r.quantityRequired}`)
        .join("\n")
      : "_Aucune ressource pour le moment_";

  const content = `${PROJECT.ICON} **Blueprint** - Ressources nécessaires pour relancer\n\n` +
    `PA requis : **${projectData.paBlueprintRequired}**\n\n` +
    `**Ressources nécessaires :**\n${resourcesList}\n\n` +
    `Ajoutez des ressources ou finalisez la création.`;

  const addButton = new ButtonBuilder()
    .setCustomId(`project_add_add_blueprint_resource:${cacheId}`)
    .setLabel("➕ Ajouter une ressource")
    .setStyle(ButtonStyle.Success);

  const finalizeButton = new ButtonBuilder()
    .setCustomId(`project_add_finalize:${cacheId}`)
    .setLabel(`${STATUS.SUCCESS} Créer le projet`)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    addButton,
    finalizeButton
  );

  await interaction.editReply({
    content,
    components: [row],
  });
}

/**
 * ÉTAPE 4: Handler pour ajouter une ressource blueprint
 */
export async function handleProjectAddAddBlueprintResource(
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
      .setCustomId(`project_add_select_blueprint_resource:${cacheId}`)
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
      content: `📦 Sélectionnez une ressource nécessaire pour relancer le blueprint :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Error in handleProjectAddAddBlueprintResource:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de l'affichage.`);
  }
}

/**
 * ÉTAPE 4: Handler pour la sélection d'une ressource blueprint
 */
export async function handleProjectAddSelectBlueprintResource(
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
      .setCustomId(`project_add_blueprint_resource_quantity_modal:${cacheId}:${resourceTypeId}`)
      .setTitle(`Blueprint: ${resourceType.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("blueprint_resource_quantity")
      .setLabel("Quantité requise")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Ex: 10")
      .setMinLength(1)
      .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in handleProjectAddSelectBlueprintResource:", { error });
    await replyEphemeral(interaction, `${STATUS.ERROR} Erreur lors de la sélection.`);
  }
}

/**
 * ÉTAPE 4: Handler pour le modal de quantité de ressource blueprint
 */
export async function handleProjectAddBlueprintResourceQuantityModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const parts = interaction.customId.split(":");
    const cacheId = parts[1];
    const resourceTypeId = parseInt(parts[2], 10);

    const quantityStr = interaction.fields.getTextInputValue("blueprint_resource_quantity");
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
    if (!projectData.blueprintResourceCosts) {
      projectData.blueprintResourceCosts = [];
    }

    const existingIndex = projectData.blueprintResourceCosts.findIndex(
      (r: any) => r.resourceTypeId === resourceTypeId
    );

    if (existingIndex >= 0) {
      // Mettre à jour
      projectData.blueprintResourceCosts[existingIndex].quantityRequired += quantity;
    } else {
      // Ajouter
      projectData.blueprintResourceCosts.push({
        resourceTypeId,
        quantityRequired: quantity,
        resourceTypeName: resourceType.name,
        emoji: resourceType.emoji,
      });
    }

    // Mettre à jour le cache
    projectCreationCache.store(interaction.user.id, projectData, cacheId);

    // Afficher l'interface mise à jour
    await showBlueprintResourceManagementInterface(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddBlueprintResourceQuantityModal:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout.`,
    });
  }
}

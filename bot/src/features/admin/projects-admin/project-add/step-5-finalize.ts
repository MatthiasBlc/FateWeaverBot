import {
  ButtonInteraction,
} from "discord.js";
import { logger } from "../../../../services/logger";
import { apiService } from "../../../../services/api";
import { createSuccessEmbed } from "../../../../utils/embeds";
import { PROJECT, STATUS } from "@shared/constants/emojis";
import { projectCreationCache } from "../../../../services/project-creation-cache";

/**
 * FINALISATION: Handler pour créer le projet
 */
export async function handleProjectAddFinalize(
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

    // Créer le projet
    await createProject(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddFinalize:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création.`,
      components: [],
    });
  }
}

/**
 * Helper pour créer le projet via l'API
 */
export async function createProject(
  interaction: ButtonInteraction,
  cacheId: string,
  projectData: any
) {
  try {
    // Préparer les données pour l'API
    const apiData: any = {
      name: projectData.name,
      paRequired: projectData.paRequired,
      townId: projectData.townId,
      craftTypes: projectData.craftTypes,
      outputQuantity: projectData.outputQuantity,
    };

    if (projectData.outputResourceTypeId) {
      apiData.outputResourceTypeId = projectData.outputResourceTypeId;
    }

    if (projectData.outputObjectTypeId) {
      apiData.outputObjectTypeId = projectData.outputObjectTypeId;
    }

    if (projectData.resourceCosts && projectData.resourceCosts.length > 0) {
      apiData.resourceCosts = projectData.resourceCosts.map((r: any) => ({
        resourceTypeId: r.resourceTypeId,
        quantityRequired: r.quantityRequired,
      }));
    }

    if (projectData.isBlueprint) {
      apiData.paBlueprintRequired = projectData.paBlueprintRequired;
      if (projectData.blueprintResourceCosts && projectData.blueprintResourceCosts.length > 0) {
        apiData.blueprintResourceCosts = projectData.blueprintResourceCosts.map((r: any) => ({
          resourceTypeId: r.resourceTypeId,
          quantityRequired: r.quantityRequired,
        }));
      }
    }

    // Créer le projet via l'API
    const newProject = await apiService.projects.createProject(
      apiData,
      interaction.user.id
    );

    // Nettoyer le cache
    projectCreationCache.remove(cacheId);

    // Message de succès
    const outputType = projectData.outputResourceTypeId ? "ressource" : "objet";
    let successMessage = `${PROJECT.CELEBRATION} Projet créé avec succès !\n\n` +
      `**${projectData.name}**\n` +
      `🛠️ ${projectData.craftTypes.join(", ")}\n` +
      `📊 ${projectData.paRequired} PA requis\n` +
      `📦 Produit ${projectData.outputQuantity}x ${outputType}\n`;

    if (projectData.resourceCosts && projectData.resourceCosts.length > 0) {
      successMessage += `\n**Ressources nécessaires:**\n`;
      projectData.resourceCosts.forEach((r: any) => {
        successMessage += `• ${r.emoji} ${r.quantityRequired}x ${r.resourceTypeName}\n`;
      });
    }

    if (projectData.isBlueprint) {
      successMessage += `\n📋 **Blueprint** configuré (${projectData.paBlueprintRequired} PA pour relancer)`;

      if (projectData.blueprintResourceCosts && projectData.blueprintResourceCosts.length > 0) {
        successMessage += `\n**Ressources blueprint:**\n`;
        projectData.blueprintResourceCosts.forEach((r: any) => {
          successMessage += `• ${r.emoji} ${r.quantityRequired}x ${r.resourceTypeName}\n`;
        });
      }
    }

    const embed = createSuccessEmbed(
      "Projet créé !",
      successMessage
    );

    await interaction.editReply({
      embeds: [embed],
      content: "",
      components: [],
    });

    logger.info("Project created successfully", {
      projectId: newProject.id,
      projectName: projectData.name,
      userId: interaction.user.id,
    });

  } catch (error: any) {
    logger.error("Error creating project:", { error });
    await interaction.editReply({
      content: `❌ Erreur lors de la création du projet : ${error.message || "Erreur inconnue"}`,
      components: [],
    });
  }
}

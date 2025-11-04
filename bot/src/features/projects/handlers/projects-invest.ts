/**
 * Handler pour la soumission du modal d'investissement dans les projets
 */

import type { ModalSubmitInteraction, Client } from "discord.js";

import type { Project, ResourceCost, ContributionResult } from "../projects.types.js";
import { sendLogMessage } from "../../../utils/channels.js";
import { apiService } from "../../../services/api/index.js";
import { logger } from "../../../services/logger.js";
import { PROJECT, STATUS } from "../../../constants/emojis.js";
import type { Town, ActiveCharacter } from "./projects-common.js";
import { getProjectOutputText, formatRewardMessage } from "./projects-helpers.js";

/**
 * Gère la soumission du modal d'investissement dans les projets
 */
export async function handleInvestModalSubmit(
  interaction: ModalSubmitInteraction
) {
  try {
    const customId = interaction.customId;
    const projectId = customId.replace("invest_project_modal_", "");

    // Récupérer l'utilisateur
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    if (!user) {
      throw new Error("Impossible de créer ou récupérer l'utilisateur");
    }

    // Récupérer la ville
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    const town = townResponse as unknown as Town;

    if (!town || !town.id) {
      throw new Error("Ville non trouvée");
    }

    // Récupérer personnage actif
    const townCharacters = (await apiService.characters.getTownCharacters(
      town.id
    )) as any[];
    const userCharacters = townCharacters.filter(
      (char: any) => char.user?.discordId === interaction.user.id
    );
    const activeCharacter = userCharacters.find(
      (char: any) => char.isActive
    ) as ActiveCharacter | undefined;

    if (!activeCharacter) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Vérifications état personnage
    if (activeCharacter.isDead) {
      await interaction.reply({
        content:
          "💀 Un mort ne peut pas travailler ! Votre personnage est mort.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer le projet
    const allProjects = await apiService.projects.getProjectsByTown(town.id);
    const project = allProjects.find((p: Project) => p.id === projectId);

    if (!project) {
      await interaction.reply({
        content: `${STATUS.ERROR} Projet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Parse PA input
    const inputValue = interaction.fields.getTextInputValue("points_input");
    let points = 0;

    if (inputValue && inputValue.trim() !== "") {
      if (inputValue.includes(".") || inputValue.includes(",")) {
        await interaction.reply({
          content: `${STATUS.ERROR} Veuillez entrer un nombre entier uniquement.`,
          flags: ["Ephemeral"],
        });
        return;
      }

      points = parseInt(inputValue, 10);

      if (isNaN(points) || points < 0) {
        await interaction.reply({
          content: `${STATUS.ERROR} Veuillez entrer un nombre valide de PA.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    }

    // Parse resource contributions
    const resourceContributions: {
      resourceTypeId: number;
      quantity: number;
    }[] = [];

    if (project.resourceCosts && project.resourceCosts.length > 0) {
      for (const rc of project.resourceCosts) {
        try {
          const fieldValue = interaction.fields.getTextInputValue(
            `resource_${rc.resourceTypeId}`
          );

          if (fieldValue && fieldValue.trim() !== "") {
            const quantity = parseInt(fieldValue.trim(), 10);

            if (isNaN(quantity) || quantity < 0) {
              await interaction.reply({
                content: `${STATUS.ERROR} Quantité invalide pour ${rc.resourceType.name}`,
                flags: ["Ephemeral"],
              });
              return;
            }

            if (quantity > 0) {
              resourceContributions.push({
                resourceTypeId: rc.resourceTypeId,
                quantity,
              });
            }
          }
        } catch (error) {
          // Field doesn't exist, skip
        }
      }
    }

    // Validation: au moins PA ou ressources
    if (points === 0 && resourceContributions.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Veuillez contribuer au moins des PA ou des ressources.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Appeler l'API backend unifiée
    const result = (await apiService.projects.contributeToProject(
      activeCharacter.id,
      projectId,
      points,
      resourceContributions
    )) as ContributionResult;

    // Message de réponse
    let responseMessage = `${STATUS.SUCCESS} Contribution enregistrée au projet "${project.name}" !\n`;

    if (points > 0) {
      responseMessage += `• ${points} PA\n`;
    }

    if (resourceContributions.length > 0) {
      const resourcesText = resourceContributions
        .map((rc) => {
          const rcInfo = project.resourceCosts?.find(
            (r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId
          );
          return `• ${rcInfo?.resourceType.emoji} ${rc.quantity} ${rcInfo?.resourceType.name}`;
        })
        .join("\n");
      responseMessage += resourcesText;
    }

    // Log contribution
    const contributionParts: string[] = [];
    if (points > 0) contributionParts.push(`${points} PA`);
    if (resourceContributions.length > 0) {
      const resText = resourceContributions
        .map((rc) => {
          const rcInfo = project.resourceCosts?.find(
            (r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId
          );
          return `${rcInfo?.resourceType.emoji} ${rc.quantity} ${rcInfo?.resourceType.name}`;
        })
        .join(", ");
      contributionParts.push(resText);
    }

    const contributionLogMessage = `🛠️ **${
      activeCharacter.name
    }** a contribué ${contributionParts.join(" et ")} au projet "**${
      project.name
    }**".`;
    await sendLogMessage(
      interaction.guildId!,
      interaction.client,
      contributionLogMessage
    );

    // Vérifier complétion (projets normaux ET blueprints)
    if (result.completed && result.project) {
      const rewardText = formatRewardMessage(
        result.project,
        result.reward,
        activeCharacter.name
      );

      // Distinguer blueprint validé vs projet normal terminé
      const isBlueprint = result.project.status === "ACTIVE" && (result.project as any).isBlueprint;

      if (isBlueprint) {
        // Blueprint validé et recyclé
        const outputText = getProjectOutputText(result.project);
        responseMessage += `\n\n${PROJECT.CELEBRATION} Félicitations ! Le blueprint est validé !\n${rewardText}\n\nLe blueprint peut maintenant être utilisé pour créer ${outputText}.`;

        const completionLogMessage = `${PROJECT.CELEBRATION} Le blueprint "**${result.project.name}**" a été validé ! ${rewardText}\n\nIl peut maintenant être utilisé pour créer ${outputText}.`;
        await sendLogMessage(
          interaction.guildId!,
          interaction.client,
          completionLogMessage
        );
      } else {
        // Projet normal terminé
        responseMessage += `\n\n${PROJECT.CELEBRATION} Félicitations ! Le projet est terminé !\n${rewardText}`;

        const completionLogMessage = `${PROJECT.CELEBRATION} Le projet "**${result.project.name}**" est terminé ! ${rewardText}`;
        await sendLogMessage(
          interaction.guildId!,
          interaction.client,
          completionLogMessage
        );
      }
    }

    await interaction.reply({
      content: responseMessage,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors du traitement de la contribution:", { error });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors du traitement de votre contribution.`,
      flags: ["Ephemeral"],
    });
  }
}

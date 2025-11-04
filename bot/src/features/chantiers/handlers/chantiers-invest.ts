/**
 * Handler pour la soumission du modal d'investissement dans les chantiers
 */

import type { ModalSubmitInteraction } from "discord.js";
import { apiService } from "../../../services/api/index.js";
import { logger } from "../../../services/logger.js";
import { sendLogMessage } from "../../../utils/channels.js";
import { STATUS, CHANTIER } from "../../../constants/emojis.js";
import type { Chantier, Town, InvestResult, ResourceCost } from "./chantiers-common.js";

/**
 * Gère la soumission du modal d'investissement dans les chantiers
 */
export async function handleInvestModalSubmit(
  interaction: ModalSubmitInteraction
) {
  try {
    const customId = interaction.customId;
    const chantierId = customId.replace("invest_modal_", "");

    // Récupérer le chantier depuis l'API
    const chantiers = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );
    const chantier = chantiers.find((c: Chantier) => c.id === chantierId);

    if (!chantier) {
      await interaction.reply({
        content: `${STATUS.ERROR} Chantier non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Parse PA input (now optional)
    let points = 0;

    try {
      const inputValue = interaction.fields.getTextInputValue("points_input");

      if (inputValue && inputValue.trim() !== "") {
        // Vérifier si c'est un nombre décimal
        if (inputValue.includes('.') || inputValue.includes(',')) {
          await interaction.reply({
            content:
              `${STATUS.ERROR} Veuillez entrer un nombre entier uniquement (pas de décimales).`,
            flags: ["Ephemeral"],
          });
          return;
        }

        points = parseInt(inputValue, 10);

        // Validation des points
        if (isNaN(points) || points < 0) {
          await interaction.reply({
            content:
              `${STATUS.ERROR} Veuillez entrer un nombre valide de points d'action (entiers uniquement, 0 ou plus).`,
            flags: ["Ephemeral"],
          });
          return;
        }
      }
    } catch (error) {
      // Field is empty or doesn't exist - that's ok, points = 0
      points = 0;
    }

    // Parse resource contributions from modal
    const resourceContributions: { resourceTypeId: number; quantity: number }[] = [];
    const adjustedResources: string[] = [];

    if (chantier.resourceCosts && chantier.resourceCosts.length > 0) {
      for (const rc of chantier.resourceCosts) {
        try {
          const fieldValue = interaction.fields.getTextInputValue(`resource_${rc.resourceTypeId}`);

          if (fieldValue && fieldValue.trim() !== "") {
            let quantity = parseInt(fieldValue.trim(), 10);

            if (isNaN(quantity) || quantity < 0) {
              await interaction.reply({
                content: `${STATUS.ERROR} Quantité invalide pour ${rc.resourceType.name}`,
                flags: ["Ephemeral"],
              });
              return;
            }

            if (quantity > 0) {
              // Ajuster la quantité au maximum nécessaire pour finir le chantier
              const remaining = rc.quantityRequired - rc.quantityContributed;
              if (quantity > remaining) {
                adjustedResources.push(`${rc.resourceType.emoji} ${rc.resourceType.name}`);
                quantity = remaining;
              }

              if (quantity > 0) {
                resourceContributions.push({
                  resourceTypeId: rc.resourceTypeId,
                  quantity,
                });
              }
            }
          }
        } catch (error) {
          // Field doesn't exist, skip
        }
      }
    }

    // Validation: at least PA or resources
    if (points === 0 && resourceContributions.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Veuillez contribuer au moins des PA ou des ressources.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer l'utilisateur
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    if (!user) {
      throw new Error("Impossible de créer ou récupérer l'utilisateur");
    }

    // Récupérer la ville du serveur
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    const town = townResponse as unknown as Town;

    if (!town || !town.id) {
      throw new Error("Ville non trouvée pour cette guilde");
    }

    // Récupérer tous les personnages de la ville et trouver celui de l'utilisateur
    const townCharacters = (await apiService.characters.getTownCharacters(
      town.id
    )) as any[];
    const userCharacters = townCharacters.filter(
      (char: any) => char.user?.discordId === interaction.user.id
    );
    const activeCharacter = userCharacters.find((char: any) => char.isActive);

    if (!activeCharacter) {
      // Vérifier si l'utilisateur a besoin de créer un personnage
      const needsCreation = await apiService.characters.needsCharacterCreation(
        user.id,
        town.id
      );

      if (needsCreation) {
        // Proposer la création de personnage via le système de modales
        const { checkAndPromptCharacterCreation } = await import(
          "../../../modals/character-modals.js"
        );
        const modalShown = await checkAndPromptCharacterCreation(interaction);

        if (modalShown) {
          // Ne pas répondre à l'interaction actuelle, laisser le système de création gérer
          return;
        }
      }

      await interaction.reply({
        content:
          `${STATUS.ERROR} Vous devez avoir un personnage actif pour investir dans les chantiers. Utilisez la commande \`/create-character\` pour créer votre personnage.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Vérifier que le personnage est actif et vivant
    if (!activeCharacter.isActive) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Votre personnage est inactif et ne peut pas investir dans les chantiers.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (activeCharacter.isDead) {
      await interaction.reply({
        content:
          "💀 Un mort ne construit pas de chantier ! Votre personnage est mort et ne peut pas investir.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Vérifier que le personnage a des PA si il veut en investir
    if (points > 0 && activeCharacter.paTotal <= 0) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Votre personnage n'a plus de points d'action. Vous pouvez cependant contribuer uniquement des ressources (entrez 0 PA).`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Calculer les PA restants nécessaires pour terminer le chantier
    const remainingPAForChantier = chantier.cost - chantier.spendOnIt;

    // Variables pour suivre les ajustements effectués
    let adjustedForChantierLimit = false;
    let usedAllAvailablePA = false;

    // Cas spécial : l'utilisateur veut investir plus de PA que nécessaire pour terminer le chantier
    if (points > remainingPAForChantier) {
      // Utiliser seulement les PA nécessaires pour terminer le chantier
      points = remainingPAForChantier;
      adjustedForChantierLimit = true;
    }

    // Cas spécial : l'utilisateur n'a pas assez de PA pour investir ce qu'il veut
    if (activeCharacter.paTotal < points) {
      // Utiliser tous les PA disponibles
      points = activeCharacter.paTotal;
      usedAllAvailablePA = true;
    }

    // Call appropriate API based on what's being contributed
    let responseMessage = "";

    // Case 1: Only resources (no PA)
    if (points === 0 && resourceContributions.length > 0) {
      const result = await apiService.chantiers.contributeResources(
        chantierId,
        activeCharacter.id,
        resourceContributions
      );

      const resourcesTextForMessage = resourceContributions
        .map((rc) => {
          const rcInfo = chantier.resourceCosts?.find((r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId);
          return `${rc.quantity} ${rcInfo?.resourceType.emoji}`;
        })
        .join(", ");

      // Ajouter message si ressources ajustées
      if (adjustedResources.length > 0) {
        responseMessage = `${STATUS.SUCCESS} Oulah, pas besoin de tout ça ! Tu as utilisé ${resourcesTextForMessage} sur le chantier **${chantier.name}**.`;
      } else {
        responseMessage = `${STATUS.SUCCESS} Tu as utilisé ${resourcesTextForMessage} sur le chantier **${chantier.name}**.`;
      }

      // Log contribution
      const contributionLogMessage = `🏗️ **${activeCharacter.name}** a utilisé ${resourcesTextForMessage} sur le chantier **${chantier.name}**.`;
      await sendLogMessage(interaction.guildId!, interaction.client, contributionLogMessage);

      if (result.chantier.status === "COMPLETED") {
        responseMessage += `\n${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est terminé !`;

        let completionLogMessage = `${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est terminé !`;
        if (chantier.completionText) {
          completionLogMessage += `\n${chantier.completionText}`;
        }
        await sendLogMessage(interaction.guildId!, interaction.client, completionLogMessage);
      }
    }
    // Case 2: PA + possibly resources
    else if (points > 0) {
      // Adjust PA if needed
      if (points > remainingPAForChantier) {
        points = remainingPAForChantier;
        adjustedForChantierLimit = true;
      }

      if (activeCharacter.paTotal < points) {
        points = activeCharacter.paTotal;
        usedAllAvailablePA = true;
      }

      if (points <= 0 && resourceContributions.length === 0) {
        await interaction.reply({
          content: `${STATUS.ERROR} Vous n'avez pas de points d'action disponibles pour investir dans ce chantier.`,
          flags: ["Ephemeral"],
        });
        return;
      }

      // Invest PA first
      const paResult = (await apiService.chantiers.investInChantier(
        activeCharacter.id,
        chantierId,
        points
      )) as InvestResult;

      // Then contribute resources if any
      if (resourceContributions.length > 0) {
        const resourceResult = await apiService.chantiers.contributeResources(
          chantierId,
          activeCharacter.id,
          resourceContributions
        );

        // Construire le texte des ressources
        const resourcesTextForMessage = resourceContributions
          .map((rc) => {
            const rcInfo = chantier.resourceCosts?.find((r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId);
            return `${rc.quantity} ${rcInfo?.resourceType.emoji}`;
          })
          .join(", ");

        // Message de base différent si ressources ajustées
        if (adjustedResources.length > 0) {
          responseMessage = `${STATUS.SUCCESS} Oulah, pas besoin de tout ça ! Tu as passé du temps (${points} PA) et utilisé ${resourcesTextForMessage} sur le chantier **${chantier.name}**.`;
        } else {
          responseMessage = `${STATUS.SUCCESS} Tu as passé du temps (${points} PA) et utilisé ${resourcesTextForMessage} sur le chantier **${chantier.name}**.`;
        }

        if (adjustedForChantierLimit) {
          responseMessage += ``;
        } else if (usedAllAvailablePA) {
          responseMessage += ` (tous vos PA disponibles)`;
        }

        responseMessage += `.`;

        // Log contribution with PA + resources
        const contributionLogMessage = `${CHANTIER.IN_PROGRESS} **${activeCharacter.name}** a travaillé (${points} PA) et utilisé ${resourcesTextForMessage} sur le chantier **${chantier.name}**.`;
        await sendLogMessage(interaction.guildId!, interaction.client, contributionLogMessage);

        if (resourceResult.chantier.status === "COMPLETED") {
          responseMessage += `\n${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est terminé !`;

          let completionLogMessage = `${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est terminé !`;
          if (chantier.completionText) {
            completionLogMessage += `\n${chantier.completionText}`;
          }
          await sendLogMessage(interaction.guildId!, interaction.client, completionLogMessage);
        }
      } else {
        // Cas où seulement des PA sont investis (sans ressources)
        responseMessage = `${STATUS.SUCCESS} Tu as passé du temps (${points} PA) sur le chantier **${chantier.name}**`;

        if (adjustedForChantierLimit) {
          responseMessage += ``;
        } else if (usedAllAvailablePA) {
          responseMessage += ` (tous vos PA disponibles)`;
        }

        responseMessage += `.`;

        // Log contribution with only PA
        const contributionLogMessage = `${CHANTIER.IN_PROGRESS} **${activeCharacter.name}** a travaillé (${points} PA) sur le chantier **${chantier.name}**.`;
        await sendLogMessage(interaction.guildId!, interaction.client, contributionLogMessage);

        if (paResult.isCompleted) {
          responseMessage += `\n${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est terminé !`;

          let completionLogMessage = `${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est terminé !`;
          if (chantier.completionText) {
            completionLogMessage += `\n${chantier.completionText}`;
          }
          await sendLogMessage(interaction.guildId!, interaction.client, completionLogMessage);
        }
      }
    }

    await interaction.reply({
      content: responseMessage,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors du traitement de l'investissement:", { error });

    if (
      error instanceof Error &&
      error.message.includes("Aucun personnage actif trouvé")
    ) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Vous devez avoir un personnage actif pour investir dans les chantiers. Utilisez la commande \`/create-character\` pour créer votre personnage.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message.includes("Pas assez de points d'action")
    ) {
      await interaction.reply({
        content: error.message,
        flags: ["Ephemeral"],
      });
      return;
    }

    const ERROR_MESSAGES = await import("../../../constants/messages.js").then(m => m.ERROR_MESSAGES);
    await interaction.reply({
      content:
        ERROR_MESSAGES.CHANTIER_PROCESSING_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

import {
  ButtonInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { httpClient } from "../../../services/httpClient";
import { createSuccessEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";
import type { Character } from "../character-admin.types";
import {
  createObjectSelectMenu,
  createObjectActionButtons,
  type ObjectType,
} from "../character-admin.components";
import { STATUS } from "../../../constants/emojis";

/**
 * Gestionnaire pour le bouton "Gérer Objets".
 * Affiche directement les objets actuels du personnage avec les boutons d'action.
 */
export async function handleObjectsButton(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer les objets actuels du personnage
    const response = await httpClient.get(`/characters/${character.id}/objects`);
    const currentObjects = response.data || [];

    // Créer la liste des objets formatée
    let content = `## 🎒 Objets de ${character.name}\n`;

    if (currentObjects.length === 0) {
      content += "*Aucun objet pour le moment.*\n\n";
    } else {
      content += currentObjects
        .map((obj: ObjectType) => `• **${obj.name}**${obj.description ? `\n  ${obj.description}` : ''}`)
        .join('\n') + '\n\n';
    }

    // Créer les boutons d'action
    const actionButtons = createObjectActionButtons(character.id);

    await interaction.editReply({
      content,
      components: [actionButtons],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage des objets:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
      return; // Interaction expirée
    }
    await interaction.reply({
      content: "❌ Erreur lors de l'affichage des objets.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Catégorise les objets selon leurs bonus
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
 * Gestionnaire pour l'ajout d'objets.
 * Affiche des boutons de catégories pour naviguer.
 */
export async function handleAddObjects(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer tous les objets et ceux du personnage
    const [allObjectsResponse, currentObjectsResponse] = await Promise.all([
      httpClient.get('/objects'),
      httpClient.get(`/characters/${character.id}/objects`)
    ]);

    const allObjects = allObjectsResponse.data || [];
    const currentObjects = currentObjectsResponse.data || [];
    const currentObjectIds = new Set(currentObjects.map((o: ObjectType) => o.id));

    // Filtrer pour ne garder que les objets non possédés
    const availableObjects = allObjects.filter(
      (obj: any) => !currentObjectIds.has(obj.id)
    );

    if (availableObjects.length === 0) {
      await interaction.editReply({
        content: `ℹ️ **${character.name}** possède déjà tous les objets disponibles.`,
      });
      return;
    }

    // Catégoriser les objets
    const categories = categorizeObjects(availableObjects);

    // Créer les boutons de catégories
    const categoryButtons = [];

    if (categories.simple.length > 0) {
      categoryButtons.push({
        customId: `object_category_add:${character.id}:simple:0`,
        label: `📦 Objets simples (${categories.simple.length})`,
        style: 2, // Secondary
      });
    }

    if (categories.withCapacity.length > 0) {
      categoryButtons.push({
        customId: `object_category_add:${character.id}:capacity:0`,
        label: `⚡ Objets capacité+ (${categories.withCapacity.length})`,
        style: 2,
      });
    }

    if (categories.withSkill.length > 0) {
      categoryButtons.push({
        customId: `object_category_add:${character.id}:skill:0`,
        label: `🎯 Objets compétence+ (${categories.withSkill.length})`,
        style: 2,
      });
    }

    if (categories.resourceBags.length > 0) {
      categoryButtons.push({
        customId: `object_category_add:${character.id}:resource:0`,
        label: `💰 Sacs ressources (${categories.resourceBags.length})`,
        style: 2,
      });
    }

    const buttonRow = createActionButtons(categoryButtons);

    await interaction.editReply({
      content: `## ➕ Ajouter des objets à ${character.name}\n\n**${availableObjects.length} objets disponibles**\n\nChoisissez une catégorie :`,
      components: [buttonRow],
    });
  } catch (error) {
    logger.error("Erreur lors de la préparation de l'ajout d'objets:", { error });
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur lors de la préparation de l'ajout d'objets.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de la préparation de l'ajout d'objets.",
      });
    }
  }
}

/**
 * Gestionnaire pour la suppression d'objets.
 * Affiche des boutons de catégories pour naviguer.
 */
export async function handleRemoveObjects(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer les objets actuels du personnage
    const response = await httpClient.get(`/characters/${character.id}/objects`);
    const currentObjects = response.data || [];

    if (currentObjects.length === 0) {
      await interaction.editReply({
        content: `ℹ️ **${character.name}** n'a aucun objet à retirer.`,
      });
      return;
    }

    // Catégoriser les objets
    const categories = categorizeObjects(currentObjects);

    // Créer les boutons de catégories
    const categoryButtons = [];

    if (categories.simple.length > 0) {
      categoryButtons.push({
        customId: `object_category_remove:${character.id}:simple:0`,
        label: `📦 Objets simples (${categories.simple.length})`,
        style: 2,
      });
    }

    if (categories.withCapacity.length > 0) {
      categoryButtons.push({
        customId: `object_category_remove:${character.id}:capacity:0`,
        label: `⚡ Objets capacité+ (${categories.withCapacity.length})`,
        style: 2,
      });
    }

    if (categories.withSkill.length > 0) {
      categoryButtons.push({
        customId: `object_category_remove:${character.id}:skill:0`,
        label: `🎯 Objets compétence+ (${categories.withSkill.length})`,
        style: 2,
      });
    }

    if (categories.resourceBags.length > 0) {
      categoryButtons.push({
        customId: `object_category_remove:${character.id}:resource:0`,
        label: `💰 Sacs ressources (${categories.resourceBags.length})`,
        style: 2,
      });
    }

    const buttonRow = createActionButtons(categoryButtons);

    await interaction.editReply({
      content: `## ➖ Retirer des objets de ${character.name}\n\n**${currentObjects.length} objet(s) possédé(s)**\n\nChoisissez une catégorie :`,
      components: [buttonRow],
    });
  } catch (error) {
    logger.error("Erreur lors de la préparation de la suppression d'objets:", { error });
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur lors de la préparation de la suppression d'objets.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de la préparation de la suppression d'objets.",
      });
    }
  }
}

/**
 * Gestionnaire pour afficher une catégorie d'objets avec pagination
 */
export async function handleObjectCategory(
  interaction: ButtonInteraction,
  character: Character,
  category: 'simple' | 'capacity' | 'skill' | 'resource',
  page: number,
  action: 'add' | 'remove'
) {
  try {
    await interaction.deferUpdate();

    // Récupérer tous les objets et ceux du personnage
    const [allObjectsResponse, currentObjectsResponse] = await Promise.all([
      httpClient.get('/objects'),
      httpClient.get(`/characters/${character.id}/objects`)
    ]);

    const allObjects = allObjectsResponse.data || [];
    const currentObjects = currentObjectsResponse.data || [];
    const currentObjectIds = new Set(currentObjects.map((o: ObjectType) => o.id));

    // Filtrer selon l'action (add ou remove)
    const objectsToFilter = action === 'add'
      ? allObjects.filter((obj: any) => !currentObjectIds.has(obj.id))
      : currentObjects;

    // Catégoriser
    const categories = categorizeObjects(objectsToFilter);

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
    const selectMenu = createObjectSelectMenu(
      objectsOnPage,
      [],
      `Sélectionnez les objets à ${action === 'add' ? 'ajouter' : 'retirer'}`,
      character.id
    );

    const components: any[] = [selectMenu];

    // Boutons de pagination si nécessaire
    if (totalPages > 1) {
      const paginationButtons = [];

      if (currentPage > 0) {
        paginationButtons.push({
          customId: `object_category_${action}:${character.id}:${category}:${currentPage - 1}`,
          label: '◀️ Précédent',
          style: 2,
        });
      }

      paginationButtons.push({
        customId: `pagination_info`,
        label: `Page ${currentPage + 1}/${totalPages}`,
        style: 2,
        disabled: true,
      });

      if (currentPage < totalPages - 1) {
        paginationButtons.push({
          customId: `object_category_${action}:${character.id}:${category}:${currentPage + 1}`,
          label: 'Suivant ▶️',
          style: 2,
        });
      }

      components.push(createActionButtons(paginationButtons));
    }

    const actionText = action === 'add' ? 'Ajouter' : 'Retirer';
    await interaction.editReply({
      content: `## ${actionText === 'Ajouter' ? '➕' : '➖'} ${actionText} des objets - ${categoryName}\n\n` +
               `Affichage de ${objectsOnPage.length} objet(s) (${startIdx + 1}-${endIdx} sur ${categoryObjects.length})`,
      components,
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage de la catégorie d'objets:", { error });
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Erreur lors de l'affichage de la catégorie.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de l'affichage de la catégorie.",
      });
    }
  }
}

/**
 * Gestionnaire pour la sélection d'objets dans le menu.
 */
export async function handleObjectSelect(
  interaction: StringSelectMenuInteraction,
  character: Character | null,
  action: 'add' | 'remove'
) {
  try {
    const selectedObjectIds = interaction.values;

    if (selectedObjectIds.length === 0) {
      await interaction.reply({
        content: "❌ Aucun objet sélectionné.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Personnage non trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    const results = [];

    for (const objectId of selectedObjectIds) {
      try {
        // Convertir l'ID en nombre pour les appels API
        const objectIdNum = parseInt(objectId, 10);

        // Vérifier que l'objet existe avant de l'ajouter
        if (action === 'add') {
          const objectsResponse = await httpClient.get('/objects');
          const allObjects = objectsResponse.data || [];
          const objectExists = allObjects.some((obj: any) => obj.id === objectIdNum);

          if (!objectExists) {
            results.push(`❌ Objet non trouvé: ${objectId}`);
            continue;
          }
        }

        if (action === 'add') {
          await httpClient.post(`/characters/${character.id}/objects/${objectIdNum}`);
          results.push(`${STATUS.SUCCESS} Objet ajouté`);
        } else {
          await httpClient.delete(`/characters/${character.id}/objects/${objectIdNum}`);
          results.push(`${STATUS.SUCCESS} Objet retiré`);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error.message || 'Erreur inconnue';
        results.push(`${STATUS.ERROR} Erreur: ${errorMessage}`);
      }
    }

    const embed = action === 'add'
      ? createSuccessEmbed('Ajout d\'objets', results.join('\n')).setFooter({
        text: `${selectedObjectIds.length} objet${selectedObjectIds.length > 1 ? 's' : ''} ajouté${selectedObjectIds.length > 1 ? 's' : ''}`,
      })
      : createSuccessEmbed('Suppression d\'objets', results.join('\n')).setFooter({
        text: `${selectedObjectIds.length} objet${selectedObjectIds.length > 1 ? 's' : ''} retiré${selectedObjectIds.length > 1 ? 's' : ''}`,
      });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error(`Erreur lors de ${action === 'add' ? 'l\'ajout' : 'la suppression'} d'objets:`, { error });
    await interaction.reply({
      content: `❌ Erreur lors de ${action === 'add' ? 'l\'ajout' : 'la suppression'} des objets.`,
      flags: ["Ephemeral"],
    });
  }
}

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
  createSkillSelectMenu,
  createSkillActionButtons,
  type Skill,
} from "../character-admin.components";
import { STATUS } from "../../../constants/emojis";

/**
 * Catégorise les compétences selon leur thème
 */
function categorizeSkills(skills: any[]) {
  const movement: any[] = [];
  const combat: any[] = [];
  const nature: any[] = [];
  const perception: any[] = [];

  const movementNames = ['Déplacement rapide', 'Escalader', 'Plonger', 'Orientation', 'Balisage'];
  const combatNames = ['Combat distance', 'Assommer', 'Pièges', 'Camouflage', 'Discrétion', 'Pistage'];
  const natureNames = ['Cultiver', 'Herboristerie', 'Apprivoisement', 'Réparer', 'Noeuds', 'Porter'];
  const perceptionNames = ['Vision nocturne', 'Vision lointaine', 'Communiquer'];

  skills.forEach(skill => {
    if (movementNames.includes(skill.name)) {
      movement.push(skill);
    } else if (combatNames.includes(skill.name)) {
      combat.push(skill);
    } else if (natureNames.includes(skill.name)) {
      nature.push(skill);
    } else if (perceptionNames.includes(skill.name)) {
      perception.push(skill);
    } else {
      // Par défaut, mettre dans "nature" si non catégorisé
      nature.push(skill);
    }
  });

  return { movement, combat, nature, perception };
}

/**
 * Gestionnaire pour le bouton "Gérer Compétences".
 * Affiche directement les compétences actuelles du personnage avec les boutons d'action.
 */
export async function handleSkillsButton(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer les compétences actuelles du personnage
    const response = await httpClient.get(`/characters/${character.id}/skills`);
    const currentSkills = response.data || [];

    // Créer la liste des compétences formatée
    let content = `## 📚 Compétences de ${character.name}\n`;

    if (currentSkills.length === 0) {
      content += "*Aucune compétence pour le moment.*\n\n";
    } else {
      content += currentSkills
        .map((skill: Skill) => `• **${skill.name}**${skill.description ? `\n  ${skill.description}` : ''}`)
        .join('\n') + '\n\n';
    }

    // Créer les boutons d'action
    const actionButtons = createSkillActionButtons(character.id);

    await interaction.editReply({
      content,
      components: [actionButtons],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage des compétences:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
      return; // Interaction expirée
    }
    await interaction.reply({
      content: "❌ Erreur lors de l'affichage des compétences.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gestionnaire pour l'ajout de compétences.
 * Affiche des boutons de catégories pour naviguer.
 */
export async function handleAddSkills(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer toutes les compétences et celles du personnage
    const [allSkillsResponse, currentSkillsResponse] = await Promise.all([
      httpClient.get('/skills'),
      httpClient.get(`/characters/${character.id}/skills`)
    ]);

    const allSkills = allSkillsResponse.data || [];
    const currentSkills = currentSkillsResponse.data || [];
    const currentSkillIds = new Set(currentSkills.map((s: Skill) => s.id));

    // Filtrer pour ne garder que les compétences non possédées
    const availableSkills = allSkills.filter(
      (skill: any) => !currentSkillIds.has(skill.id)
    );

    if (availableSkills.length === 0) {
      await interaction.editReply({
        content: `ℹ️ **${character.name}** possède déjà toutes les compétences disponibles.`,
      });
      return;
    }

    // Catégoriser les compétences
    const categories = categorizeSkills(availableSkills);

    // Créer les boutons de catégories
    const categoryButtons = [];

    if (categories.movement.length > 0) {
      categoryButtons.push({
        customId: `skill_category_add:${character.id}:movement:0`,
        label: `🏃 Déplacement (${categories.movement.length})`,
        style: 2,
      });
    }

    if (categories.combat.length > 0) {
      categoryButtons.push({
        customId: `skill_category_add:${character.id}:combat:0`,
        label: `⚔️ Combat & Survie (${categories.combat.length})`,
        style: 2,
      });
    }

    if (categories.nature.length > 0) {
      categoryButtons.push({
        customId: `skill_category_add:${character.id}:nature:0`,
        label: `🌿 Nature & Artisanat (${categories.nature.length})`,
        style: 2,
      });
    }

    if (categories.perception.length > 0) {
      categoryButtons.push({
        customId: `skill_category_add:${character.id}:perception:0`,
        label: `👁️ Perception & Social (${categories.perception.length})`,
        style: 2,
      });
    }

    const buttonRow = createActionButtons(categoryButtons);

    await interaction.editReply({
      content: `## ➕ Ajouter des compétences à ${character.name}\n\n**${availableSkills.length} compétence(s) disponible(s)**\n\nChoisissez une catégorie :`,
      components: [buttonRow],
    });
  } catch (error) {
    logger.error("Erreur lors de la préparation de l'ajout de compétences:", { error });
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur lors de la préparation de l'ajout de compétences.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de la préparation de l'ajout de compétences.",
      });
    }
  }
}

/**
 * Gestionnaire pour l'ajout de compétences (ANCIEN - garder pour compatibilité).
 * Affiche uniquement les compétences que le personnage ne possède pas encore.
 */
async function handleAddSkillsOld(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer toutes les compétences et celles du personnage
    const [allSkillsResponse, currentSkillsResponse] = await Promise.all([
      httpClient.get('/skills'),
      httpClient.get(`/characters/${character.id}/skills`)
    ]);

    const allSkills = allSkillsResponse.data || [];
    const currentSkills = currentSkillsResponse.data || [];
    const currentSkillIds = new Set(currentSkills.map((s: Skill) => s.id));

    // Filtrer pour ne garder que les compétences non possédées
    const availableSkills = allSkills.filter(
      (skill: any) => !currentSkillIds.has(skill.id)
    );

    if (availableSkills.length === 0) {
      await interaction.editReply({
        content: `ℹ️ **${character.name}** possède déjà toutes les compétences disponibles.`,
      });
      return;
    }

    const selectMenu = createSkillSelectMenu(
      availableSkills,
      [],
      'Sélectionnez les compétences à ajouter',
      character.id
    );

    await interaction.editReply({
      content: `## ➕ Ajouter des compétences à ${character.name}\nChoisissez dans la liste les compétences à ajouter :`,
      components: [selectMenu],
    });
  } catch (error) {
    logger.error("Erreur lors de la préparation de l'ajout de compétences:", { error });
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur lors de la préparation de l'ajout de compétences.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de la préparation de l'ajout de compétences.",
      });
    }
  }
}

/**
 * Gestionnaire pour la suppression de compétences.
 * Affiche des boutons de catégories pour naviguer.
 */
export async function handleRemoveSkills(
  interaction: ButtonInteraction,
  character: Character
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer les compétences actuelles du personnage
    const response = await httpClient.get(`/characters/${character.id}/skills`);
    const currentSkills = response.data || [];

    if (currentSkills.length === 0) {
      await interaction.editReply({
        content: `ℹ️ **${character.name}** n'a aucune compétence à retirer.`,
      });
      return;
    }

    // Catégoriser les compétences
    const categories = categorizeSkills(currentSkills);

    // Créer les boutons de catégories
    const categoryButtons = [];

    if (categories.movement.length > 0) {
      categoryButtons.push({
        customId: `skill_category_remove:${character.id}:movement:0`,
        label: `🏃 Déplacement (${categories.movement.length})`,
        style: 2,
      });
    }

    if (categories.combat.length > 0) {
      categoryButtons.push({
        customId: `skill_category_remove:${character.id}:combat:0`,
        label: `⚔️ Combat & Survie (${categories.combat.length})`,
        style: 2,
      });
    }

    if (categories.nature.length > 0) {
      categoryButtons.push({
        customId: `skill_category_remove:${character.id}:nature:0`,
        label: `🌿 Nature & Artisanat (${categories.nature.length})`,
        style: 2,
      });
    }

    if (categories.perception.length > 0) {
      categoryButtons.push({
        customId: `skill_category_remove:${character.id}:perception:0`,
        label: `👁️ Perception & Social (${categories.perception.length})`,
        style: 2,
      });
    }

    const buttonRow = createActionButtons(categoryButtons);

    await interaction.editReply({
      content: `## ➖ Retirer des compétences de ${character.name}\n\n**${currentSkills.length} compétence(s) possédée(s)**\n\nChoisissez une catégorie :`,
      components: [buttonRow],
    });
  } catch (error) {
    logger.error("Erreur lors de la préparation de la suppression de compétences:", { error });
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur lors de la préparation de la suppression de compétences.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: "❌ Erreur lors de la préparation de la suppression de compétences.",
      });
    }
  }
}

/**
 * Gestionnaire pour afficher une catégorie de compétences avec pagination
 */
export async function handleSkillCategory(
  interaction: ButtonInteraction,
  character: Character,
  category: 'movement' | 'combat' | 'nature' | 'perception',
  page: number,
  action: 'add' | 'remove'
) {
  try {
    await interaction.deferUpdate();

    // Récupérer toutes les compétences et celles du personnage
    const [allSkillsResponse, currentSkillsResponse] = await Promise.all([
      httpClient.get('/skills'),
      httpClient.get(`/characters/${character.id}/skills`)
    ]);

    const allSkills = allSkillsResponse.data || [];
    const currentSkills = currentSkillsResponse.data || [];
    const currentSkillIds = new Set(currentSkills.map((s: Skill) => s.id));

    // Filtrer selon l'action (add ou remove)
    const skillsToFilter = action === 'add'
      ? allSkills.filter((skill: any) => !currentSkillIds.has(skill.id))
      : currentSkills;

    // Catégoriser
    const categories = categorizeSkills(skillsToFilter);

    // Sélectionner la catégorie appropriée
    let categorySkills: any[] = [];
    let categoryName = '';

    switch (category) {
      case 'movement':
        categorySkills = categories.movement;
        categoryName = '🏃 Déplacement';
        break;
      case 'combat':
        categorySkills = categories.combat;
        categoryName = '⚔️ Combat & Survie';
        break;
      case 'nature':
        categorySkills = categories.nature;
        categoryName = '🌿 Nature & Artisanat';
        break;
      case 'perception':
        categorySkills = categories.perception;
        categoryName = '👁️ Perception & Social';
        break;
    }

    if (categorySkills.length === 0) {
      await interaction.editReply({
        content: `ℹ️ Aucune compétence dans la catégorie ${categoryName}`,
        components: [],
      });
      return;
    }

    // Pagination (25 compétences par page max)
    const MAX_PER_PAGE = 25;
    const totalPages = Math.ceil(categorySkills.length / MAX_PER_PAGE);
    const currentPage = Math.min(page, totalPages - 1);
    const startIdx = currentPage * MAX_PER_PAGE;
    const endIdx = Math.min(startIdx + MAX_PER_PAGE, categorySkills.length);
    const skillsOnPage = categorySkills.slice(startIdx, endIdx);

    // Créer le menu de sélection
    const selectMenu = createSkillSelectMenu(
      skillsOnPage,
      [],
      `Sélectionnez les compétences à ${action === 'add' ? 'ajouter' : 'retirer'}`,
      character.id
    );

    const components: any[] = [selectMenu];

    // Boutons de pagination si nécessaire
    if (totalPages > 1) {
      const paginationButtons = [];

      if (currentPage > 0) {
        paginationButtons.push({
          customId: `skill_category_${action}:${character.id}:${category}:${currentPage - 1}`,
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
          customId: `skill_category_${action}:${character.id}:${category}:${currentPage + 1}`,
          label: 'Suivant ▶️',
          style: 2,
        });
      }

      components.push(createActionButtons(paginationButtons));
    }

    const actionText = action === 'add' ? 'Ajouter' : 'Retirer';
    await interaction.editReply({
      content: `## ${actionText === 'Ajouter' ? '➕' : '➖'} ${actionText} des compétences - ${categoryName}\n\n` +
               `Affichage de ${skillsOnPage.length} compétence(s) (${startIdx + 1}-${endIdx} sur ${categorySkills.length})`,
      components,
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage de la catégorie de compétences:", { error });
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
 * Gestionnaire pour la sélection de compétences dans le menu.
 */
export async function handleSkillSelect(
  interaction: StringSelectMenuInteraction,
  character: Character | null,
  action: 'add' | 'remove'
) {
  try {
    const selectedSkillIds = interaction.values;

    if (selectedSkillIds.length === 0) {
      await interaction.reply({
        content: "❌ Aucune compétence sélectionnée.",
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

    for (const skillId of selectedSkillIds) {
      try {
        // Vérifier que la compétence existe avant de l'ajouter
        if (action === 'add') {
          const skillsResponse = await httpClient.get('/skills');
          const allSkills = skillsResponse.data || [];
          const skillExists = allSkills.some((skill: any) => skill.id === skillId);

          if (!skillExists) {
            results.push(`❌ Compétence non trouvée: ${skillId}`);
            continue;
          }
        }

        if (action === 'add') {
          await httpClient.post(`/characters/${character.id}/skills/${skillId}`);
          results.push(`${STATUS.SUCCESS} Compétence ajoutée`);
        } else {
          await httpClient.delete(`/characters/${character.id}/skills/${skillId}`);
          results.push(`${STATUS.SUCCESS} Compétence retirée`);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error.message || 'Erreur inconnue';
        results.push(`${STATUS.ERROR} Erreur: ${errorMessage}`);
      }
    }

    const embed = action === 'add'
      ? createSuccessEmbed('Ajout de compétences', results.join('\n')).setFooter({
        text: `${selectedSkillIds.length} compétence${selectedSkillIds.length > 1 ? 's' : ''} ajoutée${selectedSkillIds.length > 1 ? 's' : ''}`,
      })
      : createSuccessEmbed('Suppression de compétences', results.join('\n')).setFooter({
        text: `${selectedSkillIds.length} compétence${selectedSkillIds.length > 1 ? 's' : ''} retirée${selectedSkillIds.length > 1 ? 's' : ''}`,
      });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error(`Erreur lors de ${action === 'add' ? 'l\'ajout' : 'la suppression'} de compétences:`, { error });
    await interaction.reply({
      content: `❌ Erreur lors de ${action === 'add' ? 'l\'ajout' : 'la suppression'} des compétences.`,
      flags: ["Ephemeral"],
    });
  }
}

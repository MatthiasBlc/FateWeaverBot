import {
  ButtonInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { httpClient } from "../../../services/httpClient";
import { createSuccessEmbed } from "../../../utils/embeds";
import type { Character } from "../character-admin.types";
import {
  createSkillSelectMenu,
  createSkillActionButtons,
  type Skill,
} from "../character-admin.components";
import { STATUS } from "../../../constants/emojis";

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
 * Affiche uniquement les compétences que le personnage ne possède pas encore.
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
 * Affiche uniquement les compétences que le personnage possède déjà.
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

    // Créer un menu de sélection avec uniquement les compétences actuelles
    const selectMenu = createSkillSelectMenu(
      currentSkills,
      [],
      'Sélectionnez les compétences à retirer',
      character.id
    );

    await interaction.editReply({
      content: `## ➖ Retirer des compétences de ${character.name}\nSélectionnez les compétences à retirer :`,
      components: [selectMenu],
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

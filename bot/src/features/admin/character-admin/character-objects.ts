import {
  ButtonInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { httpClient } from "../../../services/httpClient";
import { createSuccessEmbed } from "../../../utils/embeds";
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
 * Gestionnaire pour l'ajout d'objets.
 * Affiche uniquement les objets que le personnage ne possède pas encore.
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

    const selectMenu = createObjectSelectMenu(
      availableObjects,
      [],
      'Sélectionnez les objets à ajouter',
      character.id
    );

    await interaction.editReply({
      content: `## ➕ Ajouter des objets à ${character.name}\nChoisissez dans la liste les objets à ajouter :`,
      components: [selectMenu],
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
 * Affiche uniquement les objets que le personnage possède déjà.
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

    // Créer un menu de sélection avec uniquement les objets actuels
    const selectMenu = createObjectSelectMenu(
      currentObjects,
      [],
      'Sélectionnez les objets à retirer',
      character.id
    );

    await interaction.editReply({
      content: `## ➖ Retirer des objets de ${character.name}\nSélectionnez les objets à retirer :`,
      components: [selectMenu],
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
        // Vérifier que l'objet existe avant de l'ajouter
        if (action === 'add') {
          const objectsResponse = await httpClient.get('/objects');
          const allObjects = objectsResponse.data || [];
          const objectExists = allObjects.some((obj: any) => obj.id === objectId);

          if (!objectExists) {
            results.push(`❌ Objet non trouvé: ${objectId}`);
            continue;
          }
        }

        if (action === 'add') {
          await httpClient.post(`/characters/${character.id}/objects/${objectId}`);
          results.push(`${STATUS.SUCCESS} Objet ajouté`);
        } else {
          await httpClient.delete(`/characters/${character.id}/objects/${objectId}`);
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

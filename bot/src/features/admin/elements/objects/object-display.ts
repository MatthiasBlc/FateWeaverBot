/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { apiService } from "../../../../services/api";
import { logger } from "../../../../services/logger";
import { STATUS } from "../../../../constants/emojis";

/**
 * Catégorise les objets selon leurs bonus
 */
export function categorizeObjects(objects: any[]) {
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
 * Gère le clic sur le bouton "Modifier Objet"
 * Affiche des boutons de catégories pour naviguer
 */
export async function handleEditObjectButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const objects = await apiService.objects.getAllObjectTypes();

    if (!objects || objects.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun objet trouvé.`,
      });
      return;
    }

    // Catégoriser les objets
    const categories = categorizeObjects(objects);

    // Créer les boutons de catégories
    const categoryButtons: any[] = [];

    if (categories.simple.length > 0) {
      categoryButtons.push({
        customId: `object_edit_category:simple:0`,
        label: `📦 Objets bonus (${categories.simple.length})`,
        style: 2, // Secondary
      });
    }

    if (categories.withCapacity.length > 0) {
      categoryButtons.push({
        customId: `object_edit_category:capacity:0`,
        label: `⚡ Objets capacité+ (${categories.withCapacity.length})`,
        style: 2,
      });
    }

    if (categories.withSkill.length > 0) {
      categoryButtons.push({
        customId: `object_edit_category:skill:0`,
        label: `🎯 Objets compétence+ (${categories.withSkill.length})`,
        style: 2,
      });
    }

    if (categories.resourceBags.length > 0) {
      categoryButtons.push({
        customId: `object_edit_category:resource:0`,
        label: `💰 Sacs ressources (${categories.resourceBags.length})`,
        style: 2,
      });
    }

    // Créer les ActionRow avec les boutons
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < categoryButtons.length; i += 5) {
      const buttons = categoryButtons.slice(i, i + 5).map(btn =>
        new ButtonBuilder()
          .setCustomId(btn.customId)
          .setLabel(btn.label)
          .setStyle(btn.style)
      );
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
    }

    await interaction.editReply({
      content: `## ✏️ Modifier des objets\n\n**${objects.length} objet(s) disponible(s)**\n\nChoisissez une catégorie :`,
      components: rows,
    });
  } catch (error) {
    logger.error("Erreur dans handleEditObjectButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de l'objet.`,
    });
  }
}

/**
 * Gère l'affichage d'une catégorie d'objets à modifier avec pagination
 */
export async function handleEditObjectCategory(
  interaction: ButtonInteraction,
  category: 'simple' | 'capacity' | 'skill' | 'resource',
  page: number
) {
  try {
    await interaction.deferUpdate();

    const allObjects = await apiService.objects.getAllObjectTypes();
    const categories = categorizeObjects(allObjects);

    let categoryObjects: any[] = [];
    let categoryName = '';

    switch (category) {
      case 'simple':
        categoryObjects = categories.simple;
        categoryName = '📦 Objets bonus';
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

    // Créer le menu de sélection des objets
    const selectOptions = objectsOnPage.map((o: any) => ({
      label: o.name.substring(0, 100),
      value: String(o.id),
      description: o.description ? o.description.substring(0, 100) : "Pas de description",
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_object_to_edit")
      .setPlaceholder("Sélectionnez un objet à modifier")
      .addOptions(selectOptions);

    const components: any[] = [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)];

    // Boutons de pagination si nécessaire
    if (totalPages > 1) {
      const paginationButtons = [];

      if (currentPage > 0) {
        paginationButtons.push(
          new ButtonBuilder()
            .setCustomId(`object_edit_category:${category}:${currentPage - 1}`)
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
            .setCustomId(`object_edit_category:${category}:${currentPage + 1}`)
            .setLabel('Suivant ▶️')
            .setStyle(ButtonStyle.Secondary)
        );
      }

      components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(paginationButtons));
    }

    await interaction.editReply({
      content: `## ✏️ Modifier des objets - ${categoryName}\n\n` +
        `Affichage de ${objectsOnPage.length} objet(s) (${startIdx + 1}-${endIdx} sur ${categoryObjects.length})`,
      components,
    });
  } catch (error) {
    logger.error("Erreur dans handleEditObjectCategory", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage de la catégorie.`,
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: `${STATUS.ERROR} Erreur lors de l'affichage de la catégorie.`,
      });
    }
  }
}

/**
 * Gère la sélection d'un objet à modifier dans le menu
 */
export async function handleSelectObjectToEditMenu(
  interaction: any
) {
  try {
    const objectId = parseInt(interaction.values[0], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object) {
      await interaction.reply({
        content: `${STATUS.ERROR} Objet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Afficher les options de modification
    const modifyButtons = [
      new ButtonBuilder()
        .setCustomId(`object_modify_name:${objectId}`)
        .setLabel('✏️ Modifier le nom')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`object_modify_description:${objectId}`)
        .setLabel('📝 Modifier la description')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`object_modify_skills:${objectId}`)
        .setLabel('🎯 Gérer les compétences')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`object_modify_capabilities:${objectId}`)
        .setLabel('⚡ Gérer les capacités')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`object_delete:${objectId}`)
        .setLabel('🗑️ Supprimer')
        .setStyle(ButtonStyle.Danger),
    ];

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(modifyButtons);

    await interaction.reply({
      content: `## ✏️ ${object.name}\n\n${object.description ? object.description : '*Pas de description*'}\n\nQue voulez-vous modifier ?`,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleSelectObjectToEditMenu", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

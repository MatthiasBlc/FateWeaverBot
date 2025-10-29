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
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { httpClient } from "../../../services/httpClient";
import { createSuccessEmbed, createInfoEmbed } from "../../../utils/embeds";
import { getTownByGuildId } from "../../../utils/town";
import { PROJECT, STATUS } from "@shared/constants/emojis";
import { projectCreationCache } from "../../../services/project-creation-cache";
import { replyEphemeral } from "../../../utils/interaction-helpers";

/**
 * ÉTAPE 1: Handler pour le bouton "Ajouter un projet"
 * Affiche directement l'écran de sélection (craft types + output type)
 */
export async function handleProjectAdminAddButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer la ville
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
      });
      return;
    }

    // Créer l'entrée dans le cache SANS nom (optionnel)
    const cacheId = projectCreationCache.store(interaction.user.id, {
      name: "", // Nom vide par défaut, sera optionnel
      townId: town.id,
      craftTypes: [],
      outputType: null as any,
      outputQuantity: 1,
      paRequired: 0,
      resourceCosts: [],
    });

    // Afficher l'écran de sélection avec 2 select menus
    await showCraftAndOutputSelection(interaction, cacheId, "");

    logger.info("Project add started", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });
  } catch (error) {
    logger.error("Error starting project add:", { error });
    await interaction.editReply({
      content: "❌ Erreur lors de l'affichage du formulaire.",
    });
  }
}

/**
 * ÉTAPE 1: Handler pour la soumission du modal initial
 * Affiche les 2 select menus + bouton valider
 */
export async function handleProjectAdminAddStep1Modal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Récupérer la ville
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
      });
      return;
    }

    // Récupérer le nom du projet
    const name = interaction.fields.getTextInputValue("project_name").trim();

    // Créer l'entrée dans le cache (sans craft types ni output type encore)
    const cacheId = projectCreationCache.store(interaction.user.id, {
      name,
      townId: town.id,
      craftTypes: [],
      outputType: null as any, // Sera rempli après sélection
      outputQuantity: 1,
      paRequired: 0,
      resourceCosts: [],
    });

    // Afficher l'écran de sélection avec 2 select menus
    await showCraftAndOutputSelection(interaction, cacheId, name);

  } catch (error: any) {
    logger.error("Error in project add step 1:", { error });
    await interaction.editReply({
      content: `❌ Erreur : ${error.message || "Erreur inconnue"}`,
    });
  }
}

/**
 * ÉTAPE 2: Afficher l'écran avec 2 select menus (craft types + output type) + boutons
 */
async function showCraftAndOutputSelection(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  cacheId: string,
  projectName: string
) {
  try {
    // Select menu 1: Types d'artisanat (multi-sélection)
    const craftTypesMenu = new StringSelectMenuBuilder()
      .setCustomId(`project_add_craft_types:${cacheId}`)
      .setPlaceholder("Sélectionnez les corps d'artisanat")
      .setMinValues(1)
      .setMaxValues(3)
      .addOptions([
        { label: "Tisser", value: "TISSER", emoji: "🧵" },
        { label: "Forger", value: "FORGER", emoji: "🔨" },
        { label: "Menuiser", value: "MENUISER", emoji: "🪚" },
      ]);

    // Select menu 2: Type de sortie (resource ou object)
    const outputTypeMenu = new StringSelectMenuBuilder()
      .setCustomId(`project_add_output_type:${cacheId}`)
      .setPlaceholder("Type de production")
      .addOptions([
        { label: "Ressource", value: "RESOURCE", emoji: "📦" },
        { label: "Objet", value: "OBJECT", emoji: "⚒️" },
      ]);

    // Boutons : Nom optionnel + Valider
    const nameButton = new ButtonBuilder()
      .setCustomId(`project_add_optional_name:${cacheId}`)
      .setLabel("Ajouter nom (optionnel)")
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Secondary);

    const validateButton = new ButtonBuilder()
      .setCustomId(`project_add_validate_selection:${cacheId}`)
      .setLabel("Valider")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true); // Désactivé jusqu'à ce que les 2 menus soient remplis

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(craftTypesMenu);
    const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(outputTypeMenu);
    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(nameButton, validateButton);

    const displayName = projectName && projectName.trim() ? projectName : "Sans nom";

    await interaction.editReply({
      content: `${PROJECT.ICON} **Nouveau projet : ${displayName}**\n\n` +
               `📝 **Étape 1/4** : Configuration de base\n\n` +
               `Veuillez sélectionner :\n` +
               `• Les corps d'artisanat concernés\n` +
               `• Le type de production\n\n` +
               `Cliquez ensuite sur **Valider** pour continuer.`,
      components: [row1, row2, row3],
    });

  } catch (error: any) {
    logger.error("Error showing craft and output selection:", { error });
    await interaction.editReply({
      content: `❌ Erreur : ${error.message || "Erreur inconnue"}`,
    });
  }
}

/**
 * Handler pour le bouton nom optionnel
 */
export async function handleProjectAddOptionalName(interaction: ButtonInteraction) {
  try {
    const cacheId = interaction.customId.split(":")[1];
    const data = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!data || !cacheId) {
      await interaction.reply({
        content: "❌ Session expirée. Recommencez la création du projet.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Afficher modal pour le nom
    const modal = new ModalBuilder()
      .setCustomId(`project_add_name_modal:${cacheId}`)
      .setTitle("Nom du projet (optionnel)");

    const nameInput = new TextInputBuilder()
      .setCustomId("project_name")
      .setLabel("Nom du projet")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder("Ex: Construction d'une forge")
      .setMaxLength(100)
      .setValue(data.name || ""); // Pré-remplir avec le nom existant s'il y en a un

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput)
    );

    await interaction.showModal(modal);

  } catch (error: any) {
    logger.error("Error showing optional name modal:", { error });
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le modal de nom optionnel
 */
export async function handleProjectAddNameModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const cacheId = interaction.customId.split(":")[1];
    const data = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!data || !cacheId) {
      await interaction.editReply({
        content: "❌ Session expirée. Recommencez la création du projet.",
      });
      return;
    }

    // Récupérer le nom
    const name = interaction.fields.getTextInputValue("project_name").trim();
    data.name = name;
    projectCreationCache.store(interaction.user.id, data, cacheId);

    // Vérifier si les deux sélections sont faites
    const canValidate = data.craftTypes.length > 0 && data.outputType !== null;

    // Reconstruire les components avec le nom mis à jour
    await updateSelectionMessage(interaction, cacheId, data.name, data.craftTypes, data.outputType, canValidate);

  } catch (error: any) {
    logger.error("Error handling name modal:", { error });
    await interaction.editReply({
      content: `❌ Erreur : ${error.message}`,
    });
  }
}

/**
 * Handler pour la sélection des craft types
 */
export async function handleProjectAddCraftTypesSelect(interaction: StringSelectMenuInteraction) {
  try {
    const cacheId = interaction.customId.split(":")[1];
    const data = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!data || !cacheId) {
      await interaction.reply({
        content: "❌ Session expirée. Recommencez la création du projet.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Mettre à jour le cache avec les craft types sélectionnés
    data.craftTypes = interaction.values;
    projectCreationCache.store(interaction.user.id, data, cacheId);

    // Vérifier si les deux sélections sont faites
    const canValidate = data.craftTypes.length > 0 && data.outputType !== null;

    // Reconstruire les components avec le bouton valider activé si nécessaire
    await updateSelectionMessage(interaction, cacheId, data.name, data.craftTypes, data.outputType, canValidate);

  } catch (error: any) {
    logger.error("Error handling craft types select:", { error });
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la sélection du type de sortie
 */
export async function handleProjectAddOutputTypeSelect(interaction: StringSelectMenuInteraction) {
  try {
    const cacheId = interaction.customId.split(":")[1];
    const data = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!data || !cacheId) {
      await interaction.reply({
        content: "❌ Session expirée. Recommencez la création du projet.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Mettre à jour le cache avec le type de sortie sélectionné
    data.outputType = interaction.values[0] as "RESOURCE" | "OBJECT";
    projectCreationCache.store(interaction.user.id, data, cacheId);

    // Vérifier si les deux sélections sont faites
    const canValidate = data.craftTypes.length > 0 && data.outputType !== null;

    // Reconstruire les components avec le bouton valider activé si nécessaire
    await updateSelectionMessage(interaction, cacheId, data.name, data.craftTypes, data.outputType, canValidate);

  } catch (error: any) {
    logger.error("Error handling output type select:", { error });
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Helper pour mettre à jour le message avec les sélections actuelles
 */
async function updateSelectionMessage(
  interaction: StringSelectMenuInteraction | ModalSubmitInteraction,
  cacheId: string,
  projectName: string,
  craftTypes: string[],
  outputType: string | null,
  canValidate: boolean
) {
  // Select menu 1: Types d'artisanat (multi-sélection)
  const craftTypesMenu = new StringSelectMenuBuilder()
    .setCustomId(`project_add_craft_types:${cacheId}`)
    .setPlaceholder("Sélectionnez les corps d'artisanat")
    .setMinValues(1)
    .setMaxValues(3)
    .addOptions([
      { label: "Tisser", value: "TISSER", emoji: "🧵" },
      { label: "Forger", value: "FORGER", emoji: "🔨" },
      { label: "Menuiser", value: "MENUISER", emoji: "🪚" },
    ]);

  // Select menu 2: Type de sortie (resource ou object)
  const outputTypeMenu = new StringSelectMenuBuilder()
    .setCustomId(`project_add_output_type:${cacheId}`)
    .setPlaceholder("Type de production")
    .addOptions([
      { label: "Ressource", value: "RESOURCE", emoji: "📦" },
      { label: "Objet", value: "OBJECT", emoji: "⚒️" },
    ]);

  // Boutons : Nom optionnel + Valider
  const nameButton = new ButtonBuilder()
    .setCustomId(`project_add_optional_name:${cacheId}`)
    .setLabel("Ajouter nom (optionnel)")
    .setEmoji("✏️")
    .setStyle(ButtonStyle.Secondary);

  const validateButton = new ButtonBuilder()
    .setCustomId(`project_add_validate_selection:${cacheId}`)
    .setLabel("Valider")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success)
    .setDisabled(!canValidate);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(craftTypesMenu);
  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(outputTypeMenu);
  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(nameButton, validateButton);

  // Construire le message avec les sélections actuelles
  const displayName = projectName && projectName.trim() ? projectName : "Sans nom";
  let content = `${PROJECT.ICON} **Nouveau projet : ${displayName}**\n\n` +
                `📝 **Étape 1/4** : Configuration de base\n\n`;

  if (craftTypes.length > 0) {
    content += `✅ **Corps d'artisanat** : ${craftTypes.map(ct => {
      const emoji = ct === "TISSER" ? "🧵" : ct === "FORGER" ? "🔨" : "🪚";
      return `${emoji} ${ct}`;
    }).join(", ")}\n`;
  } else {
    content += `⏳ **Corps d'artisanat** : Non sélectionné\n`;
  }

  if (outputType) {
    const typeLabel = outputType === "RESOURCE" ? "📦 Ressource" : "⚒️ Objet";
    content += `✅ **Type de production** : ${typeLabel}\n`;
  } else {
    content += `⏳ **Type de production** : Non sélectionné\n`;
  }

  content += `\n${canValidate ? "✅ Cliquez sur **Valider** pour continuer." : "⏳ Complétez les sélections ci-dessus."}`;

  // Use update for StringSelectMenuInteraction, editReply for ModalSubmitInteraction
  if (interaction instanceof StringSelectMenuInteraction) {
    await interaction.update({
      content,
      components: [row1, row2, row3],
    });
  } else {
    await interaction.editReply({
      content,
      components: [row1, row2, row3],
    });
  }
}

/**
 * Handler pour le bouton Valider
 */
export async function handleProjectAddValidateSelection(interaction: ButtonInteraction) {
  try {
    await interaction.deferUpdate();

    const cacheId = interaction.customId.split(":")[1];
    const data = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!data || !cacheId) {
      await interaction.followUp({
        content: "❌ Session expirée. Recommencez la création du projet.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Vérifier que les sélections sont complètes
    if (data.craftTypes.length === 0 || !data.outputType) {
      await interaction.followUp({
        content: "❌ Veuillez compléter toutes les sélections.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Passer à l'étape suivante (sélection de l'output spécifique)
    // On utilise l'ancienne fonction showOutputSelection qui existe déjà
    // Mais on doit créer un mock interaction pour la compatibilité
    const mockInteraction = {
      editReply: interaction.editReply.bind(interaction),
      user: interaction.user,
      guildId: interaction.guildId,
    } as any;

    await showOutputSelection(mockInteraction, cacheId, data.outputType);

  } catch (error: any) {
    logger.error("Error validating selection:", { error });
    await interaction.followUp({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}

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
 * ÉTAPE 2: Afficher le select menu pour choisir la ressource ou l'objet
 */
async function showOutputSelection(
  interaction: ModalSubmitInteraction,
  cacheId: string,
  outputType: "RESOURCE" | "OBJECT"
) {
  try {
    if (outputType === "RESOURCE") {
      // Récupérer toutes les ressources disponibles
      const resourceTypes = await apiService.getAllResourceTypes();

      if (!resourceTypes || resourceTypes.length === 0) {
        await interaction.editReply({
          content: "❌ Aucun type de ressource disponible.",
        });
        return;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`project_add_select_resource:${cacheId}`)
        .setPlaceholder("Sélectionnez le type de ressource produite")
        .addOptions(
          resourceTypes.slice(0, 25).map((rt: any) => ({
            label: rt.name,
            value: rt.id.toString(),
            emoji: rt.emoji || "📦",
            description: rt.description ? rt.description.substring(0, 100) : undefined,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.editReply({
        content: `${PROJECT.ICON} **Étape 2/4** - Sélectionnez la ressource produite :`,
        components: [row],
      });
    } else {
      // Récupérer tous les objets disponibles avec leurs relations
      const response = await httpClient.get('/objects');
      const objects = response.data || [];

      if (!objects || objects.length === 0) {
        await interaction.editReply({
          content: "❌ Aucun objet disponible.",
        });
        return;
      }

      // Catégoriser les objets
      const categories = categorizeObjects(objects);

      // Créer les boutons de catégories
      const categoryButtons = [];

      if (categories.simple.length > 0) {
        categoryButtons.push(
          new ButtonBuilder()
            .setCustomId(`project_add_object_category:${cacheId}:simple:0`)
            .setLabel(`📦 Objets simples (${categories.simple.length})`)
            .setStyle(ButtonStyle.Secondary)
        );
      }

      if (categories.withCapacity.length > 0) {
        categoryButtons.push(
          new ButtonBuilder()
            .setCustomId(`project_add_object_category:${cacheId}:capacity:0`)
            .setLabel(`⚡ Capacité+ (${categories.withCapacity.length})`)
            .setStyle(ButtonStyle.Secondary)
        );
      }

      if (categories.withSkill.length > 0) {
        categoryButtons.push(
          new ButtonBuilder()
            .setCustomId(`project_add_object_category:${cacheId}:skill:0`)
            .setLabel(`🎯 Compétence+ (${categories.withSkill.length})`)
            .setStyle(ButtonStyle.Secondary)
        );
      }

      if (categories.resourceBags.length > 0) {
        categoryButtons.push(
          new ButtonBuilder()
            .setCustomId(`project_add_object_category:${cacheId}:resource:0`)
            .setLabel(`💰 Sacs ressources (${categories.resourceBags.length})`)
            .setStyle(ButtonStyle.Secondary)
        );
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...categoryButtons);

      await interaction.editReply({
        content: `${PROJECT.ICON} **Étape 2/4** - Sélectionnez la catégorie d'objet produit :\n\n**${objects.length} objets disponibles**`,
        components: [row],
      });
    }
  } catch (error) {
    logger.error("Error showing output selection:", { error });
    await interaction.editReply({
      content: "❌ Erreur lors de l'affichage des choix.",
    });
  }
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
    await replyEphemeral(interaction, "❌ Erreur lors de la sélection.");
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
      content: "❌ Erreur lors de l'affichage de la catégorie.",
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
    await replyEphemeral(interaction, "❌ Erreur lors de la sélection.");
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
        content: "❌ La quantité doit être un nombre positif.",
      });
      return;
    }

    if (isNaN(paRequired) || paRequired <= 0) {
      await interaction.editReply({
        content: "❌ Le nombre de PA doit être un nombre positif.",
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
      content: "❌ Erreur lors du traitement.",
    });
  }
}

/**
 * Helper pour afficher l'interface de gestion des ressources du projet
 */
async function showResourceManagementInterface(
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
    .setLabel("✅ Valider et continuer")
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
        "❌ Aucun type de ressource disponible."
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
    await replyEphemeral(interaction, "❌ Erreur lors de l'affichage des ressources.");
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
      await replyEphemeral(interaction, "❌ Ressource introuvable.");
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
    await replyEphemeral(interaction, "❌ Erreur lors de la sélection.");
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
        content: "❌ La quantité doit être un nombre positif.",
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
        content: "❌ Ressource introuvable.",
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
      content: "❌ Erreur lors de l'ajout.",
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

    // Afficher l'interface de blueprint (étape 4 - optionnelle)
    await showBlueprintInterface(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddValidateCosts:", { error });
    await interaction.editReply({
      content: "❌ Erreur lors de la validation.",
      components: [],
    });
  }
}

/**
 * ÉTAPE 4: Afficher l'interface de configuration du blueprint (optionnel)
 */
async function showBlueprintInterface(
  interaction: ButtonInteraction,
  cacheId: string,
  projectData: any
) {
  const content = `${PROJECT.ICON} **Étape 4/4** - Configuration Blueprint (optionnel)\n\n` +
    `Un **blueprint** permet de recommencer le même projet plusieurs fois.\n\n` +
    `Voulez-vous configurer ce projet comme un blueprint ?`;

  const yesButton = new ButtonBuilder()
    .setCustomId(`project_add_blueprint_yes:${cacheId}`)
    .setLabel("✅ Oui, configurer le blueprint")
    .setStyle(ButtonStyle.Success);

  const noButton = new ButtonBuilder()
    .setCustomId(`project_add_blueprint_no:${cacheId}`)
    .setLabel("❌ Non, créer le projet maintenant")
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

    // Créer le projet
    await createProject(interaction, cacheId, projectData);

  } catch (error) {
    logger.error("Error in handleProjectAddBlueprintNo:", { error });
    await interaction.editReply({
      content: "❌ Erreur lors de la création.",
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
    await replyEphemeral(interaction, "❌ Erreur lors de l'affichage du formulaire.");
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
        content: "❌ Le nombre de PA doit être un nombre positif.",
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
      content: "❌ Erreur lors du traitement.",
    });
  }
}

/**
 * Helper pour afficher l'interface de gestion des ressources blueprint
 */
async function showBlueprintResourceManagementInterface(
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
    .setLabel("✅ Créer le projet")
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
        "❌ Aucun type de ressource disponible."
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
    await replyEphemeral(interaction, "❌ Erreur lors de l'affichage.");
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
      await replyEphemeral(interaction, "❌ Ressource introuvable.");
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
    await replyEphemeral(interaction, "❌ Erreur lors de la sélection.");
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
        content: "❌ La quantité doit être un nombre positif.",
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
        content: "❌ Ressource introuvable.",
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
      content: "❌ Erreur lors de l'ajout.",
    });
  }
}

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
      content: "❌ Erreur lors de la création.",
      components: [],
    });
  }
}

/**
 * Helper pour créer le projet via l'API
 */
async function createProject(
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

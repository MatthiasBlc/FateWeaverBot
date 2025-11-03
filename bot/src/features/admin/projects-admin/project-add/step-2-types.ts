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
import { httpClient } from "../../../../services/httpClient";
import { PROJECT, STATUS } from "@shared/constants/emojis";
import { projectCreationCache } from "../../../../services/project-creation-cache";
import { replyEphemeral } from "../../../../utils/interaction-helpers";

/**
 * Handler pour la sélection des craft types
 */
export async function handleProjectAddCraftTypesSelect(interaction: StringSelectMenuInteraction) {
  try {
    const cacheId = interaction.customId.split(":")[1];
    const data = projectCreationCache.retrieve(cacheId, interaction.user.id);

    if (!data || !cacheId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée. Recommencez la création du projet.`,
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
        content: `${STATUS.ERROR} Session expirée. Recommencez la création du projet.`,
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
export async function updateSelectionMessage(
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
      { label: "Travailler le bois", value: "MENUISER", emoji: "🪚" },
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
    .setEmoji(`${STATUS.SUCCESS}`)
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

  content += `\n${canValidate ? `${STATUS.SUCCESS} Cliquez sur **Valider** pour continuer.` : "⏳ Complétez les sélections ci-dessus."}`;

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
        content: `${STATUS.ERROR} Session expirée. Recommencez la création du projet.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Vérifier que les sélections sont complètes
    if (data.craftTypes.length === 0 || !data.outputType) {
      await interaction.followUp({
        content: `${STATUS.ERROR} Veuillez compléter toutes les sélections.`,
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
export async function showOutputSelection(
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
          content: `${STATUS.ERROR} Aucun type de ressource disponible.`,
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
          content: `${STATUS.ERROR} Aucun objet disponible.`,
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
      content: `${STATUS.ERROR} Erreur lors de l'affichage des choix.`,
    });
  }
}

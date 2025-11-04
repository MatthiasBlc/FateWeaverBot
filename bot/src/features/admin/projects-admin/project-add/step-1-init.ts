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
import { getTownByGuildId } from "../../../../utils/town";
import { PROJECT, STATUS, SYSTEM } from "@shared/constants/emojis";
import { projectCreationCache } from "../../../../services/project-creation-cache";

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
        content: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,
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
      content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire.`,
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
        content: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,
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
      content: `${STATUS.ERROR} Erreur : ${error.message || "Erreur inconnue"}`,
    });
  }
}

/**
 * ÉTAPE 1: Afficher l'écran avec 2 select menus (craft types + output type) + boutons
 */
export async function showCraftAndOutputSelection(
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
      content: `${STATUS.ERROR} Erreur : ${error.message || "Erreur inconnue"}`,
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
        content: `${STATUS.ERROR} Session expirée. Recommencez la création du projet.`,
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
      content: `${STATUS.ERROR} Erreur : ${error.message}`,
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
        content: `${STATUS.ERROR} Session expirée. Recommencez la création du projet.`,
      });
      return;
    }

    // Récupérer le nom
    const name = interaction.fields.getTextInputValue("project_name").trim();
    data.name = name;
    projectCreationCache.store(interaction.user.id, data, cacheId);

    // Vérifier si les deux sélections sont faites
    const canValidate = data.craftTypes.length > 0 && data.outputType !== null;

    // Import the helper from step-2-types
    const { updateSelectionMessage } = await import("./step-2-types.js");

    // Reconstruire les components avec le nom mis à jour
    await updateSelectionMessage(interaction, cacheId, data.name, data.craftTypes, data.outputType, canValidate);

  } catch (error: any) {
    logger.error("Error handling name modal:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur : ${error.message}`,
    });
  }
}

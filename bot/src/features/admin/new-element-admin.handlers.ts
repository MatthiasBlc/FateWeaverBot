/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
import { STATUS, getAvailableEmojiList } from "../../constants/emojis";

/**
 * Gère la commande /new-element-admin
 */
export async function handleNewElementAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous devez être administrateur pour utiliser cette commande.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const resourceButton = new ButtonBuilder()
      .setCustomId("element_category_resource")
      .setLabel("📦 Ressources")
      .setStyle(ButtonStyle.Primary);

    const objectButton = new ButtonBuilder()
      .setCustomId("element_category_object")
      .setLabel("🎒 Objets")
      .setStyle(ButtonStyle.Primary);

    const skillButton = new ButtonBuilder()
      .setCustomId("element_category_skill")
      .setLabel("⚔️ Compétences")
      .setStyle(ButtonStyle.Primary);

    const capabilityButton = new ButtonBuilder()
      .setCustomId("element_category_capability")
      .setLabel("✨ Capacités")
      .setStyle(ButtonStyle.Primary);

    const emojiButton = new ButtonBuilder()
      .setCustomId("element_category_emoji")
      .setLabel("🎨 Emojis")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      resourceButton,
      objectButton,
      skillButton,
      capabilityButton
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(emojiButton);

    await interaction.reply({
      content: "**Gestion des éléments**\n\nSélectionnez une catégorie :",
      components: [row, row2],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleNewElementAdminCommand", {
      error: error instanceof Error ? error.message : error,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection d'une catégorie d'éléments
 */
export async function handleElementCategoryButton(interaction: ButtonInteraction) {
  try {
    const category = interaction.customId.split('_')[2];

    const addButton = new ButtonBuilder()
      .setCustomId(`new_element_${category}`)
      .setLabel("➕ Ajouter")
      .setStyle(ButtonStyle.Success);

    const editButton = new ButtonBuilder()
      .setCustomId(`edit_element_${category}`)
      .setLabel("✏️ Modifier")
      .setStyle(ButtonStyle.Primary);

    const deleteButton = new ButtonBuilder()
      .setCustomId(`delete_element_${category}`)
      .setLabel("🗑️ Supprimer")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addButton,
      editButton,
      deleteButton
    );

    const categoryNames: Record<string, string> = {
      resource: "Ressources",
      object: "Objets",
      skill: "Compétences",
      capability: "Capacités",
    };

    await interaction.update({
      content: `**${categoryNames[category]}**\n\nSélectionnez une action :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleElementCategoryButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère le clic sur le bouton "Nouvelle Capacité"
 */
export async function handleNewCapabilityButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour la capacité
    const modal = new ModalBuilder()
      .setCustomId("new_capability_modal")
      .setTitle("Créer une nouvelle capacité");

    const nameInput = new TextInputBuilder()
      .setCustomId("capability_name")
      .setLabel("Nom de la capacité")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiTagInput = new TextInputBuilder()
      .setCustomId("capability_emoji_tag")
      .setLabel("Tag emoji (ex: HUNT, GATHER)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const categoryInput = new TextInputBuilder()
      .setCustomId("capability_category")
      .setLabel("Catégorie (HARVEST/CRAFT/SCIENCE/SPECIAL)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const costPAInput = new TextInputBuilder()
      .setCustomId("capability_cost_pa")
      .setLabel("Coût en PA (1-4)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(1);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("capability_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiTagInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(costPAInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewCapabilityButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère le clic sur le bouton "Nouvelle Ressource"
 */
export async function handleNewResourceButton(interaction: ButtonInteraction) {
  try {
    // Afficher la liste déroulante des catégories d'emoji
    const typeSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId("resource_emoji_type_select")
      .setPlaceholder("Sélectionnez une catégorie d'emoji")
      .addOptions([
        { label: "Ressource", value: "resource", emoji: "📦" },
        { label: "Capacité", value: "capability", emoji: "✨" },
        { label: "Objet", value: "object", emoji: "🎒" },
        { label: "Compétence", value: "skill", emoji: "⚔️" },
        { label: "Action", value: "action", emoji: "➕" },
        { label: "Custom", value: "custom", emoji: "🎨" },
      ]);

    const row = new (ActionRowBuilder as any)().addComponents(typeSelect);

    await interaction.reply({
      content: "**Création d'une ressource**\n\nÉtape 1: Sélectionnez une catégorie d'emoji",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleNewResourceButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la sélection de la catégorie d'emoji pour la ressource
 */
export async function handleResourceEmojiCategorySelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    const selectedType = interaction.values[0];

    // Récupérer les emojis de la catégorie sélectionnée
    const emojis = await apiService.emojis.listEmojis(selectedType);

    if (emojis.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucun emoji trouvé pour cette catégorie.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer la liste déroulante des emojis
    const emojiOptions = emojis.map((e) => ({
      label: `${e.emoji} ${e.key}`,
      value: `${selectedType}:${e.key}`,
      emoji: e.emoji,
    }));

    const emojiSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId(`resource_emoji_select:${selectedType}`)
      .setPlaceholder("Sélectionnez un emoji")
      .addOptions(emojiOptions);

    const row = new (ActionRowBuilder as any)().addComponents(emojiSelect);

    await interaction.reply({
      content: `**Création d'une ressource**\n\nÉtape 2: Sélectionnez un emoji de la catégorie **${selectedType}**`,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleResourceEmojiCategorySelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors du chargement des emojis.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection d'un emoji pour la ressource
 */
export async function handleResourceEmojiSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    const selectedValue = interaction.values[0];
    const [selectedType, selectedKey] = selectedValue.split(":");

    // Récupérer tous les emojis pour trouver l'emoji sélectionné
    const allEmojis = await apiService.emojis.listEmojis(selectedType);
    const selectedEmoji = allEmojis.find((e) => e.key === selectedKey);

    if (!selectedEmoji) {
      await interaction.reply({
        content: `${STATUS.ERROR} Emoji non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le modal pour les infos de la ressource (nom, catégorie, description)
    const modal = new ModalBuilder()
      .setCustomId(`new_resource_modal:${selectedEmoji.emoji}`)
      .setTitle("Créer un nouveau type de ressource");

    const nameInput = new TextInputBuilder()
      .setCustomId("resource_name")
      .setLabel("Nom de la ressource")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const categoryInput = new TextInputBuilder()
      .setCustomId("resource_category")
      .setLabel("Catégorie (base/transformé/science)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("resource_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    // Stocker l'emoji sélectionné dans l'interaction pour le modal handler
    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleResourceEmojiSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage du formulaire.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la soumission du modal de capacité
 */
export async function handleCapabilityModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("capability_name");
  const emojiTag = interaction.fields.getTextInputValue("capability_emoji_tag");
  const categoryRaw = interaction.fields.getTextInputValue("capability_category").toUpperCase();
  const costPARaw = interaction.fields.getTextInputValue("capability_cost_pa");
  const description = interaction.fields.getTextInputValue("capability_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Valider la catégorie
    const validCategories = ["HARVEST", "CRAFT", "SCIENCE", "SPECIAL"];
    if (!validCategories.includes(categoryRaw)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : HARVEST, CRAFT, SCIENCE ou SPECIAL.`,
      });
      return;
    }
    const category = categoryRaw as "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";

    // Valider le coût PA
    const costPA = parseInt(costPARaw, 10);
    if (isNaN(costPA) || costPA < 1 || costPA > 4) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Coût PA invalide. Utilisez un nombre entre 1 et 4.`,
      });
      return;
    }

    // Appeler l'API backend pour créer la capacité
    await apiService.capabilities.createCapability({
      name,
      emojiTag,
      category,
      costPA,
      description,
    });

    logger.info("Nouvelle capacité créée", {
      name,
      emojiTag,
      category,
      costPA,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité créée avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Tag emoji** : ${emojiTag}\n` +
        `**Catégorie** : ${category}\n` +
        `**Coût PA** : ${costPA}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création de la capacité", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}

/**
 * Gère la soumission du modal de ressource
 */
export async function handleResourceModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("resource_name");
  const category = interaction.fields.getTextInputValue("resource_category");
  const description = interaction.fields.getTextInputValue("resource_description") || undefined;

  // Extraire l'emoji du customId (format: new_resource_modal:emoji)
  const emoji = interaction.customId.split(":")[1];

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Valider la catégorie
    const validCategories = ["base", "transformé", "science"];
    if (!validCategories.includes(category)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Catégorie invalide. Utilisez : base, transformé ou science.`,
      });
      return;
    }

    // Appeler l'API backend pour créer le type de ressource
    await apiService.resources.createResourceType({
      name,
      emoji,
      category,
      description,
    });

    logger.info("Nouveau type de ressource créé", {
      name,
      emoji,
      category,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Type de ressource créé avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Emoji** : ${emoji}\n` +
        `**Catégorie** : ${category}\n` +
        (description ? `**Description** : ${description}` : ""),
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création du type de ressource", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}

/**
 * Gère le clic sur le bouton "Nouvel Objet"
 */
export async function handleNewObjectButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour l'objet
    const modal = new ModalBuilder()
      .setCustomId("new_object_modal")
      .setTitle("Créer un nouvel objet");

    const nameInput = new TextInputBuilder()
      .setCustomId("object_name")
      .setLabel("Nom de l'objet")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("object_description")
      .setLabel("Description (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewObjectButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal d'objet
 */
export async function handleObjectModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("object_name");
  const description = interaction.fields.getTextInputValue("object_description") || undefined;

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API backend pour créer l'objet
    const response = await apiService.objects.createObjectType({
      name,
      description,
    });

    logger.info("Nouvel objet créé", {
      name,
      objectId: response.id,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Créer des boutons pour ajouter des bonus
    const addSkillBonusButton = new ButtonBuilder()
      .setCustomId(`object_add_skill_bonus:${response.id}`)
      .setLabel("➕ Ajouter bonus Compétence")
      .setStyle(ButtonStyle.Primary);

    const addCapabilityBonusButton = new ButtonBuilder()
      .setCustomId(`object_add_capability_bonus:${response.id}`)
      .setLabel("➕ Ajouter bonus Capacité")
      .setStyle(ButtonStyle.Success);

    const addResourceConversionButton = new ButtonBuilder()
      .setCustomId(`object_add_resource_conversion:${response.id}`)
      .setLabel("➕ Conversion en Ressource")
      .setStyle(ButtonStyle.Secondary);

    const doneButton = new ButtonBuilder()
      .setCustomId(`object_done:${response.id}`)
      .setLabel("✅ Terminé")
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addSkillBonusButton,
      addCapabilityBonusButton
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addResourceConversionButton,
      doneButton
    );

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Objet créé avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        (description ? `**Description** : ${description}\n\n` : "\n") +
        `**ID** : \`${response.id}\`\n\n` +
        `Voulez-vous ajouter des bonus à cet objet ?`,
      components: [row1, row2],
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création de l'objet", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}

/**
 * Gère le clic sur le bouton "Nouvelle Compétence"
 */
export async function handleNewSkillButton(interaction: ButtonInteraction) {
  try {
    // Créer le modal pour la compétence
    const modal = new ModalBuilder()
      .setCustomId("new_skill_modal")
      .setTitle("Créer une nouvelle compétence");

    const nameInput = new TextInputBuilder()
      .setCustomId("skill_name")
      .setLabel("Nom de la compétence")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("skill_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewSkillButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de compétence
 */
export async function handleSkillModalSubmit(interaction: ModalSubmitInteraction) {
  const name = interaction.fields.getTextInputValue("skill_name");
  const description = interaction.fields.getTextInputValue("skill_description");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API backend pour créer la compétence
    await apiService.skills.createSkill({
      name,
      description,
    });

    logger.info("Nouvelle compétence créée", {
      name,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Compétence créée avec succès !**\n\n` +
        `**Nom** : ${name}\n` +
        `**Description** : ${description}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de la création de la compétence", {
      error: error instanceof Error ? error.message : error,
      name,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la création : ${errorMessage}`,
    });
  }
}

/**
 * Gère le bouton "Terminé" pour finir la configuration d'un objet
 */
export async function handleObjectDoneButton(interaction: ButtonInteraction) {
  try {
    await interaction.update({
      content: `${STATUS.SUCCESS} Configuration de l'objet terminée !`,
      components: [],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectDoneButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Catégorise les compétences selon leur thème
 */
function categorizeObjectSkills(skills: any[]) {
  const movement: any[] = [];
  const combat: any[] = [];
  const nature: any[] = [];
  const perception: any[] = [];

  const movementNames = ['Déplacement rapide', 'Escalader', 'Plonger', 'Orientation', 'Balisage'];
  const combatNames = ['Combat distance', 'Assommer', 'Pièges', 'Camouflage', 'Discrétion', 'Pistage'];
  const natureNames = ['Cultiver', 'Herboristerie', 'Apprivoisement', 'Réparer', 'Noeuds', 'Porter'];
  const perceptionNames = ['Vision nocturne', 'Vision lointaine', 'Communiquer'];

  skills.forEach((skill: any) => {
    if (movementNames.includes(skill.name)) {
      movement.push(skill);
    } else if (combatNames.includes(skill.name)) {
      combat.push(skill);
    } else if (natureNames.includes(skill.name)) {
      nature.push(skill);
    } else if (perceptionNames.includes(skill.name)) {
      perception.push(skill);
    } else {
      nature.push(skill);
    }
  });

  return { movement, combat, nature, perception };
}

/**
 * Gère le bouton "Ajouter compétence" pour un objet
 */
export async function handleObjectAddSkillBonusButton(interaction: ButtonInteraction) {
  try {
    const objectId = interaction.customId.split(':')[1];

    // Récupérer toutes les compétences disponibles
    const skills = await apiService.skills.getAllSkills();

    if (!skills || skills.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune compétence disponible.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Catégoriser les compétences
    const categories = categorizeObjectSkills(skills);

    // Créer les boutons de catégories
    const categoryButtons = [];

    if (categories.movement.length > 0) {
      categoryButtons.push({
        customId: `object_skill_category:${objectId}:movement`,
        label: `🏃 Déplacement (${categories.movement.length})`,
        style: 2,
      });
    }

    if (categories.combat.length > 0) {
      categoryButtons.push({
        customId: `object_skill_category:${objectId}:combat`,
        label: `⚔️ Combat & Survie (${categories.combat.length})`,
        style: 2,
      });
    }

    if (categories.nature.length > 0) {
      categoryButtons.push({
        customId: `object_skill_category:${objectId}:nature`,
        label: `🌿 Nature & Artisanat (${categories.nature.length})`,
        style: 2,
      });
    }

    if (categories.perception.length > 0) {
      categoryButtons.push({
        customId: `object_skill_category:${objectId}:perception`,
        label: `👁️ Perception & Social (${categories.perception.length})`,
        style: 2,
      });
    }

    const buttonRow = new (ActionRowBuilder as any)().addComponents(
      categoryButtons.map((btn: any) => new ButtonBuilder()
        .setCustomId(btn.customId)
        .setLabel(btn.label)
        .setStyle(btn.style))
    );

    await interaction.reply({
      content: "**Ajouter une compétence à l'objet**\n\nChoisissez une catégorie :",
      components: [buttonRow],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectAddSkillBonusButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors du chargement des compétences.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère le clic sur une catégorie de compétence pour un objet
 */
export async function handleObjectSkillCategoryButton(interaction: ButtonInteraction) {
  try {
    const parts = interaction.customId.split(':');
    const objectId = parts[1];
    const category = parts[2];

    // Récupérer toutes les compétences disponibles
    const skills = await apiService.skills.getAllSkills();

    if (!skills || skills.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune compétence disponible.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Catégoriser et filtrer
    const categories = categorizeObjectSkills(skills);
    const categorySkills = categories[category as keyof typeof categories] || [];

    if (categorySkills.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune compétence dans cette catégorie.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer la liste déroulante des compétences
    const skillOptions = categorySkills.map((skill: any) => ({
      label: skill.name,
      value: skill.id,
      description: skill.description ? skill.description.substring(0, 100) : undefined,
    }));

    const skillSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId(`object_skill_confirm:${objectId}`)
      .setPlaceholder("Sélectionnez une compétence")
      .addOptions(skillOptions);

    const row = new (ActionRowBuilder as any)().addComponents(skillSelect);

    await interaction.reply({
      content: `**Sélectionnez une compétence à ajouter** (${category})`,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectSkillCategoryButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors du chargement des compétences.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection finale d'une compétence pour l'ajouter directement à l'objet
 */
export async function handleObjectSkillSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    const objectId = interaction.customId.split(':')[1];
    const skillId = interaction.values[0];

    // Récupérer l'info de la compétence sélectionnée
    const skills = await apiService.skills.getAllSkills();
    const selectedSkill = skills.find((s: any) => s.id === skillId);

    if (!selectedSkill) {
      await interaction.reply({
        content: `${STATUS.ERROR} Compétence non trouvée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Ajouter directement la compétence (sans modal)
    await apiService.objects.addSkillBonus(objectId, {
      skillId,
      bonusValue: 1, // Valeur par défaut (l'objet "donne" simplement la compétence)
    });

    logger.info("Compétence ajoutée à l'objet", {
      objectId,
      skillId,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.SUCCESS} Compétence **${selectedSkill.name}** ajoutée à l'objet !`,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectSkillSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout de la compétence.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la soumission du modal de bonus de compétence pour un objet
 */
export async function handleObjectSkillBonusModalSubmit(interaction: ModalSubmitInteraction) {
  // Extraire objectId et skillId du customId (format: object_skill_bonus_modal:objectId:skillId)
  const parts = interaction.customId.split(':');
  const objectId = parts[1];
  const skillId = parts[2];
  const bonusValueRaw = interaction.fields.getTextInputValue("bonus_value");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const bonusValue = parseInt(bonusValueRaw, 10);
    if (isNaN(bonusValue)) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Valeur du bonus invalide. Utilisez un nombre.`,
      });
      return;
    }

    // Appeler l'API backend pour ajouter le bonus
    await apiService.objects.addSkillBonus(objectId, {
      skillId,
      bonusValue,
    });

    logger.info("Bonus de compétence ajouté à l'objet", {
      objectId,
      skillId,
      bonusValue,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} Bonus de compétence ajouté avec succès !`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de l'ajout du bonus de compétence", {
      error: error instanceof Error ? error.message : error,
      objectId,
      skillId,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout : ${errorMessage}`,
    });
  }
}

/**
 * Gère le bouton "Ajouter bonus Capacité" pour un objet
 */
export async function handleObjectAddCapabilityBonusButton(interaction: ButtonInteraction) {
  try {
    const objectId = interaction.customId.split(':')[1];

    // Récupérer toutes les capacités disponibles
    const capabilities = await apiService.capabilities.getAllCapabilities();

    if (!capabilities || capabilities.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune capacité disponible.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer la liste déroulante des capacités
    const capabilityOptions = capabilities.map((cap: any) => ({
      label: cap.name,
      value: String(cap.id),
      description: cap.description ? cap.description.substring(0, 100) : undefined,
    }));

    const capabilitySelect = new (StringSelectMenuBuilder as any)()
      .setCustomId(`object_capability_bonus_select:${objectId}`)
      .setPlaceholder("Sélectionnez une capacité")
      .addOptions(capabilityOptions);

    const row = new (ActionRowBuilder as any)().addComponents(capabilitySelect);

    await interaction.reply({
      content: "**Ajouter un bonus de capacité à l'objet**\n\nChoisissez une capacité :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectAddCapabilityBonusButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors du chargement des capacités.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection d'une capacité pour ajouter un bonus à un objet
 */
export async function handleObjectCapabilityBonusSelect(interaction: StringSelectMenuInteraction) {
  const objectId = interaction.customId.split(':')[1];
  const capabilityId = interaction.values[0];

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API backend pour ajouter le bonus
    // Note: le backend détermine automatiquement le type de bonus basé sur la capacité
    await apiService.objects.addCapabilityBonus(objectId, {
      capabilityId,
    });

    logger.info("Bonus de capacité ajouté à l'objet", {
      objectId,
      capabilityId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité ajoutée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de l'ajout du bonus de capacité", {
      error: error instanceof Error ? error.message : error,
      objectId,
      capabilityId,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout : ${errorMessage}`,
    });
  }
}

/**
 * Gère le bouton "Conversion en Ressource" pour un objet
 * Affiche d'abord un menu de sélection des ressources disponibles
 */
export async function handleObjectAddResourceConversionButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const objectId = interaction.customId.split(':')[1];

    // Récupérer toutes les ressources disponibles
    const resources = await apiService.resources.getAllResourceTypes();

    if (!resources || resources.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucun type de ressource disponible. Créez d'abord des ressources.`,
      });
      return;
    }

    // Créer la liste déroulante des ressources
    const resourceOptions = resources.map((resource: any) => ({
      label: `${resource.emoji} ${resource.name}`,
      value: String(resource.id),
      description: resource.category ? `Catégorie: ${resource.category}` : undefined,
    }));

    const resourceSelect = new StringSelectMenuBuilder()
      .setCustomId(`object_resource_select:${objectId}`)
      .setPlaceholder("Sélectionnez une ressource")
      .addOptions(resourceOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(resourceSelect);

    await interaction.editReply({
      content: "**Conversion en ressource**\n\n**Étape 1:** Sélectionnez une ressource",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectAddResourceConversionButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors du chargement des ressources.`,
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.editReply({
        content: `${STATUS.ERROR} Erreur lors du chargement des ressources.`,
      });
    }
  }
}

/**
 * Gère la sélection d'une ressource pour la conversion
 */
export async function handleObjectResourceSelect(interaction: StringSelectMenuInteraction) {
  try {
    const parts = interaction.customId.split(':');
    const objectId = parts[1];
    const resourceTypeId = interaction.values[0];

    // Créer le modal pour la quantité
    const modal = new ModalBuilder()
      .setCustomId(`object_resource_conversion_modal:${objectId}:${resourceTypeId}`)
      .setTitle("Ajouter une conversion en ressource");

    const quantityInput = new TextInputBuilder()
      .setCustomId("quantity")
      .setLabel("Quantité de ressource produite")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("1")
      .setMinLength(1)
      .setMaxLength(5);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleObjectResourceSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de la sélection de la ressource.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la soumission du modal de conversion en ressource pour un objet
 * Format du customId : object_resource_conversion_modal:objectId:resourceTypeId
 */
export async function handleObjectResourceConversionModalSubmit(interaction: ModalSubmitInteraction) {
  const parts = interaction.customId.split(':');
  const objectId = parts[1];
  const resourceTypeId = parts[2];
  const quantityRaw = interaction.fields.getTextInputValue("quantity");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const quantity = parseInt(quantityRaw, 10);
    if (isNaN(quantity) || quantity <= 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Quantité invalide. Utilisez un nombre positif.`,
      });
      return;
    }

    // Appeler l'API backend pour ajouter la conversion
    await apiService.objects.addResourceConversion(objectId, {
      resourceTypeId,
      quantity,
    });

    logger.info("Conversion en ressource ajoutée à l'objet", {
      objectId,
      resourceTypeId,
      quantity,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Conversion en ressource ajoutée avec succès !**\n\n**Ressource:** ID ${resourceTypeId}\n**Quantité:** ${quantity}`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de l'ajout de la conversion en ressource", {
      error: error instanceof Error ? error.message : error,
      objectId,
      resourceTypeId,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout : ${errorMessage}`,
    });
  }
}

/**
 * Gère l'annulation de suppression
 */
export async function handleCancelDeleteButton(interaction: ButtonInteraction) {
  try {
    await interaction.update({
      content: `${STATUS.SUCCESS} Suppression annulée.`,
      components: [],
    });
  } catch (error) {
    logger.error("Erreur dans handleCancelDeleteButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère le menu des emojis (depuis /new-element-admin)
 */
export async function handleEmojiMenuButton(interaction: ButtonInteraction) {
  try {
    const addButton = new ButtonBuilder()
      .setCustomId("emoji_add")
      .setLabel("➕ Ajouter")
      .setStyle(ButtonStyle.Success);

    const listButton = new ButtonBuilder()
      .setCustomId("emoji_list")
      .setLabel("📋 Lister")
      .setStyle(ButtonStyle.Primary);

    const removeButton = new ButtonBuilder()
      .setCustomId("emoji_remove")
      .setLabel("🗑️ Supprimer")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addButton,
      listButton,
      removeButton
    );

    await interaction.update({
      content: "**Gestion des Emojis**\n\nSélectionnez une action :",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiMenuButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère l'ajout d'un emoji - Affiche d'abord un select menu pour choisir le type
 */
export async function handleEmojiAddButton(interaction: ButtonInteraction) {
  try {
    const { StringSelectMenuBuilder, ActionRowBuilder } = await import("discord.js");

    const typeSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId("emoji_type_select")
      .setPlaceholder("Sélectionnez une catégorie")
      .addOptions([
        { label: "Ressource", value: "resource", emoji: "📦" },
        { label: "Capacité", value: "capability", emoji: "✨" },
        { label: "Objet", value: "object", emoji: "🎒" },
        { label: "Compétence", value: "skill", emoji: "⚔️" },
        { label: "Action", value: "action", emoji: "➕" },
        { label: "Custom", value: "custom", emoji: "🎨" },
      ]);

    const row = new (ActionRowBuilder as any)().addComponents(
      typeSelect
    );

    await interaction.reply({
      content: "**Ajouter un emoji**\n\nSélectionnez d'abord la catégorie :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiAddButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection du type d'emoji (depuis le select menu)
 */
export async function handleEmojiTypeSelect(
  interaction: any
) {
  try {
    const selectedType = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`emoji_add_modal:${selectedType}`)
      .setTitle(`Ajouter un emoji - ${selectedType}`);

    const keyInput = new TextInputBuilder()
      .setCustomId("emoji_key")
      .setLabel('Clé (ex: WOOD_OAK)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiInput = new TextInputBuilder()
      .setCustomId("emoji_emoji")
      .setLabel('Emoji (ex: 🌲)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(keyInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleEmojiTypeSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la soumission du modal d'ajout d'emoji
 */
export async function handleEmojiAddModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Extraire le type du customId (format: emoji_add_modal:resource)
    const type = interaction.customId.split(':')[1] || 'custom';
    const key = interaction.fields.getTextInputValue("emoji_key");
    const emoji = interaction.fields.getTextInputValue("emoji_emoji");

    // Valider que c'est un emoji
    const emojiRegex = /^(\p{Emoji})$/u;
    if (!emojiRegex.test(emoji.trim())) {
      await interaction.editReply({
        content: `${STATUS.ERROR} "${emoji}" n'est pas un emoji valide. Utilisez un seul emoji.`,
      });
      return;
    }

    // Créer via l'API
    await apiService.emojis.createEmoji(type, key, emoji);

    await interaction.editReply({
      content: `${STATUS.SUCCESS} Emoji ajouté avec succès !\n\n**Type:** ${type}\n**Clé:** ${key}\n**Emoji:** ${emoji}`,
    });

    // Recharger le cache
    const { emojiCache } = await import("../../services/emoji-cache.js");
    await emojiCache.refresh();
  } catch (error) {
    logger.error("Erreur dans handleEmojiAddModal", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'ajout de l'emoji: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
    });
  }
}

/**
 * Gère l'affichage de la liste des emojis
 */
export async function handleEmojiListButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const emojis = await apiService.emojis.listEmojis();

    if (!emojis || emojis.length === 0) {
      await interaction.editReply({
        content: "Aucun emoji configuré pour le moment.",
      });
      return;
    }

    // Grouper par type
    const byType: Record<string, Array<{ key: string; emoji: string }>> = {};
    for (const config of emojis) {
      if (!byType[config.type]) {
        byType[config.type] = [];
      }
      byType[config.type].push({
        key: config.key,
        emoji: config.emoji,
      });
    }

    // Créer le contenu
    let content = "**Emojis Disponibles**\n\n";
    for (const [type, items] of Object.entries(byType)) {
      content += `**${type.toUpperCase()}**\n`;
      for (const item of items) {
        content += `  ${item.emoji} \`${item.key}\`\n`;
      }
      content += "\n";
    }

    await interaction.editReply({
      content,
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiListButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage de la liste.`,
    });
  }
}

/**
 * Gère la suppression d'un emoji - Affiche d'abord un select menu par catégorie
 */
export async function handleEmojiRemoveButton(interaction: ButtonInteraction) {
  try {
    const { StringSelectMenuBuilder } = await import("discord.js");

    const typeSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId("emoji_remove_type_select")
      .setPlaceholder("Sélectionnez une catégorie")
      .addOptions([
        { label: "Ressource", value: "resource", emoji: "📦" },
        { label: "Capacité", value: "capability", emoji: "✨" },
        { label: "Objet", value: "object", emoji: "🎒" },
        { label: "Compétence", value: "skill", emoji: "⚔️" },
        { label: "Action", value: "action", emoji: "➕" },
        { label: "Custom", value: "custom", emoji: "🎨" },
      ]);

    const row = new (ActionRowBuilder as any)().addComponents(typeSelect);

    await interaction.reply({
      content: "**Supprimer un emoji**\n\nSélectionnez d'abord la catégorie :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiRemoveButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la sélection du type d'emoji pour la suppression
 */
export async function handleEmojiRemoveTypeSelect(interaction: any) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const selectedType = interaction.values[0];

    // Récupérer tous les emojis du type sélectionné
    const allEmojis = await apiService.emojis.listEmojis(selectedType);

    if (!allEmojis || allEmojis.length === 0) {
      await interaction.editReply({
        content: `Aucun emoji trouvé pour la catégorie **${selectedType}**.`,
      });
      return;
    }

    // Créer le select menu avec les emojis de cette catégorie
    const { StringSelectMenuBuilder } = await import("discord.js");

    const emojiSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId(`emoji_remove_select:${selectedType}`)
      .setPlaceholder("Sélectionnez un emoji à supprimer")
      .addOptions(
        allEmojis.map((e: any) => ({
          label: e.key,
          value: e.key,
          emoji: e.emoji,
          description: e.emoji,
        }))
      );

    const row = new (ActionRowBuilder as any)().addComponents(emojiSelect);

    await interaction.editReply({
      content: `**Supprimer un emoji**\n\nCatégorie: **${selectedType}**\n\nSélectionnez l'emoji à supprimer :`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiRemoveTypeSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors du chargement des emojis.`,
    });
  }
}

/**
 * Gère la sélection d'un emoji spécifique pour suppression
 */
export async function handleEmojiRemoveSelect(interaction: any) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const selectedKey = interaction.values[0];
    const customIdParts = interaction.customId.split(':');
    const type = customIdParts[1];

    // Afficher une confirmation avant suppression
    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_emoji_${type}_${selectedKey}`)
      .setLabel("✅ Confirmer suppression")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_delete_emoji")
      .setLabel("❌ Annuler")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirmButton,
      cancelButton
    );

    await interaction.editReply({
      content: `**Êtes-vous sûr de vouloir supprimer cet emoji ?**\n\n**Clé:** ${selectedKey}\n\nLes ressources qui utilisent cet emoji afficheront le placeholder 📦.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiRemoveSelect", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la suppression.`,
    });
  }
}

/**
 * Gère la confirmation de suppression d'emoji
 */
export async function handleEmojiDeleteConfirmation(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const customId = interaction.customId;
    const parts = customId.split('_').slice(3); // Remove "confirm_delete_emoji_"
    const type = parts[0];
    const key = parts.slice(1).join('_');

    // Supprimer via l'API
    await apiService.emojis.deleteEmoji(type, key);

    await interaction.editReply({
      content: `${STATUS.SUCCESS} Emoji supprimé avec succès. Les ressources afficheront le placeholder 📦.`,
    });

    // Recharger le cache
    const { emojiCache } = await import("../../services/emoji-cache.js");
    await emojiCache.refresh();
  } catch (error) {
    logger.error("Erreur dans handleEmojiDeleteConfirmation", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors de la suppression de l'emoji.`,
    });
  }
}

/**
 * Gère l'annulation de suppression d'emoji
 */
export async function handleEmojiDeleteCancellation(interaction: ButtonInteraction) {
  try {
    await interaction.update({
      content: `${STATUS.SUCCESS} Suppression annulée.`,
      components: [],
    });
  } catch (error) {
    logger.error("Erreur dans handleEmojiDeleteCancellation", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

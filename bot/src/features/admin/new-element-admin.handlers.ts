import {
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
import { STATUS } from "../../constants/emojis";

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

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      resourceButton,
      objectButton,
      skillButton,
      capabilityButton
    );

    await interaction.reply({
      content: "**Gestion des éléments**\n\nSélectionnez une catégorie :",
      components: [row],
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
    // Créer le modal pour la ressource
    const modal = new ModalBuilder()
      .setCustomId("new_resource_modal")
      .setTitle("Créer un nouveau type de ressource");

    const nameInput = new TextInputBuilder()
      .setCustomId("resource_name")
      .setLabel("Nom de la ressource")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const emojiInput = new TextInputBuilder()
      .setCustomId("resource_emoji")
      .setLabel("Emoji de la ressource (ex: 🌲)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

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
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleNewResourceButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
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
  const emoji = interaction.fields.getTextInputValue("resource_emoji");
  const category = interaction.fields.getTextInputValue("resource_category");
  const description = interaction.fields.getTextInputValue("resource_description") || undefined;

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
 * Gère le bouton "Ajouter bonus Compétence" pour un objet
 */
export async function handleObjectAddSkillBonusButton(interaction: ButtonInteraction) {
  try {
    const objectId = interaction.customId.split(':')[1];

    // Créer le modal pour ajouter un bonus de compétence
    const modal = new ModalBuilder()
      .setCustomId(`object_skill_bonus_modal:${objectId}`)
      .setTitle("Ajouter un bonus de compétence");

    const skillIdInput = new TextInputBuilder()
      .setCustomId("skill_id")
      .setLabel("ID de la compétence")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Collez l'ID de la compétence");

    const bonusValueInput = new TextInputBuilder()
      .setCustomId("bonus_value")
      .setLabel("Valeur du bonus (ex: 1, 2, 3...)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("1");

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(skillIdInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bonusValueInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleObjectAddSkillBonusButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de bonus de compétence pour un objet
 */
export async function handleObjectSkillBonusModalSubmit(interaction: ModalSubmitInteraction) {
  const objectId = interaction.customId.split(':')[1];
  const skillId = interaction.fields.getTextInputValue("skill_id");
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

    // Créer le modal pour ajouter un bonus de capacité
    const modal = new ModalBuilder()
      .setCustomId(`object_capability_bonus_modal:${objectId}`)
      .setTitle("Ajouter un bonus de capacité");

    const capabilityIdInput = new TextInputBuilder()
      .setCustomId("capability_id")
      .setLabel("ID de la capacité")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Collez l'ID de la capacité");

    const bonusValueInput = new TextInputBuilder()
      .setCustomId("bonus_value")
      .setLabel("Valeur du bonus (ex: 1, 2, 3...)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("1");

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(capabilityIdInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bonusValueInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleObjectAddCapabilityBonusButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de bonus de capacité pour un objet
 */
export async function handleObjectCapabilityBonusModalSubmit(interaction: ModalSubmitInteraction) {
  const objectId = interaction.customId.split(':')[1];
  const capabilityId = interaction.fields.getTextInputValue("capability_id");
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
    await apiService.objects.addCapabilityBonus(objectId, {
      capabilityId,
      bonusValue,
    });

    logger.info("Bonus de capacité ajouté à l'objet", {
      objectId,
      capabilityId,
      bonusValue,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} Bonus de capacité ajouté avec succès !`,
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
 */
export async function handleObjectAddResourceConversionButton(interaction: ButtonInteraction) {
  try {
    const objectId = interaction.customId.split(':')[1];

    // Créer le modal pour ajouter une conversion en ressource
    const modal = new ModalBuilder()
      .setCustomId(`object_resource_conversion_modal:${objectId}`)
      .setTitle("Ajouter une conversion en ressource");

    const resourceTypeIdInput = new TextInputBuilder()
      .setCustomId("resource_type_id")
      .setLabel("ID du type de ressource")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Collez l'ID du type de ressource");

    const quantityInput = new TextInputBuilder()
      .setCustomId("quantity")
      .setLabel("Quantité de ressource produite")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("1");

    const rows = [
      new ActionRowBuilder<TextInputBuilder>().addComponents(resourceTypeIdInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput),
    ];

    modal.addComponents(...rows);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur dans handleObjectAddResourceConversionButton", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });
  }
}

/**
 * Gère la soumission du modal de conversion en ressource pour un objet
 */
export async function handleObjectResourceConversionModalSubmit(interaction: ModalSubmitInteraction) {
  const objectId = interaction.customId.split(':')[1];
  const resourceTypeId = interaction.fields.getTextInputValue("resource_type_id");
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
      content: `${STATUS.SUCCESS} Conversion en ressource ajoutée avec succès !`,
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

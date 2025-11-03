/* eslint-disable @typescript-eslint/no-explicit-any */
import {
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
import { apiService } from "../../../services/api";
import { logger } from "../../../services/logger";
import { STATUS } from "../../../constants/emojis";

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
      .setLabel(`${STATUS.SUCCESS} Terminé`)
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

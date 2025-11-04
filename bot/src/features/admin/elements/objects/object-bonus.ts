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
 * Catégorise les compétences selon leurs catégories
 */
function categorizeObjectSkills(skills: any[]) {
  const movement: any[] = [];
  const combat: any[] = [];
  const nature: any[] = [];
  const perception: any[] = [];

  const movementKeywords = ['course', 'saut', 'grimpe', 'nage', 'escalade', 'mouvement', 'agilité'];
  const combatKeywords = ['combat', 'arme', 'défense', 'attaque', 'esquive', 'tir', 'survie'];
  const natureKeywords = ['chasse', 'cueillette', 'nature', 'crafting', 'fabrication', 'cuisine', 'herbe'];
  const perceptionKeywords = ['perception', 'discrétion', 'détection', 'observation', 'social', 'persuasion', 'marchandage'];

  skills.forEach(skill => {
    const nameLower = skill.name.toLowerCase();
    const descriptionLower = (skill.description || '').toLowerCase();

    if (movementKeywords.some(kw => nameLower.includes(kw) || descriptionLower.includes(kw))) {
      movement.push(skill);
    } else if (combatKeywords.some(kw => nameLower.includes(kw) || descriptionLower.includes(kw))) {
      combat.push(skill);
    } else if (natureKeywords.some(kw => nameLower.includes(kw) || descriptionLower.includes(kw))) {
      nature.push(skill);
    } else if (perceptionKeywords.some(kw => nameLower.includes(kw) || descriptionLower.includes(kw))) {
      perception.push(skill);
    } else {
      perception.push(skill); // Par défaut, classé en perception
    }
  });

  return { movement, combat, nature, perception };
}

/**
 * Gère le clic sur le bouton de gestion des compétences d'un objet
 */
export async function handleModifyObjectSkillsButton(interaction: ButtonInteraction) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object) {
      await interaction.reply({
        content: `${STATUS.ERROR} Objet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer toutes les compétences disponibles
    const skills = await apiService.skills.getAllSkills();

    if (!skills || skills.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune compétence disponible.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les compétences actuelles de l'objet
    const currentSkillIds = new Set((object.skillBonuses || []).map((sb: any) => String(sb.skill.id)));

    // Afficher les compétences actuelles et options
    let content = `## 🎯 Compétences de ${object.name}\n\n`;

    if (object.skillBonuses && object.skillBonuses.length > 0) {
      content += `**Compétences actuelles :**\n`;
      content += object.skillBonuses
        .map((sb: any) => `• **${sb.skill.name}**\n  ${sb.skill.description ? sb.skill.description.substring(0, 50) + '...' : '*Pas de description*'}`)
        .join('\n\n');
      content += `\n\n`;
    } else {
      content += `*Aucune compétence assignée*\n\n`;
    }

    content += `Que voulez-vous faire ?`;

    // Créer les boutons d'action
    const actionButtons = [
      new ButtonBuilder()
        .setCustomId(`object_skill_add:${objectId}`)
        .setLabel('➕ Ajouter une compétence')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`object_skill_remove:${objectId}`)
        .setLabel('➖ Retirer une compétence')
        .setStyle(ButtonStyle.Danger)
        .setDisabled((object.skillBonuses || []).length === 0),
    ];

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(actionButtons);

    await interaction.reply({
      content,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleModifyObjectSkillsButton", {
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
 * Gère le clic sur le bouton de gestion des capacités d'un objet
 */
export async function handleModifyObjectCapabilitiesButton(interaction: ButtonInteraction) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object) {
      await interaction.reply({
        content: `${STATUS.ERROR} Objet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer toutes les capacités disponibles
    const capabilities = await apiService.capabilities.getAllCapabilities();

    if (!capabilities || capabilities.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune capacité disponible.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Afficher les capacités actuelles et options
    let content = `## ⚡ Capacités de ${object.name}\n\n`;

    if (object.capacityBonuses && object.capacityBonuses.length > 0) {
      content += `**Capacités actuelles :**\n`;
      content += object.capacityBonuses
        .map((cb: any) => `• **${cb.capability.name}** (${cb.capability.emojiTag})\n  Type: ${cb.bonusType || 'standard'}`)
        .join('\n\n');
      content += `\n\n`;
    } else {
      content += `*Aucune capacité assignée*\n\n`;
    }

    content += `Que voulez-vous faire ?`;

    // Créer les boutons d'action
    const actionButtons = [
      new ButtonBuilder()
        .setCustomId(`object_capability_add:${objectId}`)
        .setLabel('➕ Ajouter une capacité')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`object_capability_remove:${objectId}`)
        .setLabel('➖ Retirer une capacité')
        .setStyle(ButtonStyle.Danger)
        .setDisabled((object.capacityBonuses || []).length === 0),
    ];

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(actionButtons);

    await interaction.reply({
      content,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleModifyObjectCapabilitiesButton", {
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
 * Gère l'ajout d'une compétence à un objet (affiche catégories)
 */
export async function handleObjectSkillAddButton(interaction: ButtonInteraction) {
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
        customId: `object_skill_category_add:${objectId}:movement`,
        label: `🏃 Déplacement (${categories.movement.length})`,
        style: 2,
      });
    }

    if (categories.combat.length > 0) {
      categoryButtons.push({
        customId: `object_skill_category_add:${objectId}:combat`,
        label: `⚔️ Combat & Survie (${categories.combat.length})`,
        style: 2,
      });
    }

    if (categories.nature.length > 0) {
      categoryButtons.push({
        customId: `object_skill_category_add:${objectId}:nature`,
        label: `🌿 Nature & Artisanat (${categories.nature.length})`,
        style: 2,
      });
    }

    if (categories.perception.length > 0) {
      categoryButtons.push({
        customId: `object_skill_category_add:${objectId}:perception`,
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
    logger.error("Erreur dans handleObjectSkillAddButton", {
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
 * Gère la sélection de catégorie pour l'ajout de compétence à un objet
 */
export async function handleObjectSkillCategoryAddButton(interaction: ButtonInteraction) {
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
      value: String(skill.id),
      description: skill.description ? skill.description.substring(0, 100) : undefined,
    }));

    const skillSelect = new (StringSelectMenuBuilder as any)()
      .setCustomId(`object_skill_confirm_add:${objectId}`)
      .setPlaceholder("Sélectionnez une compétence")
      .addOptions(skillOptions);

    const row = new (ActionRowBuilder as any)().addComponents(skillSelect);

    await interaction.reply({
      content: `**Sélectionnez une compétence à ajouter** (${category})`,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectSkillCategoryAddButton", {
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
 * Gère la confirmation d'ajout de compétence à un objet
 */
export async function handleObjectSkillAddConfirm(interaction: any) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const skillId = interaction.values[0];

    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API pour ajouter la compétence
    await apiService.objects.addSkillBonus(String(objectId), {
      skillId: skillId,
      bonusValue: 1, // Valeur par défaut (l'objet donne simplement la compétence)
    });

    logger.info("Compétence ajoutée à l'objet", {
      objectId,
      skillId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Compétence ajoutée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de l'ajout de compétence à l'objet", {
      error: error instanceof Error ? error.message : error,
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
 * Gère le retrait de compétence d'un objet
 */
export async function handleObjectSkillRemoveButton(interaction: ButtonInteraction) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object || !object.skillBonuses || object.skillBonuses.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Cet objet n'a aucune compétence assignée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer la liste déroulante des compétences à retirer
    const skillOptions = object.skillBonuses.map((sb: any) => ({
      label: sb.skill.name,
      value: String(sb.id),
      description: sb.skill.description ? sb.skill.description.substring(0, 100) : undefined,
    }));

    const skillSelect = new StringSelectMenuBuilder()
      .setCustomId(`object_skill_remove_select:${objectId}`)
      .setPlaceholder("Sélectionnez une compétence à retirer")
      .addOptions(skillOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(skillSelect);

    await interaction.reply({
      content: `**Sélectionnez une compétence à retirer**`,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectSkillRemoveButton", {
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
 * Gère la confirmation de retrait de compétence d'un objet
 */
export async function handleObjectSkillRemoveConfirm(interaction: any) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const skillBonusId = parseInt(interaction.values[0], 10);

    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API pour retirer la compétence via DELETE
    await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/objects/${objectId}/skill-bonus/${skillBonusId}`, {
      method: 'DELETE',
    });

    logger.info("Compétence retirée de l'objet", {
      objectId,
      skillBonusId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Compétence retirée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors du retrait de compétence de l'objet", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors du retrait : ${errorMessage}`,
    });
  }
}

/**
 * Gère l'ajout d'une capacité à un objet (affiche liste)
 */
export async function handleObjectCapabilityAddButton(interaction: ButtonInteraction) {
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

    const capabilitySelect = new StringSelectMenuBuilder()
      .setCustomId(`object_capability_confirm_add:${objectId}`)
      .setPlaceholder("Sélectionnez une capacité")
      .addOptions(capabilityOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(capabilitySelect);

    await interaction.reply({
      content: "**Ajouter une capacité à l'objet**\n\nChoisissez une capacité :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectCapabilityAddButton", {
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
 * Gère la confirmation d'ajout de capacité à un objet
 */
export async function handleObjectCapabilityAddConfirm(interaction: any) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const capabilityId = interaction.values[0];

    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API pour ajouter la capacité
    await apiService.objects.addCapabilityBonus(String(objectId), {
      capabilityId: capabilityId,
    });

    logger.info("Capacité ajoutée à l'objet", {
      objectId,
      capabilityId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité ajoutée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors de l'ajout de capacité à l'objet", {
      error: error instanceof Error ? error.message : error,
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
 * Gère le retrait de capacité d'un objet
 */
export async function handleObjectCapabilityRemoveButton(interaction: ButtonInteraction) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const allObjects = await apiService.objects.getAllObjectTypes();
    const object = allObjects.find((o: any) => o.id === objectId);

    if (!object || !object.capacityBonuses || object.capacityBonuses.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Cet objet n'a aucune capacité assignée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer la liste déroulante des capacités à retirer
    const capabilityOptions = object.capacityBonuses.map((cb: any) => ({
      label: cb.capability.name,
      value: String(cb.id),
      description: cb.capability.description ? cb.capability.description.substring(0, 100) : undefined,
    }));

    const capabilitySelect = new StringSelectMenuBuilder()
      .setCustomId(`object_capability_remove_select:${objectId}`)
      .setPlaceholder("Sélectionnez une capacité à retirer")
      .addOptions(capabilityOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(capabilitySelect);

    await interaction.reply({
      content: `**Sélectionnez une capacité à retirer**`,
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur dans handleObjectCapabilityRemoveButton", {
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
 * Gère la confirmation de retrait de capacité d'un objet
 */
export async function handleObjectCapabilityRemoveConfirm(interaction: any) {
  try {
    const objectId = parseInt(interaction.customId.split(':')[1], 10);
    const capabilityBonusId = parseInt(interaction.values[0], 10);

    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Appeler l'API pour retirer la capacité via DELETE
    await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/objects/${objectId}/capability-bonus/${capabilityBonusId}`, {
      method: 'DELETE',
    });

    logger.info("Capacité retirée de l'objet", {
      objectId,
      capabilityBonusId,
      userId: interaction.user.id,
    });

    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Capacité retirée avec succès !**`,
    });
  } catch (error: any) {
    logger.error("Erreur lors du retrait de capacité de l'objet", {
      error: error instanceof Error ? error.message : error,
      userId: interaction.user.id,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Erreur inconnue";

    await interaction.editReply({
      content: `${STATUS.ERROR} Erreur lors du retrait : ${errorMessage}`,
    });
  }
}

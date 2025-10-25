import { createInfoEmbed, createSuccessEmbed, createErrorEmbed, createWarningEmbed } from "../../utils/embeds";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  createExpeditionModifyModal,
  createExpeditionDurationModal,
  createExpeditionResourceAddModal,
  createExpeditionResourceModifyModal
} from "../../modals/expedition-modals";
import { ExpeditionAPIService } from "../../services/api/expedition-api.service";
import { Character, Expedition } from "../../types/entities";
import { apiService } from "../../services/api";

import { replyEphemeral, replyError } from "../../utils/interaction-helpers.js";
import { validateCharacterExists, validateCharacterAlive } from "../../utils/character-validation.js";
import { logger } from "../../services/logger";
import {
  handleExpeditionAdminResourceAddSelect,
  handleExpeditionResourceAddModal,
  handleExpeditionAdminResourceModifySelect,
  handleExpeditionResourceModifyModal,
  handleExpeditionAdminResourceDeleteSelect,
  handleExpeditionAdminResourceDeleteConfirm,
  handleExpeditionAdminResourceDeleteCancel,
  handleExpeditionDurationModal
} from "./expedition-admin-resource-handlers";

export async function handleExpeditionAdminCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Get all expeditions (including returned ones for admin)
    const expeditions = await apiService.expeditions.getAllExpeditions(true) as Expedition[];

    if (!expeditions || expeditions.length === 0) {
      await replyEphemeral(interaction, "❌ Aucune expédition trouvée.");
      return;
    }

    // Filter expeditions that have at least one member
    const expeditionsWithMembers = expeditions.filter(
      (exp: Expedition) => exp.members && exp.members.length > 0
    );

    if (expeditionsWithMembers.length === 0) {
      await replyEphemeral(interaction, "❌ Aucune expédition avec membres trouvée.");
      return;
    }

    // Create dropdown menu with expeditions
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_admin_select")
      .setPlaceholder("Sélectionnez une expédition à gérer")
      .addOptions(
        expeditionsWithMembers.map((exp: Expedition) => ({
          label: `${exp.name} (${exp.status})`,
          description: `Membres: ${exp.members?.length || 0}, Stock: ${exp.foodStock}`,
          value: exp.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = createWarningEmbed(
      "🛠️ Administration des Expéditions",
      `**${expeditionsWithMembers.length}** expéditions avec membres trouvées`
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    });

  } catch (error) {
    logger.error("Error in expedition admin command:", { error });
      await replyEphemeral(interaction, "❌ Une erreur est survenue lors de la récupération des expéditions.");
  }
}

export async function handleExpeditionAdminSelect(interaction: any) {
  try {
    const expeditionId = interaction.values[0];

    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await replyEphemeral(interaction, "❌ Expédition non trouvée.");
      return;
    }

    // Create admin buttons
    const buttonRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_admin_modify_duration_${expeditionId}`)
          .setLabel("Modifier durée")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`expedition_admin_resources_${expeditionId}`)
          .setLabel("Gérer ressources")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`expedition_admin_members_${expeditionId}`)
          .setLabel("Gérer membres")
          .setStyle(ButtonStyle.Secondary)
      );

    const buttonRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_admin_return_${expeditionId}`)
          .setLabel("Retour forcé")
          .setStyle(ButtonStyle.Danger)
      );

    // Create embed with expedition details
    const embed = createWarningEmbed(
      `🛠️ ${expedition.name}`,
      "Détails de l'expédition"
    ).addFields(
      { name: "📦 Stock de nourriture", value: `${expedition.foodStock}`, inline: true },
      { name: "⏱️ Durée", value: `${expedition.duration}h`, inline: true },
      { name: "📍 Statut", value: getStatusEmoji(expedition.status), inline: true },
      { name: "👥 Membres", value: `${expedition.members?.length || 0}`, inline: true },
      { name: "🏛️ Ville", value: expedition.town?.name || "Inconnue", inline: true },
      { name: "👤 Créée par", value: `<@${expedition.createdBy}>`, inline: true }
    );

    await interaction.update({
      embeds: [embed],
      components: [buttonRow1, buttonRow2],
    });

  } catch (error) {
    logger.error("Error in expedition admin select:", { error });
      await replyEphemeral(interaction, "❌ Une erreur est survenue lors de la récupération des détails de l'expédition.");
  }
}

export async function handleExpeditionAdminModifyDuration(interaction: any, expeditionId: string) {
  try {
    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await replyEphemeral(interaction, "❌ Expédition non trouvée.");
      return;
    }

    // Show duration modification modal
    const modal = createExpeditionDurationModal(expeditionId, expedition.duration);
    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in expedition admin modify duration:", { error });
      await replyEphemeral(interaction, "❌ Une erreur est survenue lors de l'ouverture du formulaire de modification.");
  }
}

export async function handleExpeditionModifyModal(interaction: any) {
  try {
    const expeditionId = interaction.customId.split('_')[3]; // Extract expedition ID from modal custom ID (expedition_modify_modal_${expeditionId})
    const duration = interaction.fields.getTextInputValue("modify_duration_input");
    const foodStock = interaction.fields.getTextInputValue("modify_food_stock_input");

    // Validate inputs
    const durationValue = parseInt(duration, 10);
    const foodStockValue = parseInt(foodStock, 10);

    if (isNaN(durationValue) || durationValue < 1) {
      await replyEphemeral(interaction, "❌ La durée doit être un nombre positif d'au moins 1 jour.");
      return;
    }

    if (isNaN(foodStockValue) || foodStockValue < 0) {
      await replyEphemeral(interaction, "❌ Le stock de nourriture doit être un nombre positif.");
      return;
    }

    // Call API to modify expedition
    const updatedExpedition = await apiService.modifyExpedition(expeditionId, {
      duration: durationValue,
      foodStock: foodStockValue,
    });

    // Update the original admin interface
    await interaction.update({
      content: `✅ Expédition **${updatedExpedition.name}** modifiée avec succès!\n\n📦 Nouveau stock: **${foodStockValue}**\n⏱️ Nouvelle durée: **${durationValue} jours**`,
      embeds: [],
      components: [],
    });

    logger.info("Expedition modified via admin command", {
      expeditionId,
      expeditionName: updatedExpedition.name,
      oldDuration: durationValue,
      newDuration: durationValue,
      oldFoodStock: foodStockValue,
      newFoodStock: foodStockValue,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in expedition modify modal:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de la modification de l'expédition: ${
      error instanceof Error ? error.message : "Erreur inconnue"
    }`);
  }
}

export async function handleExpeditionAdminMembers(interaction: any, expeditionId: string) {
  try {
    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId) as Expedition;
    if (!expedition) {
      await interaction.reply({
        content: "❌ Expédition non trouvée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get all characters in the guild/town for selection
    const guildId = expedition.townId; // Assuming this is the guild ID or we need to get it differently
    const characters = await apiService.characters.getTownCharacters(expedition.townId) as Character[];

    if (!characters || characters.length === 0) {
      await replyEphemeral(interaction, "❌ Aucun personnage trouvé dans cette ville.");
      return;
    }

    // Filter characters not already in expedition
    const availableCharacters = characters.filter(char =>
      !expedition.members?.some((member: { character: { id: string } }) => member.character.id === char.id)
    );

    if (availableCharacters.length === 0) {
      await replyEphemeral(interaction, "❌ Tous les personnages de cette ville sont déjà dans l'expédition.");
      return;
    }

    // Create dropdown for adding members
    const addSelectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_add_member_${expeditionId}`)
      .setPlaceholder("Sélectionnez un personnage à ajouter")
      .addOptions(
        availableCharacters.map(char => ({
          label: char.name,
          description: `Utilisateur: ${char.user?.username || 'Inconnu'}`,
          value: char.id,
        }))
      );

    // Create dropdown for removing members (if expedition has members)
    const components = [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(addSelectMenu)];

    if (expedition.members && expedition.members.length > 0) {
      const removeSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`expedition_admin_remove_member_${expeditionId}`)
        .setPlaceholder("Sélectionnez un membre à retirer")
        .addOptions(
          expedition.members.map(member => ({
            label: member.character.name,
            description: `Utilisateur: ${member.character.user?.username || 'Inconnu'}`,
            value: member.character.id,
          }))
        );

      components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(removeSelectMenu));
    }

    // Create embed with current member list
    const memberList = expedition.members?.map(member =>
      `• ${member.character.name} (${member.character.user?.username || 'Inconnu'})`
    ).join('\n') || 'Aucun membre';

    const embed = createWarningEmbed(
      `👥 Gestion des membres - ${expedition.name}`,
      `**Membres actuels (${expedition.members?.length || 0}):**\n${memberList}`
    ).addFields(
      { name: "➕ Ajouter un membre", value: `${availableCharacters.length} personnage(s) disponible(s)`, inline: true },
      { name: "➖ Retirer un membre", value: (expedition.members?.length || 0) > 0 ? `${expedition.members?.length} membre(s)` : "Aucun membre", inline: true },
      { name: "📍 Ville", value: expedition.town?.name || "Inconnue", inline: true }
    );

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });

  } catch (error) {
    logger.error("Error in expedition admin members:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'affichage de la gestion des membres.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionAdminAddMember(interaction: any) {
  try {
    const [action, expeditionId] = interaction.customId.split('_').slice(2); // expedition_admin_add_member_${expeditionId}
    const characterId = interaction.values[0];

    // Get character details to check status
    const character = await apiService.characters.getCharacterById(characterId);
    
    // Validate character exists and is alive
    validateCharacterExists(character);
    validateCharacterAlive(character);

    // Add member to expedition
    await apiService.addMemberToExpedition(expeditionId, characterId);

    // Get updated expedition info
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);

    // Update the message with new member count
    const memberList = expedition?.members?.map(member =>
      `• ${member.character.name} (${member.character.user?.username || 'Inconnu'})`
    ).join('\n') || 'Aucun membre';

    const embed = createSuccessEmbed(
      `✅ Membre ajouté - ${expedition?.name}`,
      `**Membres actuels (${expedition?.members?.length || 0}):**\n${memberList}`
    );

    await interaction.update({
      embeds: [embed],
      components: [],
    });

    logger.info("Member added to expedition via admin", {
      expeditionId,
      expeditionName: expedition?.name,
      characterId,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error adding member to expedition:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors de l'ajout du membre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export async function handleExpeditionAdminRemoveMember(interaction: any) {
  try {
    const [action, expeditionId] = interaction.customId.split('_').slice(2); // expedition_admin_remove_member_${expeditionId}
    const characterId = interaction.values[0];

    // Remove member from expedition
    await apiService.removeMemberFromExpedition(expeditionId, characterId);

    // Get updated expedition info
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);

    // Update the message with new member count
    const memberList = expedition?.members?.map(member =>
      `• ${member.character.name} (${member.character.user?.username || 'Inconnu'})`
    ).join('\n') || 'Aucun membre';

    const embed = createErrorEmbed(
      `Membre retiré - ${expedition?.name}`,
      `**Membres actuels (${expedition?.members?.length || 0}):**\n${memberList}`
    );

    await interaction.update({
      embeds: [embed],
      components: [],
    });

    logger.info("Member removed from expedition via admin", {
      expeditionId,
      expeditionName: expedition?.name,
      characterId,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error removing member from expedition:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors du retrait du membre: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export async function handleExpeditionAdminReturn(interaction: any, expeditionId: string) {
  try {
    // Force return the expedition
    const expedition = await apiService.forceReturnExpedition(expeditionId);

    await interaction.update({
      content: `✅ Expédition **${expedition.name}** retournée de force avec succès!`,
      embeds: [],
      components: [],
    });

    logger.info("Expedition force returned via admin command", {
      expeditionId,
      expeditionName: expedition.name,
      adminUserId: interaction.user.id,
    });

  } catch (error) {
    logger.error("Error in expedition admin return:", { error });
    await replyEphemeral(interaction, `❌ Erreur lors du retour forcé de l'expédition: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLANNING": return "🔄 PLANIFICATION";
    case "LOCKED": return "🔒 VERROUILLÉE";
    case "DEPARTED": return "✈️ PARTIE";
    case "RETURNED": return "🏠 REVENUE";
    default: return status;
  }
}

export async function handleExpeditionAdminResources(interaction: any, expeditionId: string) {
  try {
    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await replyEphemeral(interaction, "❌ Expédition non trouvée.");
      return;
    }

    // Create resource management buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_admin_resource_add_${expeditionId}`)
          .setLabel("➕ Ajouter")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`expedition_admin_resource_modify_${expeditionId}`)
          .setLabel("✏️ Modifier")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`expedition_admin_resource_delete_${expeditionId}`)
          .setLabel("🗑️ Supprimer")
          .setStyle(ButtonStyle.Danger)
      );

    // Get expedition resources
    const resources = await apiService.resources.getResourcesForLocation("EXPEDITION", expeditionId);
    const resourceList = resources && resources.length > 0
      ? resources.map((r: any) => `• ${r.resourceType?.name || 'Inconnu'}: ${r.quantity}`).join('\n')
      : 'Aucune ressource';

    const embed = createWarningEmbed(
      `📦 Gestion des ressources - ${expedition.name}`,
      `**Ressources actuelles:**\n${resourceList}`
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttonRow],
      flags: ["Ephemeral"],
    });

  } catch (error) {
    logger.error("Error in expedition admin resources:", { error });
    await replyEphemeral(interaction, "❌ Une erreur est survenue lors de l'affichage de la gestion des ressources.");
  }
}

export async function handleExpeditionAdminResourceAdd(interaction: any, expeditionId: string) {
  try {
    // Get all resource types
    const resourceTypes = await apiService.getResourceTypes();

    if (!resourceTypes || resourceTypes.length === 0) {
      await replyEphemeral(interaction, "❌ Aucun type de ressource trouvé.");
      return;
    }

    // Create dropdown for resource selection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_resource_add_select_${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à ajouter")
      .addOptions(
        resourceTypes.map((rt: any) => ({
          label: rt.name,
          description: rt.description || 'Aucune description',
          value: rt.id.toString(),
          emoji: rt.emoji || '📦',
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = createInfoEmbed(
      "➕ Ajouter une ressource",
      "Sélectionnez la ressource à ajouter à l'expédition"
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });

  } catch (error) {
    logger.error("Error in expedition admin resource add:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de l'ajout de ressource.");
  }
}

export async function handleExpeditionAdminResourceModify(interaction: any, expeditionId: string) {
  try {
    // Get expedition resources
    const resources = await apiService.resources.getResourcesForLocation("EXPEDITION", expeditionId);

    if (!resources || resources.length === 0) {
      await replyEphemeral(interaction, "❌ Aucune ressource trouvée pour cette expédition.");
      return;
    }

    // Create dropdown for resource selection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_resource_modify_select_${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à modifier")
      .addOptions(
        resources.map((r: any) => ({
          label: `${r.resourceType?.name || 'Inconnu'} (${r.quantity})`,
          description: `ID: ${r.resourceTypeId} - Stock actuel: ${r.quantity}`,
          value: `${r.resourceTypeId}`,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = createInfoEmbed(
      "✏️ Modifier une ressource",
      "Sélectionnez la ressource dont vous voulez modifier la quantité"
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });

  } catch (error) {
    logger.error("Error in expedition admin resource modify:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de la modification de ressource.");
  }
}

export async function handleExpeditionAdminResourceDelete(interaction: any, expeditionId: string) {
  try {
    // Get expedition resources
    const resources = await apiService.resources.getResourcesForLocation("EXPEDITION", expeditionId);

    if (!resources || resources.length === 0) {
      await replyEphemeral(interaction, "❌ Aucune ressource trouvée pour cette expédition.");
      return;
    }

    // Create dropdown for resource selection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_admin_resource_delete_select_${expeditionId}`)
      .setPlaceholder("Choisissez une ressource à supprimer")
      .addOptions(
        resources.map((r: any) => ({
          label: `${r.resourceType?.name || 'Inconnu'} (${r.quantity})`,
          description: `Stock: ${r.quantity} - Sera complètement supprimé`,
          value: `${r.resourceTypeId}`,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = createErrorEmbed(
      "🗑️ Supprimer une ressource",
      "⚠️ La ressource et tout son stock seront supprimés de l'expédition"
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
    });

  } catch (error) {
    logger.error("Error in expedition admin resource delete:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de la suppression de ressource.");
  }
}

export async function handleExpeditionAdminButton(interaction: any) {
  try {
    const customId = interaction.customId;

    if (customId.startsWith("expedition_admin_modify_duration_")) {
      const expeditionId = customId.replace("expedition_admin_modify_duration_", "");
      await handleExpeditionAdminModifyDuration(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_resources_")) {
      const expeditionId = customId.replace("expedition_admin_resources_", "");
      await handleExpeditionAdminResources(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_resource_add_")) {
      const expeditionId = customId.replace("expedition_admin_resource_add_", "");
      await handleExpeditionAdminResourceAdd(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_resource_modify_")) {
      const expeditionId = customId.replace("expedition_admin_resource_modify_", "");
      await handleExpeditionAdminResourceModify(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_resource_delete_confirm_")) {
      await handleExpeditionAdminResourceDeleteConfirm(interaction);
    } else if (customId.startsWith("expedition_admin_resource_delete_cancel_")) {
      await handleExpeditionAdminResourceDeleteCancel(interaction);
    } else if (customId.startsWith("expedition_admin_resource_delete_")) {
      const expeditionId = customId.replace("expedition_admin_resource_delete_", "");
      await handleExpeditionAdminResourceDelete(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_members_")) {
      const expeditionId = customId.replace("expedition_admin_members_", "");
      await handleExpeditionAdminMembers(interaction, expeditionId);
    } else if (customId.startsWith("expedition_admin_return_")) {
      const expeditionId = customId.replace("expedition_admin_return_", "");
      await handleExpeditionAdminReturn(interaction, expeditionId);
    } else {
      await replyEphemeral(interaction, "⚠️ Action d'administration d'expédition non reconnue");
    }
  } catch (error) {
    logger.error("Error in expedition admin button:", { error });
    await replyEphemeral(interaction, "❌ Erreur lors de l'administration de l'expédition");
  }
}

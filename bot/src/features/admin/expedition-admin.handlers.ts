import { createInfoEmbed, createSuccessEmbed, createErrorEmbed, createWarningEmbed } from "../../utils/embeds";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createExpeditionModifyModal } from "../../modals/expedition-modals";
import { ExpeditionAPIService } from "../../services/api/expedition-api.service";
import { Character, Expedition } from "../../types/entities";
import { apiService } from "../../services/api";

import { replyEphemeral, replyError } from "../../utils/interaction-helpers.js";
import { validateCharacterExists } from "../../utils/character-validation.js";
import { logger } from "../../services/logger";

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
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`expedition_admin_modify_${expeditionId}`)
          .setLabel("Modifier durée/stock")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`expedition_admin_members_${expeditionId}`)
          .setLabel("Gérer membres")
          .setStyle(ButtonStyle.Secondary),
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
      components: [buttonRow],
    });

  } catch (error) {
    logger.error("Error in expedition admin select:", { error });
      await replyEphemeral(interaction, "❌ Une erreur est survenue lors de la récupération des détails de l'expédition.");
  }
}

export async function handleExpeditionAdminModify(interaction: any, expeditionId: string) {
  try {
    // Get expedition details
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await replyEphemeral(interaction, "❌ Expédition non trouvée.");
      return;
    }

    // Show modification modal with current values
    const modal = createExpeditionModifyModal(expeditionId, expedition.duration, expedition.foodStock ?? 0);
    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in expedition admin modify:", { error });
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
    
    // Vérifier que le personnage est actif et vivant
    if (!character.isActive) {
      await replyEphemeral(interaction, "❌ Impossible d'ajouter ce personnage à l'expédition : le personnage n'est pas actif.");
      return;
    }
    
    if (character.isDead) {
      await replyEphemeral(interaction, "❌ Impossible d'ajouter ce personnage à l'expédition : le personnage est mort.");
      return;
    }

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

export async function handleExpeditionAdminButton(interaction: any) {
  try {
    const customId = interaction.customId;

    if (customId.startsWith("expedition_admin_modify_")) {
      const expeditionId = customId.replace("expedition_admin_modify_", "");
      await handleExpeditionAdminModify(interaction, expeditionId);
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

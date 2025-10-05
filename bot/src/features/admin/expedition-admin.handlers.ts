import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createExpeditionModifyModal } from "../../modals/expedition-modals";
import { Expedition } from "../../types/expedition";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";

export async function handleExpeditionAdminCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Get all expeditions (including returned ones for admin)
    const expeditions = await apiService.getAllExpeditions(true);

    if (!expeditions || expeditions.length === 0) {
      await interaction.reply({
        content: "❌ Aucune expédition trouvée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Filter expeditions that have at least one member
    const expeditionsWithMembers = expeditions.filter(
      (exp: Expedition) => exp.members && exp.members.length > 0
    );

    if (expeditionsWithMembers.length === 0) {
      await interaction.reply({
        content: "❌ Aucune expédition avec membres trouvée.",
        flags: ["Ephemeral"],
      });
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

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("🛠️ Administration des Expéditions")
      .setDescription(`**${expeditionsWithMembers.length}** expéditions avec membres trouvées`)
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    });

  } catch (error) {
    logger.error("Error in expedition admin command:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la récupération des expéditions.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionAdminSelect(interaction: any) {
  try {
    const expeditionId = interaction.values[0];

    // Get expedition details
    const expedition = await apiService.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.reply({
        content: "❌ Expédition non trouvée.",
        flags: ["Ephemeral"],
      });
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
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle(`🛠️ ${expedition.name}`)
      .addFields(
        { name: "📦 Stock de nourriture", value: `${expedition.foodStock}`, inline: true },
        { name: "⏱️ Durée", value: `${expedition.duration}h`, inline: true },
        { name: "📍 Statut", value: getStatusEmoji(expedition.status), inline: true },
        { name: "👥 Membres", value: `${expedition.members?.length || 0}`, inline: true },
        { name: "🏛️ Ville", value: expedition.town?.name || "Inconnue", inline: true },
        { name: "👤 Créée par", value: `<@${expedition.createdBy}>`, inline: true }
      )
      .setTimestamp();

    await interaction.update({
      embeds: [embed],
      components: [buttonRow],
    });

  } catch (error) {
    logger.error("Error in expedition admin select:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la récupération des détails de l'expédition.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionAdminModify(interaction: any, expeditionId: string) {
  try {
    // Get expedition details
    const expedition = await apiService.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.reply({
        content: "❌ Expédition non trouvée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Show modification modal with current values
    const modal = createExpeditionModifyModal(expeditionId, expedition.duration, expedition.foodStock);
    await interaction.showModal(modal);

  } catch (error) {
    logger.error("Error in expedition admin modify:", { error });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'ouverture du formulaire de modification.",
      flags: ["Ephemeral"],
    });
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
      await interaction.reply({
        content: "❌ La durée doit être un nombre positif d'au moins 1 jour.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (isNaN(foodStockValue) || foodStockValue < 0) {
      await interaction.reply({
        content: "❌ Le stock de nourriture doit être un nombre positif.",
        flags: ["Ephemeral"],
      });
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
    await interaction.reply({
      content: `❌ Erreur lors de la modification de l'expédition: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionAdminMembers(interaction: any, expeditionId: string) {
  try {
    // This would show member management interface
    await interaction.reply({
      content: "⚠️ Gestion des membres - fonctionnalité à implémenter",
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition admin members:", { error });
  }
}

export async function handleExpeditionAdminReturn(interaction: any, expeditionId: string) {
  try {
    // Force return the expedition
    const expedition = await apiService.returnExpedition(expeditionId);

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
    await interaction.reply({
      content: `❌ Erreur lors du retour forcé de l'expédition: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      flags: ["Ephemeral"],
    });
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
      await interaction.reply({
        content: "⚠️ Action d'administration d'expédition non reconnue",
        flags: ["Ephemeral"],
      });
    }
  } catch (error) {
    logger.error("Error in expedition admin button:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'administration de l'expédition",
      flags: ["Ephemeral"],
    });
  }
}

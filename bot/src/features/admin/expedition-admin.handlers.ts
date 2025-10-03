import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
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

    // Create dropdown menu with expeditions
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_admin_select")
      .setPlaceholder("Sélectionnez une expédition à gérer")
      .addOptions(
        expeditions.map((exp: Expedition) => ({
          label: `${exp.name} (${exp.status})`,
          description: `Membres: ${exp.members?.length || 0}, Stock: ${exp.foodStock}`,
          value: exp.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("🛠️ Administration des Expéditions")
      .setDescription(`**${expeditions.length}** expéditions trouvées`)
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
    // This would typically show a modal for modifying duration/food stock
    // For now, just show a placeholder
    await interaction.reply({
      content: "⚠️ Modification d'expédition - fonctionnalité à implémenter",
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition admin modify:", { error });
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

import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  type StringSelectMenuInteraction,
  ButtonInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { createSuccessEmbed, createInfoEmbed, createErrorEmbed } from "../../../utils/embeds";
import { getTownByGuildId } from "../../../utils/town";
import { PROJECT, STATUS } from "@shared/constants/emojis";
import { getCraftTypeEmoji } from "../../projects/projects.utils";
import type { Project } from "../../projects/projects.types";

/**
 * Handler pour le bouton "Supprimer un projet"
 * Affiche un select menu pour choisir le projet à supprimer
 */
export async function handleProjectAdminDeleteButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferUpdate();

    // Récupérer la ville
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Récupérer tous les projets
    const projects = await apiService.projects.getProjectsByTown(town.id);

    if (!projects || projects.length === 0) {
      await interaction.editReply({
        content: "❌ Aucun projet à supprimer.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Créer le select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_admin_delete_select")
      .setPlaceholder("Sélectionnez un projet à supprimer")
      .addOptions(
        projects.slice(0, 25).map((project: Project) => {
          const craftEmojis = project.craftTypes.map(getCraftTypeEmoji).join("");
          return {
            label: `${project.name}`,
            description: `${craftEmojis} PA: ${project.paContributed}/${project.paRequired} | ID: ${project.id}`,
            value: project.id.toString(),
          };
        })
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = createInfoEmbed(
      `🗑️ Supprimer un projet - ${town.name}`,
      "⚠️ **Attention :** La suppression d'un projet est irréversible !\n\nSélectionnez le projet que vous souhaitez supprimer :"
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    logger.info("Project delete select menu displayed", {
      guildId: interaction.guildId,
      townId: town.id,
      userId: interaction.user.id,
      projectsCount: projects.length,
    });
  } catch (error) {
    logger.error("Error showing project delete menu:", { error });
    await interaction.editReply({
      content: "❌ Erreur lors de l'affichage du menu de suppression.",
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour la sélection d'un projet à supprimer
 * Affiche une confirmation
 */
export async function handleProjectAdminDeleteSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    await interaction.deferUpdate();

    const projectId = interaction.values[0];

    // Récupérer la ville
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Récupérer le projet sélectionné
    const projects = await apiService.projects.getProjectsByTown(town.id);
    const project = projects.find((p: Project) => p.id.toString() === projectId);

    if (!project) {
      await interaction.editReply({
        content: "❌ Projet introuvable.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Créer l'embed de confirmation
    const craftEmojis = project.craftTypes.map(getCraftTypeEmoji).join("");
    const embed = createErrorEmbed(
      "⚠️ Confirmation de suppression",
      `Êtes-vous sûr de vouloir supprimer le projet suivant ?\n\n` +
      `${craftEmojis} **${project.name}** (ID: ${project.id})\n` +
      `📊 ${project.paContributed}/${project.paRequired} PA\n` +
      `🛠️ ${project.craftTypes.join(", ")}\n\n` +
      `⚠️ **Cette action est irréversible !**`
    );

    // Boutons de confirmation
    const confirmButton = new ButtonBuilder()
      .setCustomId(`project_admin_delete_confirm:${projectId}`)
      .setLabel("✅ Confirmer la suppression")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("project_admin_delete_cancel")
      .setLabel("❌ Annuler")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirmButton,
      cancelButton
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    logger.info("Project delete confirmation shown", {
      projectId,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error("Error showing project delete confirmation:", { error });
    await interaction.editReply({
      content: "❌ Erreur lors de l'affichage de la confirmation.",
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour la confirmation de suppression
 */
export async function handleProjectAdminDeleteConfirm(interaction: ButtonInteraction) {
  try {
    // Gérer l'annulation
    if (interaction.customId === "project_admin_delete_cancel") {
      await interaction.update({
        content: "❌ Suppression annulée.",
        embeds: [],
        components: [],
      });
      return;
    }

    await interaction.deferUpdate();

    // Extraire l'ID du projet depuis le customId
    const projectId = interaction.customId.split(":")[1];

    // Récupérer le projet avant de le supprimer (pour le log)
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée.",
        embeds: [],
        components: [],
      });
      return;
    }

    const projects = await apiService.projects.getProjectsByTown(town.id);
    const project = projects.find((p: Project) => p.id.toString() === projectId);

    if (!project) {
      await interaction.editReply({
        content: "❌ Projet introuvable.",
        embeds: [],
        components: [],
      });
      return;
    }

    const projectName = project.name;

    // Supprimer le projet via l'API
    await apiService.projects.deleteProject(projectId);

    const embed = createSuccessEmbed(
      `${STATUS.SUCCESS} Projet supprimé`,
      `Le projet **${projectName}** (ID: ${projectId}) a été supprimé avec succès.`
    );

    await interaction.editReply({
      embeds: [embed],
      components: [],
    });

    logger.info("Project deleted via admin", {
      projectId,
      projectName,
      townId: town.id,
      userId: interaction.user.id,
    });
  } catch (error: any) {
    logger.error("Error deleting project:", { error });
    await interaction.editReply({
      content: `❌ Erreur lors de la suppression du projet : ${error.message || "Erreur inconnue"}`,
      embeds: [],
      components: [],
    });
  }
}

import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { createInfoEmbed } from "../../../utils/embeds";
import { checkAdmin } from "../../../utils/admin";
import { ERROR_MESSAGES } from "../../../constants/messages";
import { getTownByGuildId } from "../../../utils/town";
import { PROJECT } from "@shared/constants/emojis";
import {
  getStatusText,
  getStatusEmoji,
  getCraftTypeEmoji,
  getCraftDisplayName,
} from "../../projects/projects.utils";
import type { Project } from "../../projects/projects.types";
import { STATUS } from "../../../constants/emojis.js";


/**
 * Handler principal pour la commande /projects-admin
 * Affiche la liste des projets avec boutons d'actions
 */
export async function handleProjectsAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn(
        "Utilisateur non admin tente d'utiliser la commande projects admin",
        {
          userId: interaction.user.id,
          guildId: interaction.guildId,
        }
      );
      return;
    }

    // Récupérer la ville du serveur
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer tous les projets de la ville
    const projects = await apiService.projects.getProjectsByTown(town.id);

    // Créer l'embed avec les projets
    const embed = createInfoEmbed(
      `${PROJECT.ICON} Projets de ${town.name}`,
      "Gestion administrative des projets artisanaux"
    );

    if (projects && projects.length > 0) {
      // Grouper par statut
      const projectsParStatut = projects.reduce<Record<string, Project[]>>(
        (acc, project) => {
          if (!acc[project.status]) {
            acc[project.status] = [];
          }
          acc[project.status].push(project);
          return acc;
        },
        {}
      );

      // Ajouter une section pour chaque statut
      for (const [statut, listeProjects] of Object.entries(projectsParStatut)) {
        const projectsText = listeProjects
          .map((project) => {
            // Craft types emojis
            const craftEmojis = project.craftTypes.map(getCraftTypeEmoji).join("");
            const craftNames = project.craftTypes
              .map((craftType) => getCraftDisplayName(craftType))
              .filter(Boolean)
              .join(", ");

            // Output info
            let outputInfo = "";
            if (project.outputResourceType && project.outputResourceTypeId !== null) {
              outputInfo = `→ ${project.outputResourceType.emoji} ${project.outputQuantity}x ${project.outputResourceType.name}`;
            } else if (project.outputObjectType && project.outputObjectTypeId !== null) {
              outputInfo = `→ ${PROJECT.ICON} ${project.outputQuantity}x ${project.outputObjectType.name}`;
            }

            let text = `${craftEmojis} **${project.name}** (ID: ${project.id})\n`;
            text += `  📊 ${project.paContributed}/${project.paRequired} PA`;

            if (outputInfo) {
              text += ` ${outputInfo}`;
            }

            if (craftNames) {
              text += `\n  🛠️ ${craftNames}`;
            }

            // Resources
            if (project.resourceCosts && project.resourceCosts.length > 0) {
              const resourcesText = project.resourceCosts
                .map((rc) => `${rc.resourceType.emoji} ${rc.quantityContributed}/${rc.quantityRequired}`)
                .join(" ");
              text += `\n  📦 ${resourcesText}`;
            }

            // Blueprint info
            if ((project as any).isBlueprint) {
              text += `\n  📋 Blueprint - PA Restart: ${(project as any).paBlueprintRequired ?? project.paRequired}`;
            }

            return text;
          })
          .join("\n\n");

        embed.addFields({
          name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
          value: projectsText || "Aucun projet",
          inline: false,
        });
      }
    } else {
      embed.addFields({
        name: `${PROJECT.ICON} Projets`,
        value: "Aucun projet créé pour l'instant",
        inline: false,
      });
    }

    // Créer les boutons d'actions
    const addButton = new ButtonBuilder()
      .setCustomId("project_admin_add")
      .setLabel("➕ Ajouter")
      .setStyle(ButtonStyle.Success);

    const editButton = new ButtonBuilder()
      .setCustomId("project_admin_edit")
      .setLabel("✏️ Modifier")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(projects.length === 0);

    const deleteButton = new ButtonBuilder()
      .setCustomId("project_admin_delete")
      .setLabel("🗑️ Supprimer")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(projects.length === 0);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      addButton,
      editButton,
      deleteButton
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    });

    logger.info("Projects admin interface displayed", {
      guildId: interaction.guildId,
      townId: town.id,
      townName: town.name,
      userId: interaction.user.id,
      projectsCount: projects?.length || 0,
    });
  } catch (error) {
    logger.error("Error in projects admin command:", { error });
    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage des projets.`,
      flags: ["Ephemeral"],
    });
  }
}

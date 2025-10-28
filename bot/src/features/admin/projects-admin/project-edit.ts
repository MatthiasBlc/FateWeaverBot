import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ButtonInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { createSuccessEmbed, createInfoEmbed } from "../../../utils/embeds";
import { getTownByGuildId } from "../../../utils/town";
import { PROJECT } from "@shared/constants/emojis";
import { getCraftTypeEmoji } from "../../projects/projects.utils";
import type { Project } from "../../projects/projects.types";

/**
 * Handler pour le bouton "Modifier un projet"
 * Affiche un select menu pour choisir le projet à modifier
 */
export async function handleProjectAdminEditButton(interaction: ButtonInteraction) {
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
        content: "❌ Aucun projet à modifier.",
        embeds: [],
        components: [],
      });
      return;
    }

    // Créer le select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_admin_edit_select")
      .setPlaceholder("Sélectionnez un projet à modifier")
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
      `✏️ Modifier un projet - ${town.name}`,
      "Sélectionnez le projet que vous souhaitez modifier :"
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    logger.info("Project edit select menu displayed", {
      guildId: interaction.guildId,
      townId: town.id,
      userId: interaction.user.id,
      projectsCount: projects.length,
    });
  } catch (error) {
    logger.error("Error showing project edit menu:", { error });
    await interaction.editReply({
      content: "❌ Erreur lors de l'affichage du menu de modification.",
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler pour la sélection d'un projet à modifier
 * Affiche un modal pré-rempli avec les données actuelles
 */
export async function handleProjectAdminEditSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    const projectId = interaction.values[0];

    // Récupérer la ville
    const town = await getTownByGuildId(interaction.guildId || "");
    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer le projet sélectionné
    const projects = await apiService.projects.getProjectsByTown(town.id);
    const project = projects.find((p: Project) => p.id.toString() === projectId);

    if (!project) {
      await interaction.reply({
        content: "❌ Projet introuvable.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Préparer les valeurs pour le modal
    const craftTypesValue = project.craftTypes.join(", ");

    let outputValue = "";
    if (project.outputResourceTypeId) {
      outputValue = `RESOURCE:${project.outputResourceTypeId}:${project.outputQuantity}`;
    } else if (project.outputObjectTypeId) {
      outputValue = `OBJECT:${project.outputObjectTypeId}:${project.outputQuantity}`;
    }

    const resourceCostsValue = project.resourceCosts
      ? project.resourceCosts.map((rc) => `${rc.resourceTypeId}:${rc.quantityRequired}`).join(";")
      : "";

    // Créer le modal pré-rempli
    const modal = new ModalBuilder()
      .setCustomId(`project_admin_edit_modal:${projectId}`)
      .setTitle(`✏️ Modifier: ${project.name.substring(0, 30)}`);

    const nameInput = new TextInputBuilder()
      .setCustomId("project_name")
      .setLabel("Nom du projet")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(project.name)
      .setMaxLength(100);

    const paInput = new TextInputBuilder()
      .setCustomId("project_pa")
      .setLabel("Points d'Action requis (PA)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(project.paRequired.toString())
      .setMinLength(1)
      .setMaxLength(5);

    const craftTypesInput = new TextInputBuilder()
      .setCustomId("project_craft_types")
      .setLabel("Types d'artisanat (séparés par virgules)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(craftTypesValue)
      .setMaxLength(100);

    const outputInput = new TextInputBuilder()
      .setCustomId("project_output")
      .setLabel("Production (RESOURCE:ID:QTÉ ou OBJECT:ID:QTÉ)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(outputValue)
      .setMaxLength(50);

    const resourceCostsInput = new TextInputBuilder()
      .setCustomId("project_resource_costs")
      .setLabel("Coûts ressources (ID:QTÉ;ID:QTÉ) [OPTIONNEL]")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(resourceCostsValue)
      .setMaxLength(200);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(paInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(craftTypesInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(outputInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(resourceCostsInput)
    );

    await interaction.showModal(modal);

    logger.info("Project edit modal shown", {
      projectId,
      userId: interaction.user.id,
    });
  } catch (error) {
    logger.error("Error showing project edit modal:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'affichage du formulaire.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la soumission du modal de modification
 */
export async function handleProjectAdminEditModal(
  interaction: ModalSubmitInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Extraire l'ID du projet depuis le customId
    const projectId = interaction.customId.split(":")[1];

    // Récupérer les valeurs du modal
    const name = interaction.fields.getTextInputValue("project_name").trim();
    const paRequired = parseInt(interaction.fields.getTextInputValue("project_pa").trim(), 10);
    const craftTypesRaw = interaction.fields.getTextInputValue("project_craft_types").trim();
    const outputRaw = interaction.fields.getTextInputValue("project_output").trim();
    const resourceCostsRaw = interaction.fields.getTextInputValue("project_resource_costs")?.trim() || "";

    // Validation PA
    if (isNaN(paRequired) || paRequired <= 0) {
      await interaction.editReply({
        content: "❌ Le nombre de PA doit être un nombre positif valide.",
      });
      return;
    }

    // Parse craft types
    const craftTypes = craftTypesRaw
      .split(",")
      .map((ct) => ct.trim().toUpperCase())
      .filter(Boolean);

    if (craftTypes.length === 0) {
      await interaction.editReply({
        content: "❌ Vous devez spécifier au moins un type d'artisanat.",
      });
      return;
    }

    // Valider les craft types
    const validCraftTypes = ["TISSER", "FORGER", "MENUISER"];
    const invalidCrafts = craftTypes.filter((ct) => !validCraftTypes.includes(ct));
    if (invalidCrafts.length > 0) {
      await interaction.editReply({
        content: `❌ Types d'artisanat invalides : ${invalidCrafts.join(", ")}. Valides : ${validCraftTypes.join(", ")}`,
      });
      return;
    }

    // Parse output
    const outputParts = outputRaw.split(":");
    if (outputParts.length !== 3) {
      await interaction.editReply({
        content: "❌ Format de production invalide. Utilisez : RESOURCE:ID:QTÉ ou OBJECT:ID:QTÉ",
      });
      return;
    }

    const [outputType, outputIdStr, outputQuantityStr] = outputParts;
    const outputId = parseInt(outputIdStr, 10);
    const outputQuantity = parseInt(outputQuantityStr, 10);

    if (isNaN(outputId) || isNaN(outputQuantity) || outputQuantity <= 0) {
      await interaction.editReply({
        content: "❌ L'ID et la quantité de production doivent être des nombres positifs.",
      });
      return;
    }

    let outputResourceTypeId: number | undefined;
    let outputObjectTypeId: number | undefined;

    if (outputType.toUpperCase() === "RESOURCE") {
      outputResourceTypeId = outputId;
    } else if (outputType.toUpperCase() === "OBJECT") {
      outputObjectTypeId = outputId;
    } else {
      await interaction.editReply({
        content: "❌ Le type de production doit être RESOURCE ou OBJECT.",
      });
      return;
    }

    // Parse resource costs (optionnel)
    let resourceCosts: { resourceTypeId: number; quantityRequired: number }[] | undefined;
    if (resourceCostsRaw) {
      try {
        resourceCosts = resourceCostsRaw
          .split(";")
          .map((cost) => {
            const [idStr, qtyStr] = cost.trim().split(":");
            const resourceTypeId = parseInt(idStr, 10);
            const quantityRequired = parseInt(qtyStr, 10);

            if (isNaN(resourceTypeId) || isNaN(quantityRequired) || quantityRequired <= 0) {
              throw new Error("Format invalide");
            }

            return { resourceTypeId, quantityRequired };
          });
      } catch (error) {
        await interaction.editReply({
          content: "❌ Format de coûts ressources invalide. Utilisez : ID:QTÉ;ID:QTÉ",
        });
        return;
      }
    }

    // Mettre à jour le projet via l'API
    const updateData = {
      name,
      paRequired,
      craftTypes,
      outputResourceTypeId,
      outputObjectTypeId,
      outputQuantity,
      resourceCosts,
    };

    await apiService.projects.updateProject(projectId, updateData);

    const embed = createSuccessEmbed(
      `${PROJECT.ICON} Projet modifié !`,
      `Le projet **${name}** a été mis à jour avec succès.`
    );

    await interaction.editReply({
      embeds: [embed],
    });

    logger.info("Project updated via admin", {
      projectId,
      projectName: name,
      userId: interaction.user.id,
    });
  } catch (error: any) {
    logger.error("Error updating project:", { error });
    await interaction.editReply({
      content: `❌ Erreur lors de la modification du projet : ${error.message || "Erreur inconnue"}`,
    });
  }
}

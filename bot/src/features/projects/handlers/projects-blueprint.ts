/**
 * Handler pour le bouton "Participer Blueprints"
 * Affiche un menu de sélection des blueprints avec pagination
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
} from "discord.js";

import type { Project } from "../projects.types.js";
import { apiService } from "../../../services/api/index.js";
import { logger } from "../../../services/logger.js";
import { getCraftDisplayName, toCraftEnum } from "../projects.utils.js";
import type { CraftEnum } from "../projects.utils.js";
import { STATUS } from "../../../constants/emojis.js";
import type { Town, ActiveCharacter } from "./projects-common.js";
import { normalizeCapabilities, getProjectOutputText } from "./projects-helpers.js";

/**
 * Handler pour le bouton "Participer Blueprints" - Affiche select menu des blueprints avec pagination
 */
export async function handleBlueprintParticipateButton(
  interaction: ButtonInteraction
) {
  try {
    // Extraire le numéro de page du customId (format: blueprint_participate ou blueprint_participate:page:N)
    const page = interaction.customId.includes(":page:")
      ? parseInt(interaction.customId.split(":page:")[1], 10)
      : 0;

    // Récupérer l'utilisateur
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    if (!user) {
      throw new Error("Impossible de créer ou récupérer l'utilisateur");
    }

    // Récupérer la ville
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    const town = townResponse as unknown as Town;

    if (!town || !town.id) {
      throw new Error("Ville non trouvée");
    }

    // Récupérer le personnage actif
    const townCharacters = (await apiService.characters.getTownCharacters(
      town.id
    )) as any[];
    const userCharacters = townCharacters.filter(
      (char: any) => char.user?.discordId === interaction.user.id
    );
    const activeCharacter = userCharacters.find(
      (char: any) => char.isActive
    ) as ActiveCharacter | undefined;

    if (!activeCharacter) {
      return interaction.reply({
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif.`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les capacités craft du personnage
    const rawCapabilities =
      (await apiService.characters.getCharacterCapabilities(
        activeCharacter.id
      )) as any[];
    const capabilities = normalizeCapabilities(rawCapabilities);
    const craftsFromCapabilities = capabilities
      .map((cap) => ({ cap, craft: toCraftEnum(cap.name) }))
      .filter((entry) => entry.craft !== undefined);

    if (craftsFromCapabilities.length === 0) {
      return interaction.reply({
        content: "🛠️ Vous n'avez aucune capacité artisanale.",
        flags: ["Ephemeral"],
      });
    }

    const uniqueCraftEnums = Array.from(
      new Set(craftsFromCapabilities.map((entry) => entry.craft as CraftEnum))
    );

    // Récupérer tous les blueprints
    let allProjects: Project[] = [];
    for (const craftType of uniqueCraftEnums) {
      const projects = (await apiService.projects.getProjectsByCraftType(
        town.id,
        craftType
      )) as Project[];
      allProjects = allProjects.concat(
        projects.filter((p) => (p as any).isBlueprint)
      );
    }

    // Dédupliquer
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    );

    // Trier par PA manquants (du plus petit au plus grand)
    const sortedProjects = uniqueProjects.sort((a, b) => {
      const aRemaining = a.paRequired - a.paContributed;
      const bRemaining = b.paRequired - b.paContributed;
      return aRemaining - bRemaining;
    });

    if (sortedProjects.length === 0) {
      return interaction.reply({
        content: "Aucun blueprint n'est disponible pour l'instant.",
        flags: ["Ephemeral"],
      });
    }

    // Pagination
    const ITEMS_PER_PAGE = 25;
    const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(
      startIndex + ITEMS_PER_PAGE,
      sortedProjects.length
    );
    const projectsPage = sortedProjects.slice(startIndex, endIndex);

    // Créer menu de sélection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_blueprint_invest")
      .setPlaceholder("Sélectionnez un blueprint")
      .addOptions(
        projectsPage.map((project) => ({
          label: project.name && project.name.trim() !== ""
            ? `📋 ${project.name}`
            : `📋 ${getProjectOutputText(project) || "Blueprint sans nom"}`,
          description: `${project.paContributed}/${
            project.paRequired
          } PA - ${project.craftTypes
            .map((ct: any) => getCraftDisplayName(ct.craftType || ct))
            .join(", ")}`,
          value: project.id,
        }))
      );

    const components: ActionRowBuilder<any>[] = [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    ];

    // Ajouter boutons de pagination si nécessaire
    if (totalPages > 1) {
      const paginationRow = new ActionRowBuilder<ButtonBuilder>();

      if (currentPage > 0) {
        paginationRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`blueprint_participate:page:${currentPage - 1}`)
            .setLabel("◀️ Précédent")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      paginationRow.addComponents(
        new ButtonBuilder()
          .setCustomId("page_info")
          .setLabel(`Page ${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      if (currentPage < totalPages - 1) {
        paginationRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`blueprint_participate:page:${currentPage + 1}`)
            .setLabel("Suivant ▶️")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      components.push(paginationRow);
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.update({
        content: `Choisissez un blueprint dans lequel contribuer (${
          sortedProjects.length
        } blueprint${sortedProjects.length > 1 ? "s" : ""}) :`,
        components,
      });
    } else {
      await interaction.reply({
        content: `Choisissez un blueprint dans lequel contribuer (${
          sortedProjects.length
        } blueprint${sortedProjects.length > 1 ? "s" : ""}) :`,
        components,
        flags: ["Ephemeral"],
      });
    }

    // Gérer la sélection
    const filter = (i: StringSelectMenuInteraction) =>
      i.customId === "select_blueprint_invest" &&
      i.user.id === interaction.user.id;

    try {
      const response = (await interaction.channel?.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 60000,
      })) as StringSelectMenuInteraction;

      if (!response) return;

      const selectedProjectId = response.values[0];
      const selectedProject = sortedProjects.find(
        (p) => p.id === selectedProjectId
      );

      if (!selectedProject) {
        await response.update({
          content: "Blueprint non trouvé. Veuillez réessayer.",
          components: [],
        });
        return;
      }

      // Créer modal avec PA + ressources
      const modal = new ModalBuilder()
        .setCustomId(`invest_project_modal_${selectedProjectId}`)
        .setTitle(`Contribuer: ${selectedProject.name}`);

      const actionRows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

      // Champ PA
      const pointsInput = new TextInputBuilder()
        .setCustomId("points_input")
        .setLabel(
          `PA à investir (max: ${
            selectedProject.paRequired - selectedProject.paContributed
          } PA)`
        )
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder("Entrez le nombre de PA (ou 0)")
        .setMinLength(1)
        .setMaxLength(2);

      actionRows.push(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
          pointsInput,
        ])
      );

      // Champs ressources (max 4)
      if (
        selectedProject.resourceCosts &&
        selectedProject.resourceCosts.length > 0
      ) {
        const resourceCosts = selectedProject.resourceCosts.slice(0, 4);

        for (const rc of resourceCosts) {
          const remaining = rc.quantityRequired - rc.quantityContributed;
          const resourceInput = new TextInputBuilder()
            .setCustomId(`resource_${rc.resourceTypeId}`)
            .setLabel(
              `${rc.resourceType.emoji} ${rc.resourceType.name} (max: ${remaining})`
            )
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder(`0-${remaining}`)
            .setMinLength(1)
            .setMaxLength(4);

          actionRows.push(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
              [resourceInput]
            )
          );
        }
      }

      modal.addComponents(...actionRows);

      await response.showModal(modal);
    } catch (error) {
      logger.error("Erreur lors de la sélection du blueprint:", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "Temps écoulé ou erreur lors de la sélection.",
          flags: ["Ephemeral"],
        });
      }
    }
  } catch (error) {
    logger.error(
      "Erreur lors de la préparation de la participation aux blueprints :",
      {
        error,
      }
    );
    if (!interaction.replied) {
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la préparation de la participation.`,
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content: `${STATUS.ERROR} Erreur lors de la préparation de la participation.`,
        flags: ["Ephemeral"],
      });
    }
  }
}

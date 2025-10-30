import {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ComponentType,
  type CommandInteraction,
  type StringSelectMenuInteraction,
  type ModalSubmitInteraction,
  ModalActionRowComponentBuilder,
  type ChatInputCommandInteraction,
  Client,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from "discord.js";

import type {
  Project,
  ResourceCost,
  ContributionResult,
  ProjectReward,
} from "./projects.types";
import { sendLogMessage } from "../../utils/channels.js";
import { apiService } from "../../services/api/index.js";
import { logger } from "../../services/logger.js";
import {
  getStatusText,
  getStatusEmoji,
  getCraftTypeEmoji,
  getCraftDisplayName,
  toCraftEnum,
} from "./projects.utils.js";
import type { CraftEnum } from "./projects.utils.js";
import { createInfoEmbed } from "../../utils/embeds.js";
import { PROJECT, STATUS } from "../../constants/emojis";

interface Town {
  id: string;
  name: string;
}

interface ActiveCharacter {
  id: string;
  paTotal: number;
  name: string;
  townId: string;
  isDead?: boolean;
}

interface Capability {
  id: string;
  name: string;
  emojiTag: string;
  category: string;
  costPA: number;
  description: string;
}

function normalizeCapabilities(rawCapabilities: any[]): Capability[] {
  if (!rawCapabilities || rawCapabilities.length === 0) {
    return [];
  }

  return rawCapabilities.map((item) => {
    const capability = item?.capability ?? item ?? {};

    return {
      id: capability.id ?? item?.capabilityId ?? "",
      name: capability.name ?? "",
      emojiTag: capability.emojiTag ?? "",
      category: capability.category ?? "",
      costPA: capability.costPA ?? 0,
      description: capability.description ?? "",
    } as Capability;
  });
}

function getProjectOutputText(project: Project): string {
  // Ressources : 10x🥞 (quantité + emoji uniquement)
  if (project.outputResourceType && project.outputResourceTypeId !== null) {
    return `${project.outputQuantity}x${project.outputResourceType.emoji}`;
  }

  // Objets : Canari(x1) (nom + parenthèses avec quantité)
  if (project.outputObjectType && project.outputObjectTypeId !== null) {
    return `${project.outputObjectType.name}(x${project.outputQuantity})`;
  }

  // Fallbacks
  if (project.outputResourceTypeId !== null) {
    return `${project.outputQuantity}x${PROJECT.ICON}`;
  }

  if (project.outputObjectTypeId !== null) {
    return `objet(x${project.outputQuantity})`;
  }

  return "";
}

function formatRewardMessage(
  project: Project,
  reward: ProjectReward | undefined,
  finisherName?: string
): string {
  if (!reward) {
    const defaultOutput = getProjectOutputText(project);
    return defaultOutput
      ? `✅ ${defaultOutput} ajouté au stock de la ville !`
      : `${STATUS.SUCCESS} Récompense enregistrée !`;
  }

  switch (reward.type) {
    case "RESOURCE": {
      const emoji = project.outputResourceType?.emoji ?? PROJECT.ICON;
      const name = project.outputResourceType?.name ?? "ressource";
      return `✅ ${emoji} ${reward.quantity}x ${name} ajouté au stock de la ville !`;
    }
    case "RESOURCE_CONVERSION": {
      const lines = reward.resources
        .map((res) => `• ${res.quantity}x ${res.resourceName}`)
        .join("\n");
      return `📦 L'objet a été converti en ressources pour la ville :\n${lines}`;
    }
    case "OBJECT": {
      const owner = finisherName ? `à **${finisherName}**` : "à l'artisan";
      const quantityText = reward.quantity > 1 ? `${reward.quantity}x ` : "";
      return `🎁 ${quantityText}${reward.objectType.name} remis ${owner} !`;
    }
    default:
      return `${STATUS.SUCCESS} Récompense enregistrée !`;
  }
}

/**
 * Commande /projets - Affiche projets filtrés par craft capability + bouton Participer
 */
export async function handleProjectsCommand(interaction: CommandInteraction) {
  try {
    // Récupérer l'utilisateur
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    if (!user) {
      throw new Error("Impossible de créer ou récupérer l'utilisateur");
    }

    // Récupérer la ville du serveur
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    const town = townResponse as unknown as Town;

    if (!town || !town.id) {
      throw new Error("Ville non trouvée pour cette guilde");
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
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif pour voir les projets artisanaux.`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les capacités du personnage
    const rawCapabilities =
      (await apiService.characters.getCharacterCapabilities(
        activeCharacter.id
      )) as any[];
    const capabilities = normalizeCapabilities(rawCapabilities);

    // Identifier les capacités craft (tolère les alias/nouveaux noms)
    const craftsFromCapabilities = capabilities
      .map((cap: Capability) => ({ cap, craft: toCraftEnum(cap.name) }))
      .filter((entry) => entry.craft !== undefined);

    if (craftsFromCapabilities.length === 0) {
      return interaction.reply({
        content:
          "🛠️ Vous n'avez aucune capacité artisanale. Les projets sont réservés aux artisans !",
        flags: ["Ephemeral"],
      });
    }

    const uniqueCraftEnums = Array.from(
      new Set(craftsFromCapabilities.map((entry) => entry.craft!))
    );

    // Récupérer tous les projets pour chaque craft type
    let allProjects: Project[] = [];
    for (const craftType of uniqueCraftEnums) {
      const projects = (await apiService.projects.getProjectsByCraftType(
        town.id,
        craftType
      )) as Project[];
      allProjects = allProjects.concat(projects);
    }

    // Dédupliquer (un projet peut avoir plusieurs craft types)
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    );

    if (uniqueProjects.length === 0) {
      return interaction.reply({
        content:
          "Aucun projet artisanal n'a encore été créé pour vos capacités.",
        flags: ["Ephemeral"],
      });
    }

    const embed = createInfoEmbed(
      `🛠️ Projets artisanaux`,
      "Voici les projets disponibles pour vos capacités :"
    );

    // Séparer les projets en 3 catégories
    const activeProjects = uniqueProjects.filter(
      (p) => p.status === "ACTIVE" && !(p as any).isBlueprint
    );
    const blueprintProjects = uniqueProjects.filter(
      (p) => (p as any).isBlueprint
    );
    const completedProjects = uniqueProjects.filter(
      (p) => p.status === "COMPLETED"
    );

    // Fonction helper pour formater un projet
    // Format: 🔨🧵 • Nom optionnel • 10x🥞 - 0/2PA⚡|0/1🪵
    const formatProject = (project: Project) => {
      const craftEmojis = project.craftTypes
        .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
        .join("");
      const outputText = getProjectOutputText(project);

      let text = `${craftEmojis} •`;

      // Nom optionnel (si présent, ajouter avec séparateur)
      if (project.name && project.name.trim()) {
        text += ` ${project.name} •`;
      }

      // Output
      text += ` ${outputText}`;

      // PA avec emoji
      text += ` - ${project.paContributed}/${project.paRequired}PA⚡`;

      // Ressources requises
      if (project.resourceCosts && project.resourceCosts.length > 0) {
        const resourcesText = project.resourceCosts
          .map(
            (rc) =>
              `${rc.quantityContributed}/${rc.quantityRequired}${rc.resourceType.emoji}`
          )
          .join("|");
        text += `|${resourcesText}`;
      }

      return text;
    };

    // Fonction helper pour trier par type d'output puis par métier (sans sous-titres)
    const sortByCraftAndOutputType = (projects: Project[]) => {
      return projects.sort((a, b) => {
        // D'abord par type d'output (ressources avant objets)
        const aIsResource =
          a.outputResourceTypeId !== null &&
          a.outputResourceTypeId !== undefined;
        const bIsResource =
          b.outputResourceTypeId !== null &&
          b.outputResourceTypeId !== undefined;

        if (aIsResource !== bIsResource) {
          return aIsResource ? -1 : 1; // ressources en premier
        }

        // Ensuite par craft type (tri alphabétique des emojis craft)
        const aCraftKey = a.craftTypes
          .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
          .join("");
        const bCraftKey = b.craftTypes
          .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
          .join("");

        return aCraftKey.localeCompare(bCraftKey);
      });
    };

    // Field vide initial pour espacement
    embed.addFields({ name: " ", value: " ", inline: false });

    // Section 1: Projets Actifs
    if (activeProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(activeProjects);
      const sectionText = sortedProjects.map(formatProject).join("\n");

      embed.addFields({
        name: `${getStatusEmoji("ACTIVE")} Projets Actifs`,
        value: sectionText || "Aucun projet actif",
        inline: false,
      });

      // Field vide pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Section 2: Blueprints Disponibles
    if (blueprintProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(blueprintProjects);
      const sectionText = sortedProjects.map(formatProject).join("\n");

      embed.addFields({
        name: `📋 Blueprints Disponibles`,
        value: sectionText || "Aucun blueprint disponible",
        inline: false,
      });

      // Field vide pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Section 3: Projets Terminés
    if (completedProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(completedProjects);
      const sectionText = sortedProjects
        .map((p) => `✅ **${p.name}**`)
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji("COMPLETED")} Projets Terminés`,
        value: sectionText || "Aucun projet terminé",
        inline: false,
      });

      // Field vide final pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Boutons d'interaction
    const components = [];
    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    if (activeProjects.length > 0) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("project_participate")
          .setLabel("🛠️ Participer Projets")
          .setStyle(ButtonStyle.Primary)
      );
    }

    if (blueprintProjects.length > 0) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("blueprint_participate")
          .setLabel("📋 Participer Blueprints")
          .setStyle(ButtonStyle.Success)
      );
    }

    if (buttonRow.components.length > 0) {
      components.push(buttonRow);
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des projets :", { error });
    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de la récupération des projets.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Participer" - Affiche select menu des projets avec pagination
 */
export async function handleParticipateButton(interaction: ButtonInteraction) {
  try {
    // Extraire le numéro de page du customId (format: project_participate ou project_participate:page:N)
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
      .map((cap: Capability) => ({ cap, craft: toCraftEnum(cap.name) }))
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

    // Récupérer tous les projets ACTIVE (non-blueprints)
    let allProjects: Project[] = [];
    for (const craftType of uniqueCraftEnums) {
      const projects = (await apiService.projects.getProjectsByCraftType(
        town.id,
        craftType
      )) as Project[];
      allProjects = allProjects.concat(
        projects.filter((p) => p.status === "ACTIVE" && !(p as any).isBlueprint)
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
        content: "Aucun projet actif n'est disponible pour l'instant.",
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
      .setCustomId("select_project_invest")
      .setPlaceholder("Sélectionnez un projet")
      .addOptions(
        projectsPage.map((project) => ({
          label: project.name && project.name.trim() !== ""
            ? project.name
            : getProjectOutputText(project) || "Projet sans nom",
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
            .setCustomId(`project_participate:page:${currentPage - 1}`)
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
            .setCustomId(`project_participate:page:${currentPage + 1}`)
            .setLabel("Suivant ▶️")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      components.push(paginationRow);
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.update({
        content: `Choisissez un projet dans lequel contribuer (${
          sortedProjects.length
        } projet${sortedProjects.length > 1 ? "s" : ""}) :`,
        components,
      });
    } else {
      await interaction.reply({
        content: `Choisissez un projet dans lequel contribuer (${
          sortedProjects.length
        } projet${sortedProjects.length > 1 ? "s" : ""}) :`,
        components,
        flags: ["Ephemeral"],
      });
    }

    // Gérer la sélection
    const filter = (i: StringSelectMenuInteraction) =>
      i.customId === "select_project_invest" &&
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
          content: "Projet non trouvé. Veuillez réessayer.",
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
      logger.error("Erreur lors de la sélection du projet:", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "Temps écoulé ou erreur lors de la sélection.",
          flags: ["Ephemeral"],
        });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la préparation de la participation :", {
      error,
    });
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
      .map((cap: Capability) => ({ cap, craft: toCraftEnum(cap.name) }))
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

/**
 * Gère la soumission du modal d'investissement dans les projets
 */
export async function handleInvestModalSubmit(
  interaction: ModalSubmitInteraction
) {
  try {
    const customId = interaction.customId;
    const projectId = customId.replace("invest_project_modal_", "");

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

    // Récupérer personnage actif
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
      await interaction.reply({
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Vérifications état personnage
    if (activeCharacter.isDead) {
      await interaction.reply({
        content:
          "💀 Un mort ne peut pas travailler ! Votre personnage est mort.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer le projet
    const allProjects = await apiService.projects.getProjectsByTown(town.id);
    const project = allProjects.find((p: Project) => p.id === projectId);

    if (!project) {
      await interaction.reply({
        content: `${STATUS.ERROR} Projet non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Parse PA input
    const inputValue = interaction.fields.getTextInputValue("points_input");
    let points = 0;

    if (inputValue && inputValue.trim() !== "") {
      if (inputValue.includes(".") || inputValue.includes(",")) {
        await interaction.reply({
          content: `${STATUS.ERROR} Veuillez entrer un nombre entier uniquement.`,
          flags: ["Ephemeral"],
        });
        return;
      }

      points = parseInt(inputValue, 10);

      if (isNaN(points) || points < 0) {
        await interaction.reply({
          content: `${STATUS.ERROR} Veuillez entrer un nombre valide de PA.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    }

    // Parse resource contributions
    const resourceContributions: {
      resourceTypeId: number;
      quantity: number;
    }[] = [];

    if (project.resourceCosts && project.resourceCosts.length > 0) {
      for (const rc of project.resourceCosts) {
        try {
          const fieldValue = interaction.fields.getTextInputValue(
            `resource_${rc.resourceTypeId}`
          );

          if (fieldValue && fieldValue.trim() !== "") {
            const quantity = parseInt(fieldValue.trim(), 10);

            if (isNaN(quantity) || quantity < 0) {
              await interaction.reply({
                content: `${STATUS.ERROR} Quantité invalide pour ${rc.resourceType.name}`,
                flags: ["Ephemeral"],
              });
              return;
            }

            if (quantity > 0) {
              resourceContributions.push({
                resourceTypeId: rc.resourceTypeId,
                quantity,
              });
            }
          }
        } catch (error) {
          // Field doesn't exist, skip
        }
      }
    }

    // Validation: au moins PA ou ressources
    if (points === 0 && resourceContributions.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Veuillez contribuer au moins des PA ou des ressources.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Appeler l'API backend unifiée
    const result = (await apiService.projects.contributeToProject(
      activeCharacter.id,
      projectId,
      points,
      resourceContributions
    )) as ContributionResult;

    // Message de réponse
    let responseMessage = `${STATUS.SUCCESS} Contribution enregistrée au projet "${project.name}" !\n`;

    if (points > 0) {
      responseMessage += `• ${points} PA\n`;
    }

    if (resourceContributions.length > 0) {
      const resourcesText = resourceContributions
        .map((rc) => {
          const rcInfo = project.resourceCosts?.find(
            (r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId
          );
          return `• ${rcInfo?.resourceType.emoji} ${rc.quantity} ${rcInfo?.resourceType.name}`;
        })
        .join("\n");
      responseMessage += resourcesText;
    }

    // Log contribution
    const contributionParts: string[] = [];
    if (points > 0) contributionParts.push(`${points} PA`);
    if (resourceContributions.length > 0) {
      const resText = resourceContributions
        .map((rc) => {
          const rcInfo = project.resourceCosts?.find(
            (r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId
          );
          return `${rcInfo?.resourceType.emoji} ${rc.quantity} ${rcInfo?.resourceType.name}`;
        })
        .join(", ");
      contributionParts.push(resText);
    }

    const contributionLogMessage = `🛠️ **${
      activeCharacter.name
    }** a contribué ${contributionParts.join(" et ")} au projet "**${
      project.name
    }**".`;
    await sendLogMessage(
      interaction.guildId!,
      interaction.client,
      contributionLogMessage
    );

    // Vérifier complétion (projets normaux ET blueprints)
    if (result.completed && result.project) {
      const rewardText = formatRewardMessage(
        result.project,
        result.reward,
        activeCharacter.name
      );

      // Distinguer blueprint validé vs projet normal terminé
      const isBlueprint = result.project.status === "ACTIVE" && (result.project as any).isBlueprint;

      if (isBlueprint) {
        // Blueprint validé et recyclé
        const outputText = getProjectOutputText(result.project);
        responseMessage += `\n\n${PROJECT.CELEBRATION} Félicitations ! Le blueprint est validé !\n${rewardText}\n\nLe blueprint peut maintenant être utilisé pour créer ${outputText}.`;

        const completionLogMessage = `${PROJECT.CELEBRATION} Le blueprint "**${result.project.name}**" a été validé ! ${rewardText}\n\nIl peut maintenant être utilisé pour créer ${outputText}.`;
        await sendLogMessage(
          interaction.guildId!,
          interaction.client,
          completionLogMessage
        );
      } else {
        // Projet normal terminé
        responseMessage += `\n\n${PROJECT.CELEBRATION} Félicitations ! Le projet est terminé !\n${rewardText}`;

        const completionLogMessage = `${PROJECT.CELEBRATION} Le projet "**${result.project.name}**" est terminé ! ${rewardText}`;
        await sendLogMessage(
          interaction.guildId!,
          interaction.client,
          completionLogMessage
        );
      }
    }

    await interaction.reply({
      content: responseMessage,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors du traitement de la contribution:", { error });

    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors du traitement de votre contribution.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Voir les projets" depuis le profil
 * Réutilise la logique de handleProjectsCommand
 */
export async function handleViewProjectsFromProfile(
  interaction: ButtonInteraction
) {
  try {
    // Extraire les IDs du customId
    const [, characterId, userId] = interaction.customId.split(":");

    // Vérifier que l'utilisateur qui clique est bien le propriétaire
    if (interaction.user.id !== userId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous ne pouvez voir que vos propres projets.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer l'utilisateur
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    if (!user) {
      throw new Error("Impossible de créer ou récupérer l'utilisateur");
    }

    // Récupérer la ville du serveur
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    const town = townResponse as unknown as Town;

    if (!town || !town.id) {
      throw new Error("Ville non trouvée pour cette guilde");
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
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif pour voir les projets artisanaux.`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les capacités du personnage
    const rawCapabilities =
      (await apiService.characters.getCharacterCapabilities(
        activeCharacter.id
      )) as any[];
    const capabilities = normalizeCapabilities(rawCapabilities);

    // Filtrer les capacités craft
    const craftsFromCapabilities = capabilities
      .map((cap: Capability) => ({ cap, craft: toCraftEnum(cap.name) }))
      .filter((entry) => entry.craft !== undefined);

    if (craftsFromCapabilities.length === 0) {
      return interaction.reply({
        content:
          "🛠️ Vous n'avez aucune capacité artisanale. Les projets sont réservés aux artisans !",
        flags: ["Ephemeral"],
      });
    }

    const uniqueCraftEnums = Array.from(
      new Set(craftsFromCapabilities.map((entry) => entry.craft as CraftEnum))
    );

    // Récupérer tous les projets pour chaque craft type
    let allProjects: Project[] = [];
    for (const craftType of uniqueCraftEnums) {
      const projects = await apiService.projects.getProjectsByCraftType(
        town.id,
        craftType
      );
      allProjects = allProjects.concat(projects);
    }

    // Dédupliquer (un projet peut avoir plusieurs craft types)
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    );

    if (uniqueProjects.length === 0) {
      return interaction.reply({
        content:
          "Aucun projet artisanal n'a encore été créé pour vos capacités.",
        flags: ["Ephemeral"],
      });
    }

    const embed = createInfoEmbed(
      `🛠️ Projets artisanaux`,
      "Voici les projets disponibles pour vos capacités :"
    );

    // Séparer les projets en 3 catégories
    const activeProjects = uniqueProjects.filter(
      (p) => p.status === "ACTIVE" && !(p as any).isBlueprint
    );
    const blueprintProjects = uniqueProjects.filter(
      (p) => (p as any).isBlueprint
    );
    const completedProjects = uniqueProjects.filter(
      (p) => p.status === "COMPLETED"
    );

    // Fonction helper pour formater un projet
    // Format: 🔨🧵 • Nom optionnel • 10x🥞 - 0/2PA⚡|0/1🪵
    const formatProject = (project: Project) => {
      const craftEmojis = project.craftTypes
        .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
        .join("");
      const outputText = getProjectOutputText(project);

      let text = `${craftEmojis} •`;

      // Nom optionnel (si présent, ajouter avec séparateur)
      if (project.name && project.name.trim()) {
        text += ` ${project.name} •`;
      }

      // Output
      text += ` ${outputText}`;

      // PA avec emoji
      text += ` - ${project.paContributed}/${project.paRequired}PA⚡`;

      // Ressources requises
      if (project.resourceCosts && project.resourceCosts.length > 0) {
        const resourcesText = project.resourceCosts
          .map(
            (rc) =>
              `${rc.quantityContributed}/${rc.quantityRequired}${rc.resourceType.emoji}`
          )
          .join("|");
        text += `|${resourcesText}`;
      }

      return text;
    };

    // Fonction helper pour trier par type d'output puis par métier (sans sous-titres)
    const sortByCraftAndOutputType = (projects: Project[]) => {
      return projects.sort((a, b) => {
        // D'abord par type d'output (ressources avant objets)
        const aIsResource =
          a.outputResourceTypeId !== null &&
          a.outputResourceTypeId !== undefined;
        const bIsResource =
          b.outputResourceTypeId !== null &&
          b.outputResourceTypeId !== undefined;

        if (aIsResource !== bIsResource) {
          return aIsResource ? -1 : 1; // ressources en premier
        }

        // Ensuite par craft type (tri alphabétique des emojis craft)
        const aCraftKey = a.craftTypes
          .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
          .join("");
        const bCraftKey = b.craftTypes
          .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
          .join("");

        return aCraftKey.localeCompare(bCraftKey);
      });
    };

    // Field vide initial pour espacement
    embed.addFields({ name: " ", value: " ", inline: false });

    // Section 1: Projets Actifs
    if (activeProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(activeProjects);
      const sectionText = sortedProjects.map(formatProject).join("\n");

      embed.addFields({
        name: `${getStatusEmoji("ACTIVE")} Projets Actifs`,
        value: sectionText || "Aucun projet actif",
        inline: false,
      });

      // Field vide pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Section 2: Blueprints Disponibles
    if (blueprintProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(blueprintProjects);
      const sectionText = sortedProjects.map(formatProject).join("\n");

      embed.addFields({
        name: `📋 Blueprints Disponibles`,
        value: sectionText || "Aucun blueprint disponible",
        inline: false,
      });

      // Field vide pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Section 3: Projets Terminés
    if (completedProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(completedProjects);
      const sectionText = sortedProjects
        .map((p) => `✅ **${p.name}**`)
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji("COMPLETED")} Projets Terminés`,
        value: sectionText || "Aucun projet terminé",
        inline: false,
      });

      // Field vide final pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Boutons d'interaction
    const components = [];
    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    if (activeProjects.length > 0) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("project_participate")
          .setLabel("🛠️ Participer Projets")
          .setStyle(ButtonStyle.Primary)
      );
    }

    if (blueprintProjects.length > 0) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("blueprint_participate")
          .setLabel("📋 Participer Blueprints")
          .setStyle(ButtonStyle.Success)
      );
    }

    if (buttonRow.components.length > 0) {
      components.push(buttonRow);
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage des projets depuis le profil :", {
      error,
    });
    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage des projets.`,
      flags: ["Ephemeral"],
    });
  }
}

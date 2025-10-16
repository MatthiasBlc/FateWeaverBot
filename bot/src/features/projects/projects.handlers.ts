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

interface ResourceCost {
  id: string;
  resourceTypeId: number;
  quantityRequired: number;
  quantityContributed: number;
  resourceType: {
    id: number;
    name: string;
    emoji: string;
  };
}

interface Project {
  id: string;
  name: string;
  paRequired: number;
  paContributed: number;
  status: "ACTIVE" | "COMPLETED";
  townId: string;
  createdBy: string;
  craftTypes: string[];
  outputResourceTypeId: number;
  outputQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  resourceCosts?: ResourceCost[];
  outputResourceType?: {
    id: number;
    name: string;
    emoji: string;
  };
}

interface Capability {
  id: string;
  name: string;
  emojiTag: string;
  category: string;
  costPA: number;
  description: string;
}

import { sendLogMessage } from "../../utils/channels.js";
import { apiService } from "../../services/api/index.js";
import { logger } from "../../services/logger.js";
import { getStatusText, getStatusEmoji, getCraftTypeEmoji } from "./projects.utils.js";
import { createInfoEmbed } from "../../utils/embeds.js";
import { PROJECT, STATUS } from "../../constants/emojis.js";

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
    const activeCharacter = userCharacters.find((char: any) => char.isActive) as ActiveCharacter | undefined;

    if (!activeCharacter) {
      return interaction.reply({
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif pour voir les projets artisanaux.`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les capacités du personnage
    const capabilities = await apiService.characters.getCharacterCapabilities(activeCharacter.id) as Capability[];

    // Filtrer les capacités craft
    const craftCapabilities = capabilities.filter((cap: Capability) =>
      ["Tisser", "Forger", "Menuiser"].includes(cap.name)
    );

    if (craftCapabilities.length === 0) {
      return interaction.reply({
        content: "🛠️ Vous n'avez aucune capacité artisanale. Les projets sont réservés aux artisans !",
        flags: ["Ephemeral"],
      });
    }

    // Mapper les capacités aux CraftTypes
    const craftTypeMap: Record<string, string> = {
      "Tisser": "TISSER",
      "Forger": "FORGER",
      "Menuiser": "MENUISER"
    };

    // Récupérer tous les projets pour chaque craft type
    let allProjects: Project[] = [];
    for (const cap of craftCapabilities) {
      const craftType = craftTypeMap[cap.name];
      if (craftType) {
        const projects = await apiService.projects.getProjectsByCraftType(town.id, craftType);
        allProjects = allProjects.concat(projects);
      }
    }

    // Dédupliquer (un projet peut avoir plusieurs craft types)
    const uniqueProjects = Array.from(
      new Map(allProjects.map(p => [p.id, p])).values()
    );

    if (uniqueProjects.length === 0) {
      return interaction.reply({
        content: "Aucun projet artisanal n'a encore été créé pour vos capacités.",
        flags: ["Ephemeral"],
      });
    }

    const embed = createInfoEmbed(
      `🛠️ Projets artisanaux`,
      "Voici les projets disponibles pour vos capacités :"
    );

    // Grouper par statut
    const projectsParStatut = uniqueProjects.reduce<Record<string, Project[]>>(
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

          // Output resource
          const outputText = project.outputResourceType
            ? `${project.outputResourceType.emoji} ${project.outputQuantity}x ${project.outputResourceType.name}`
            : "";

          let text = `${craftEmojis} **${project.name}** - ${project.paContributed}/${project.paRequired} PA`;

          if (outputText) {
            text += ` → ${outputText}`;
          }

          // Ressources requises
          if (project.resourceCosts && project.resourceCosts.length > 0) {
            const resourcesText = project.resourceCosts
              .map(
                (rc) =>
                  `${rc.resourceType.emoji} ${rc.quantityContributed}/${rc.quantityRequired}`
              )
              .join(" ");
            text += ` | ${resourcesText}`;
          }

          // Show blueprint info if applicable
          if ((project as any).isBlueprint) {
            const blueprintPA = (project as any).paBlueprintRequired ?? project.paRequired;
            text += `\n📋 **Blueprint** - Peut être recommencé pour ${blueprintPA} PA`;

            if ((project as any).blueprintResourceCosts && (project as any).blueprintResourceCosts.length > 0) {
              text += "\n**Coûts Blueprint:**\n";
              (project as any).blueprintResourceCosts.forEach((cost: any) => {
                text += `  • ${cost.quantityRequired} ${cost.resourceType.name}\n`;
              });
            }
          }

          return text;
        })
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
        value: projectsText || "Aucun projet dans cette catégorie",
        inline: false,
      });
    }

    // Bouton "Participer" si au moins un projet ACTIVE
    const activeProjects = uniqueProjects.filter((p) => p.status === "ACTIVE");
    const blueprintProjects = uniqueProjects.filter((p) => (p as any).isBlueprint);

    const components = [];

    if (activeProjects.length > 0) {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("project_participate")
          .setLabel("🛠️ Participer")
          .setStyle(ButtonStyle.Primary)
      );
      components.push(buttonRow);
    }

    // Add restart buttons for blueprints (up to 5 buttons per row)
    if (blueprintProjects.length > 0) {
      const restartButtons = blueprintProjects.slice(0, 5).map((project) =>
        new ButtonBuilder()
          .setCustomId(`project_restart:${project.id}`)
          .setLabel(`🔄 ${project.name}`)
          .setStyle(ButtonStyle.Success)
      );

      // Group buttons in rows of up to 5
      for (let i = 0; i < restartButtons.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...restartButtons.slice(i, i + 5)
        );
        components.push(row);
      }
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"]
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des projets :", { error });
    await interaction.reply({
      content: "❌ Erreur lors de la récupération des projets.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Participer" - Affiche select menu des projets
 */
export async function handleParticipateButton(interaction: ButtonInteraction) {
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
    const activeCharacter = userCharacters.find((char: any) => char.isActive) as ActiveCharacter | undefined;

    if (!activeCharacter) {
      return interaction.reply({
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif.`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les capacités craft du personnage
    const capabilities = await apiService.characters.getCharacterCapabilities(activeCharacter.id) as Capability[];
    const craftCapabilities = capabilities.filter((cap: Capability) =>
      ["Tisser", "Forger", "Menuiser"].includes(cap.name)
    );

    if (craftCapabilities.length === 0) {
      return interaction.reply({
        content: "🛠️ Vous n'avez aucune capacité artisanale.",
        flags: ["Ephemeral"],
      });
    }

    // Mapper craft types
    const craftTypeMap: Record<string, string> = {
      "Tisser": "TISSER",
      "Forger": "FORGER",
      "Menuiser": "MENUISER"
    };

    // Récupérer tous les projets ACTIVE
    let allProjects: Project[] = [];
    for (const cap of craftCapabilities) {
      const craftType = craftTypeMap[cap.name];
      if (craftType) {
        const projects = await apiService.projects.getProjectsByCraftType(town.id, craftType);
        allProjects = allProjects.concat(projects.filter((p: Project) => p.status === "ACTIVE"));
      }
    }

    // Dédupliquer
    const uniqueProjects = Array.from(
      new Map(allProjects.map(p => [p.id, p])).values()
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

    // Créer menu de sélection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_project_invest")
      .setPlaceholder("Sélectionnez un projet")
      .addOptions(
        sortedProjects.map((project) => ({
          label: project.name,
          description: `${project.paContributed}/${project.paRequired} PA - ${project.craftTypes.join(", ")}`,
          value: project.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez un projet dans lequel contribuer :",
      components: [row],
      flags: ["Ephemeral"],
    });

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
      if (selectedProject.resourceCosts && selectedProject.resourceCosts.length > 0) {
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
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
              resourceInput,
            ])
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
        content: "❌ Erreur lors de la préparation de la participation.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content: "❌ Erreur lors de la préparation de la participation.",
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
    const activeCharacter = userCharacters.find((char: any) => char.isActive) as ActiveCharacter | undefined;

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
        content: "💀 Un mort ne peut pas travailler ! Votre personnage est mort.",
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
      if (inputValue.includes('.') || inputValue.includes(',')) {
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
    const resourceContributions: { resourceTypeId: number; quantity: number }[] = [];

    if (project.resourceCosts && project.resourceCosts.length > 0) {
      for (const rc of project.resourceCosts) {
        try {
          const fieldValue = interaction.fields.getTextInputValue(`resource_${rc.resourceTypeId}`);

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
    const result = await apiService.projects.contributeToProject(
      activeCharacter.id,
      projectId,
      points,
      resourceContributions
    );

    // Message de réponse
    let responseMessage = `${STATUS.SUCCESS} Contribution enregistrée au projet "${project.name}" !\n`;

    if (points > 0) {
      responseMessage += `• ${points} PA\n`;
    }

    if (resourceContributions.length > 0) {
      const resourcesText = resourceContributions
        .map((rc) => {
          const rcInfo = project.resourceCosts?.find((r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId);
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
          const rcInfo = project.resourceCosts?.find((r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId);
          return `${rcInfo?.resourceType.emoji} ${rc.quantity} ${rcInfo?.resourceType.name}`;
        })
        .join(", ");
      contributionParts.push(resText);
    }

    const contributionLogMessage = `🛠️ **${activeCharacter.name}** a contribué ${contributionParts.join(" et ")} au projet "**${project.name}**".`;
    await sendLogMessage(interaction.guildId!, interaction.client, contributionLogMessage);

    // Vérifier complétion
    if (result.project && result.project.status === "COMPLETED") {
      const outputText = project.outputResourceType
        ? `${project.outputResourceType.emoji} ${project.outputQuantity}x ${project.outputResourceType.name}`
        : "ressources";

      responseMessage += `\n\n${PROJECT.CELEBRATION} Félicitations ! Le projet est terminé !\n✅ ${outputText} ajouté au stock de la ville !`;

      const completionLogMessage = `${PROJECT.CELEBRATION} Le projet "**${project.name}**" est terminé ! ${outputText} a été ajouté au stock.`;
      await sendLogMessage(interaction.guildId!, interaction.client, completionLogMessage);
    }

    await interaction.reply({
      content: responseMessage,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors du traitement de la contribution:", { error });

    await interaction.reply({
      content: "❌ Erreur lors du traitement de votre contribution.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Recommencer" des blueprints
 */
export async function handleRestartBlueprintButton(interaction: ButtonInteraction): Promise<void> {
  try {
    const projectId = interaction.customId.split(":")[1];

    // Récupérer l'utilisateur
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    if (!user) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Restart blueprint
    const newProject = await apiService.projects.restartBlueprint(
      parseInt(projectId),
      interaction.user.id
    );

    await interaction.reply({
      content: `✅ Blueprint **${newProject.name}** redémarré avec succès !`,
      flags: ["Ephemeral"],
    });

    // Optionally refresh the project list
    await interaction.followUp({
      content: "🔄 Projet redémarré ! Consultez le bouton 'Projets' dans votre profil pour voir la liste mise à jour.",
      flags: ["Ephemeral"],
    });
  } catch (error: any) {
    console.error("Error restarting blueprint:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Voir les projets" depuis le profil
 * Réutilise la logique de handleProjectsCommand
 */
export async function handleViewProjectsFromProfile(interaction: ButtonInteraction) {
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
    const activeCharacter = userCharacters.find((char: any) => char.isActive) as ActiveCharacter | undefined;

    if (!activeCharacter) {
      return interaction.reply({
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif pour voir les projets artisanaux.`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les capacités du personnage
    const capabilities = await apiService.characters.getCharacterCapabilities(activeCharacter.id) as Capability[];

    // Filtrer les capacités craft
    const craftCapabilities = capabilities.filter((cap: Capability) =>
      ["Tisser", "Forger", "Menuiser"].includes(cap.name)
    );

    if (craftCapabilities.length === 0) {
      return interaction.reply({
        content: "🛠️ Vous n'avez aucune capacité artisanale. Les projets sont réservés aux artisans !",
        flags: ["Ephemeral"],
      });
    }

    // Mapper les capacités aux CraftTypes
    const craftTypeMap: Record<string, string> = {
      "Tisser": "TISSER",
      "Forger": "FORGER",
      "Menuiser": "MENUISER"
    };

    // Récupérer tous les projets pour chaque craft type
    let allProjects: Project[] = [];
    for (const cap of craftCapabilities) {
      const craftType = craftTypeMap[cap.name];
      if (craftType) {
        const projects = await apiService.projects.getProjectsByCraftType(town.id, craftType);
        allProjects = allProjects.concat(projects);
      }
    }

    // Dédupliquer (un projet peut avoir plusieurs craft types)
    const uniqueProjects = Array.from(
      new Map(allProjects.map(p => [p.id, p])).values()
    );

    if (uniqueProjects.length === 0) {
      return interaction.reply({
        content: "Aucun projet artisanal n'a encore été créé pour vos capacités.",
        flags: ["Ephemeral"],
      });
    }

    const embed = createInfoEmbed(
      `🛠️ Projets artisanaux`,
      "Voici les projets disponibles pour vos capacités :"
    );

    // Grouper par statut
    const projectsParStatut = uniqueProjects.reduce<Record<string, Project[]>>(
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

          // Output resource
          const outputText = project.outputResourceType
            ? `${project.outputResourceType.emoji} ${project.outputQuantity}x ${project.outputResourceType.name}`
            : "";

          let text = `${craftEmojis} **${project.name}** - ${project.paContributed}/${project.paRequired} PA`;

          if (outputText) {
            text += ` → ${outputText}`;
          }

          // Ressources requises
          if (project.resourceCosts && project.resourceCosts.length > 0) {
            const resourcesText = project.resourceCosts
              .map(
                (rc) =>
                  `${rc.resourceType.emoji} ${rc.quantityContributed}/${rc.quantityRequired}`
              )
              .join(" ");
            text += ` | ${resourcesText}`;
          }

          // Show blueprint info if applicable
          if ((project as any).isBlueprint) {
            const blueprintPA = (project as any).paBlueprintRequired ?? project.paRequired;
            text += `\n📋 **Blueprint** - Peut être recommencé pour ${blueprintPA} PA`;

            if ((project as any).blueprintResourceCosts && (project as any).blueprintResourceCosts.length > 0) {
              text += "\n**Coûts Blueprint:**\n";
              (project as any).blueprintResourceCosts.forEach((cost: any) => {
                text += `  • ${cost.quantityRequired} ${cost.resourceType.name}\n`;
              });
            }
          }

          return text;
        })
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
        value: projectsText || "Aucun projet dans cette catégorie",
        inline: false,
      });
    }

    // Bouton "Participer" si au moins un projet ACTIVE
    const activeProjects = uniqueProjects.filter((p) => p.status === "ACTIVE");
    const blueprintProjects = uniqueProjects.filter((p) => (p as any).isBlueprint);

    const components = [];

    if (activeProjects.length > 0) {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("project_participate")
          .setLabel("🛠️ Participer")
          .setStyle(ButtonStyle.Primary)
      );
      components.push(buttonRow);
    }

    // Add restart buttons for blueprints (up to 5 buttons per row)
    if (blueprintProjects.length > 0) {
      const restartButtons = blueprintProjects.slice(0, 5).map((project) =>
        new ButtonBuilder()
          .setCustomId(`project_restart:${project.id}`)
          .setLabel(`🔄 ${project.name}`)
          .setStyle(ButtonStyle.Success)
      );

      // Group buttons in rows of up to 5
      for (let i = 0; i < restartButtons.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...restartButtons.slice(i, i + 5)
        );
        components.push(row);
      }
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"]
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage des projets depuis le profil :", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'affichage des projets.",
      flags: ["Ephemeral"],
    });
  }
}

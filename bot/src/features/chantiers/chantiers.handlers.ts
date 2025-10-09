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
} from "discord.js";

interface Town {
  id: string;
  name: string;
  foodStock: number;
}

interface ActiveCharacter {
  id: string;
  paTotal: number;
  name: string;
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

interface Chantier {
  id: string;
  name: string;
  cost: number;
  spendOnIt: number;
  status: "PLAN" | "IN_PROGRESS" | "COMPLETED";
  townId: string;
  createdBy: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resourceCosts?: ResourceCost[];
}

interface InvestResult {
  success: boolean;
  chantier: Chantier;
  pointsInvested: number;
  remainingPoints: number;
  isCompleted: boolean;
}
import { sendLogMessage } from "../../utils/channels.js";
import { apiService } from "../../services/api/index.js";
import { logger } from "../../services/logger.js";
import { checkAdmin } from "../../utils/roles.js";
import { getStatusText, getStatusEmoji } from "./chantiers.utils.js";
import { createInfoEmbed } from "../../utils/embeds.js";
import { CHANTIER, STATUS, ACTIONS } from "../../constants/emojis.js";

/**
 * Nouvelle commande /chantiers unifiée - Affiche liste + bouton Participer
 */
export async function handleChantiersCommand(interaction: CommandInteraction) {
  try {
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'a encore été créé sur ce serveur.",
        flags: ["Ephemeral"],
      });
    }

    const embed = createInfoEmbed(
      `${CHANTIER.ICON} Liste des chantiers`,
      "Voici la liste des chantiers en cours sur ce serveur :"
    );

    // Grouper les chantiers par statut
    const chantiersParStatut = chantiers.reduce<Record<string, Chantier[]>>(
      (acc, chantier) => {
        if (!acc[chantier.status]) {
          acc[chantier.status] = [];
        }
        acc[chantier.status].push(chantier);
        return acc;
      },
      {}
    );

    // Ajouter une section pour chaque statut
    for (const [statut, listeChantiers] of Object.entries(chantiersParStatut)) {
      const chantiersText = listeChantiers
        .map((chantier) => {
          let text = `**${chantier.name}** - ${chantier.spendOnIt}/${chantier.cost} PA`;

          // Ajouter les ressources si présentes
          if (chantier.resourceCosts && chantier.resourceCosts.length > 0) {
            const resourcesText = chantier.resourceCosts
              .map(
                (rc) =>
                  `${rc.resourceType.emoji} ${rc.quantityContributed}/${rc.quantityRequired}`
              )
              .join(" ");
            text += ` | ${resourcesText}`;
          }

          return text;
        })
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
        value: chantiersText || "Aucun chantier dans cette catégorie",
        inline: false,
      });
    }

    // Ajouter bouton "Participer" si au moins un chantier est disponible (non COMPLETED)
    const availableChantiers = chantiers.filter((c) => c.status !== "COMPLETED");
    const components = [];

    if (availableChantiers.length > 0) {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("chantier_participate")
          .setLabel("🏗️ Participer")
          .setStyle(ButtonStyle.Primary)
      );
      components.push(buttonRow);
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"]
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des chantiers :", { error });
    await interaction.reply({
      content: "Une erreur est survenue lors de la récupération des chantiers.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleListCommand(interaction: CommandInteraction) {
  try {
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'a encore été créé sur ce serveur.",
        flags: ["Ephemeral"],
      });
    }

    const embed = createInfoEmbed(
      `${CHANTIER.ICON} Liste des chantiers`,
      "Voici la liste des chantiers en cours sur ce serveur :"
    );

    // Grouper les chantiers par statut
    const chantiersParStatut = chantiers.reduce<Record<string, Chantier[]>>(
      (acc, chantier) => {
        if (!acc[chantier.status]) {
          acc[chantier.status] = [];
        }
        acc[chantier.status].push(chantier);
        return acc;
      },
      {}
    );

    // Ajouter une section pour chaque statut
    for (const [statut, listeChantiers] of Object.entries(chantiersParStatut)) {
      const chantiersText = listeChantiers
        .map(
          (chantier) =>
            `**${chantier.name}** - ${chantier.spendOnIt}/${chantier.cost} PA`
        )
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
        value: chantiersText || "Aucun chantier dans cette catégorie",
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la récupération des chantiers :", { error });
    await interaction.reply({
      content: "Une erreur est survenue lors de la récupération des chantiers.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour le bouton "Participer" - Affiche select menu des chantiers
 */
export async function handleParticipateButton(interaction: any) {
  try {
    // Récupérer les chantiers de la guilde
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    // Filtrer et trier les chantiers selon les critères
    const availableChantiers = chantiers
      .filter((c) => c.status !== "COMPLETED") // Exclure les chantiers terminés
      .sort((a, b) => {
        // Trier d'abord par statut (EN_COURS avant PLAN)
        if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
        if (a.status !== "IN_PROGRESS" && b.status === "IN_PROGRESS") return 1;

        // Ensuite par nombre de PA manquants (du plus petit au plus grand)
        const aRemaining = a.cost - a.spendOnIt;
        const bRemaining = b.cost - b.spendOnIt;
        return aRemaining - bRemaining;
      });

    if (availableChantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'est disponible pour l'instant.",
        flags: ["Ephemeral"],
      });
    }

    // Créer un menu de sélection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_chantier_invest")
      .setPlaceholder("Sélectionnez un chantier")
      .addOptions(
        availableChantiers.map((chantier) => ({
          label: chantier.name,
          description: `${chantier.spendOnIt}/${
            chantier.cost
          } PA - ${getStatusText(chantier.status)}`,
          value: chantier.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez un chantier dans lequel investir :",
      components: [row],
      flags: ["Ephemeral"],
    });

    // Gérer la sélection du chantier
    const filter = (i: StringSelectMenuInteraction) =>
      i.customId === "select_chantier_invest" &&
      i.user.id === interaction.user.id;

    try {
      const response = (await interaction.channel?.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 60000, // 1 minute pour choisir
      })) as StringSelectMenuInteraction;

      if (!response) return;

      const selectedChantierId = response.values[0];
      const selectedChantier = availableChantiers.find(
        (c) => c.id === selectedChantierId
      );

      if (!selectedChantier) {
        await response.update({
          content: "Chantier non trouvé. Veuillez réessayer.",
          components: [],
        });
        return;
      }

      // Demander le nombre de PA à investir avec l'ID du chantier encodé dans le custom ID du modal
      const modal = new ModalBuilder()
        .setCustomId(`invest_modal_${selectedChantierId}`)
        .setTitle(`Investir dans ${selectedChantier.name}`);

      const actionRows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

      // Champ PA (toujours présent)
      const pointsInput = new TextInputBuilder()
        .setCustomId("points_input")
        .setLabel(
          `PA à investir (max: ${
            selectedChantier.cost - selectedChantier.spendOnIt
          } PA)`
        )
        .setStyle(TextInputStyle.Short)
        .setRequired(false) // Optionnel si ressources requises
        .setPlaceholder("Entrez le nombre de PA (ou 0)")
        .setMinLength(1)
        .setMaxLength(2);

      actionRows.push(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
          pointsInput,
        ])
      );

      // Ajouter champs pour les ressources requises (max 4 ressources)
      if (selectedChantier.resourceCosts && selectedChantier.resourceCosts.length > 0) {
        const resourceCosts = selectedChantier.resourceCosts.slice(0, 4); // Max 4 ressources (5 champs max - 1 pour PA)

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

      // La soumission du modal sera gérée par handleInvestModalSubmit via le système centralisé
    } catch (error) {
      logger.error("Erreur lors de la sélection du chantier:", { error });
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
        content:
          "Une erreur est survenue lors de la préparation de la participation.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content:
          "Une erreur est survenue lors de la préparation de la participation.",
        flags: ["Ephemeral"],
      });
    }
  }
}

export async function handleInvestCommand(interaction: CommandInteraction) {
  try {
    // Récupérer les chantiers de la guilde
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    // Filtrer et trier les chantiers selon les critères
    const availableChantiers = chantiers
      .filter((c) => c.status !== "COMPLETED") // Exclure les chantiers terminés
      .sort((a, b) => {
        // Trier d'abord par statut (EN_COURS avant PLAN)
        if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
        if (a.status !== "IN_PROGRESS" && b.status === "IN_PROGRESS") return 1;

        // Ensuite par nombre de PA manquants (du plus petit au plus grand)
        const aRemaining = a.cost - a.spendOnIt;
        const bRemaining = b.cost - b.spendOnIt;
        return aRemaining - bRemaining;
      });

    if (availableChantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'est disponible pour l'instant.",
        flags: ["Ephemeral"],
      });
    }

    // Créer un menu de sélection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_chantier_invest")
      .setPlaceholder("Sélectionnez un chantier")
      .addOptions(
        availableChantiers.map((chantier) => ({
          label: chantier.name,
          description: `${chantier.spendOnIt}/${
            chantier.cost
          } PA - ${getStatusText(chantier.status)}`,
          value: chantier.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez un chantier dans lequel investir :",
      components: [row],
      flags: ["Ephemeral"],
    });

    // Gérer la sélection du chantier
    const filter = (i: StringSelectMenuInteraction) =>
      i.customId === "select_chantier_invest" &&
      i.user.id === interaction.user.id;

    try {
      const response = (await interaction.channel?.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 60000, // 1 minute pour choisir
      })) as StringSelectMenuInteraction;

      if (!response) return;

      const selectedChantierId = response.values[0];
      const selectedChantier = availableChantiers.find(
        (c) => c.id === selectedChantierId
      );

      if (!selectedChantier) {
        await response.update({
          content: "Chantier non trouvé. Veuillez réessayer.",
          components: [],
        });
        return;
      }

      // Demander le nombre de PA à investir avec l'ID du chantier encodé dans le custom ID du modal
      const modal = new ModalBuilder()
        .setCustomId(`invest_modal_${selectedChantierId}`)
        .setTitle(`Investir dans ${selectedChantier.name}`);

      const pointsInput = new TextInputBuilder()
        .setCustomId("points_input")
        .setLabel(
          `PA à investir (max: ${
            selectedChantier.cost - selectedChantier.spendOnIt
          } PA)`
        )
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder("Entrez le nombre de PA à investir")
        .setMinLength(1)
        .setMaxLength(2); // Max 2 chiffres (0-99)

      const firstActionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
          pointsInput,
        ]);
      modal.addComponents(firstActionRow);

      await response.showModal(modal);

      // La soumission du modal sera gérée par handleInvestModalSubmit via le système centralisé
    } catch (error) {
      logger.error("Erreur lors de la sélection du chantier:", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "Temps écoulé ou erreur lors de la sélection.",
          flags: ["Ephemeral"],
        });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la préparation de l'investissement :", {
      error,
    });
    if (!interaction.replied) {
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la préparation de l'investissement.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content:
          "Une erreur est survenue lors de la préparation de l'investissement.",
        flags: ["Ephemeral"],
      });
    }
  }
}

/**
 * Handler pour la commande /chantiers-admin add
 * Ouvre un modal pour saisir nom et coût PA
 */
export async function handleAddChantierCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Créer le modal de création de chantier
    const modal = new ModalBuilder()
      .setCustomId("chantier_create_modal")
      .setTitle("Créer un nouveau chantier");

    const nameInput = new TextInputBuilder()
      .setCustomId("chantier_name")
      .setLabel("Nom du chantier")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setPlaceholder("Ex: Construction du pont");

    const costInput = new TextInputBuilder()
      .setCustomId("chantier_cost")
      .setLabel("Coût en points d'action (PA)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(4)
      .setPlaceholder("Ex: 100");

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(costInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur lors de l'ouverture du modal de création:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'ouverture du formulaire de création.",
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la soumission du modal d'investissement dans les chantiers
 */
export async function handleInvestModalSubmit(
  interaction: ModalSubmitInteraction
) {
  try {
    const customId = interaction.customId;
    const chantierId = customId.replace("invest_modal_", "");

    // Récupérer le chantier depuis l'API
    const chantiers = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );
    const chantier = chantiers.find((c: Chantier) => c.id === chantierId);

    if (!chantier) {
      await interaction.reply({
        content: `${STATUS.ERROR} Chantier non trouvé.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Parse PA input (now optional)
    const inputValue = interaction.fields.getTextInputValue("points_input");
    let points = 0;

    if (inputValue && inputValue.trim() !== "") {
      // Vérifier si c'est un nombre décimal
      if (inputValue.includes('.') || inputValue.includes(',')) {
        await interaction.reply({
          content:
            `${STATUS.ERROR} Veuillez entrer un nombre entier uniquement (pas de décimales).`,
          flags: ["Ephemeral"],
        });
        return;
      }

      points = parseInt(inputValue, 10);

      // Validation des points
      if (isNaN(points) || points < 0) {
        await interaction.reply({
          content:
            `${STATUS.ERROR} Veuillez entrer un nombre valide de points d'action (entiers uniquement, 0 ou plus).`,
          flags: ["Ephemeral"],
        });
        return;
      }
    }

    // Parse resource contributions from modal
    const resourceContributions: { resourceTypeId: number; quantity: number }[] = [];

    if (chantier.resourceCosts && chantier.resourceCosts.length > 0) {
      for (const rc of chantier.resourceCosts) {
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

    // Validation: at least PA or resources
    if (points === 0 && resourceContributions.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Veuillez contribuer au moins des PA ou des ressources.`,
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

    // Récupérer tous les personnages de la ville et trouver celui de l'utilisateur
    const townCharacters = (await apiService.characters.getTownCharacters(
      town.id
    )) as any[];
    const userCharacters = townCharacters.filter(
      (char: any) => char.user?.discordId === interaction.user.id
    );
    const activeCharacter = userCharacters.find((char: any) => char.isActive);

    if (!activeCharacter) {
      // Vérifier si l'utilisateur a besoin de créer un personnage
      const needsCreation = await apiService.characters.needsCharacterCreation(
        user.id,
        town.id
      );

      if (needsCreation) {
        // Proposer la création de personnage via le système de modales
        const { checkAndPromptCharacterCreation } = await import(
          "../../modals/character-modals.ts"
        );
        const modalShown = await checkAndPromptCharacterCreation(interaction);

        if (modalShown) {
          // Ne pas répondre à l'interaction actuelle, laisser le système de création gérer
          return;
        }
      }

      await interaction.reply({
        content:
          `${STATUS.ERROR} Vous devez avoir un personnage actif pour investir dans les chantiers. Utilisez la commande \`/create-character\` pour créer votre personnage.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Vérifier que le personnage est actif et vivant
    if (!activeCharacter.isActive) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Votre personnage est inactif et ne peut pas investir dans les chantiers.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (activeCharacter.isDead) {
      await interaction.reply({
        content:
          "💀 Un mort ne construit pas de chantier ! Votre personnage est mort et ne peut pas investir.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (activeCharacter.paTotal <= 0) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Votre personnage n'a plus de points d'action pour investir dans ce chantier.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Calculer les PA restants nécessaires pour terminer le chantier
    const remainingPAForChantier = chantier.cost - chantier.spendOnIt;

    // Variables pour suivre les ajustements effectués
    let adjustedForChantierLimit = false;
    let usedAllAvailablePA = false;

    // Cas spécial : l'utilisateur veut investir plus de PA que nécessaire pour terminer le chantier
    if (points > remainingPAForChantier) {
      // Utiliser seulement les PA nécessaires pour terminer le chantier
      points = remainingPAForChantier;
      adjustedForChantierLimit = true;
    }

    // Cas spécial : l'utilisateur n'a pas assez de PA pour investir ce qu'il veut
    if (activeCharacter.paTotal < points) {
      // Utiliser tous les PA disponibles
      points = activeCharacter.paTotal;
      usedAllAvailablePA = true;
    }

    // Call appropriate API based on what's being contributed
    let responseMessage = "";

    // Case 1: Only resources (no PA)
    if (points === 0 && resourceContributions.length > 0) {
      const result = await apiService.chantiers.contributeResources(
        chantierId,
        activeCharacter.id,
        resourceContributions
      );

      const resourcesText = resourceContributions
        .map((rc) => {
          const rcInfo = chantier.resourceCosts?.find((r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId);
          return `${rcInfo?.resourceType.emoji} ${rc.quantity} ${rcInfo?.resourceType.name}`;
        })
        .join(", ");

      responseMessage = `${STATUS.SUCCESS} Vous avez contribué ${resourcesText} au chantier "${chantier.name}".`;

      // Log contribution
      const contributionLogMessage = `🏗️ **${activeCharacter.name}** a contribué ${resourcesText} au chantier "**${chantier.name}**".`;
      await sendLogMessage(interaction.guildId!, interaction.client, contributionLogMessage);

      if (result.chantier.status === "COMPLETED") {
        responseMessage += `\n${CHANTIER.CELEBRATION} Félicitations ! Le chantier est maintenant terminé !`;

        const completionLogMessage = `${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est maintenant terminé !`;
        await sendLogMessage(interaction.guildId!, interaction.client, completionLogMessage);
      }
    }
    // Case 2: PA + possibly resources
    else if (points > 0) {
      // Adjust PA if needed
      if (points > remainingPAForChantier) {
        points = remainingPAForChantier;
        adjustedForChantierLimit = true;
      }

      if (activeCharacter.paTotal < points) {
        points = activeCharacter.paTotal;
        usedAllAvailablePA = true;
      }

      if (points <= 0 && resourceContributions.length === 0) {
        await interaction.reply({
          content: `${STATUS.ERROR} Vous n'avez pas de points d'action disponibles pour investir dans ce chantier.`,
          flags: ["Ephemeral"],
        });
        return;
      }

      // Invest PA first
      const paResult = (await apiService.chantiers.investInChantier(
        activeCharacter.id,
        chantierId,
        points
      )) as InvestResult;

      responseMessage = `${STATUS.SUCCESS} Vous avez investi ${points} PA dans le chantier "${chantier.name}".`;

      if (adjustedForChantierLimit) {
        responseMessage += ` (ajusté aux PA restants nécessaires)`;
      } else if (usedAllAvailablePA) {
        responseMessage += ` (tous vos PA disponibles)`;
      }

      // Then contribute resources if any
      if (resourceContributions.length > 0) {
        const resourceResult = await apiService.chantiers.contributeResources(
          chantierId,
          activeCharacter.id,
          resourceContributions
        );

        const resourcesText = resourceContributions
          .map((rc) => {
            const rcInfo = chantier.resourceCosts?.find((r: ResourceCost) => r.resourceTypeId === rc.resourceTypeId);
            return `${rcInfo?.resourceType.emoji} ${rc.quantity} ${rcInfo?.resourceType.name}`;
          })
          .join(", ");

        responseMessage += `\n+ ${resourcesText}`;

        // Log contribution with PA + resources
        const contributionLogMessage = `🏗️ **${activeCharacter.name}** a contribué ${points} PA et ${resourcesText} au chantier "**${chantier.name}**".`;
        await sendLogMessage(interaction.guildId!, interaction.client, contributionLogMessage);

        if (resourceResult.chantier.status === "COMPLETED") {
          responseMessage += `\n${CHANTIER.CELEBRATION} Félicitations ! Le chantier est maintenant terminé !`;

          const completionLogMessage = `${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est maintenant terminé !`;
          await sendLogMessage(interaction.guildId!, interaction.client, completionLogMessage);
        }
      } else {
        // Log contribution with only PA
        const contributionLogMessage = `🏗️ **${activeCharacter.name}** a contribué ${points} PA au chantier "**${chantier.name}**".`;
        await sendLogMessage(interaction.guildId!, interaction.client, contributionLogMessage);

        if (paResult.isCompleted) {
          responseMessage += `\n${CHANTIER.CELEBRATION} Félicitations ! Le chantier est maintenant terminé !`;

          const completionLogMessage = `${CHANTIER.CELEBRATION} Le chantier "**${chantier.name}**" est maintenant terminé !`;
          await sendLogMessage(interaction.guildId!, interaction.client, completionLogMessage);
        }
      }
    }

    await interaction.reply({
      content: responseMessage,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors du traitement de l'investissement:", { error });

    if (
      error instanceof Error &&
      error.message.includes("Aucun personnage actif trouvé")
    ) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Vous devez avoir un personnage actif pour investir dans les chantiers. Utilisez la commande \`/create-character\` pour créer votre personnage.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message.includes("Pas assez de points d'action")
    ) {
      await interaction.reply({
        content: error.message,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors du traitement de votre investissement. Veuillez réessayer.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleDeleteCommand(interaction: CommandInteraction) {
  try {
    // Vérifier si l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Récupérer les chantiers de la guilde
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "❌ Aucun chantier trouvé sur cette guilde.",
        flags: ["Ephemeral"],
      });
    }

    // Créer un menu de sélection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_chantier_delete")
      .setPlaceholder("Sélectionnez un chantier")
      .addOptions(
        chantiers.map((chantier) => ({
          label: chantier.name,
          description: `${chantier.spendOnIt}/${
            chantier.cost
          } PA - ${getStatusText(chantier.status)}`,
          value: chantier.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez un chantier à supprimer :",
      components: [row],
      flags: ["Ephemeral"],
    });

    // Gérer la sélection du chantier
    const filter = (i: StringSelectMenuInteraction) =>
      i.customId === "select_chantier_delete" &&
      i.user.id === interaction.user.id;

    try {
      const response = (await interaction.channel?.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 60000, // 1 minute pour choisir
      })) as StringSelectMenuInteraction;

      if (!response) return;

      const selectedChantierId = response.values[0];
      const selectedChantier = chantiers.find(
        (c) => c.id === selectedChantierId
      );

      if (!selectedChantier) {
        await response.update({
          content: "Chantier non trouvé. Veuillez réessayer.",
          components: [],
        });
        return;
      }

      // Supprimer le chantier
      await apiService.chantiers.deleteChantier(selectedChantierId);

      // Répondre avec le résultat
      await response.update({
        content: `${STATUS.SUCCESS} Le chantier "${selectedChantier.name}" a été supprimé avec succès.`,
        components: [],
      });
    } catch (error) {
      logger.error("Erreur lors de la suppression du chantier :", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "Temps écoulé ou erreur lors de la suppression.",
          flags: ["Ephemeral"],
        });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la préparation de la suppression :", {
      error,
    });
    if (!interaction.replied) {
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la préparation de la suppression.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content:
          "Une erreur est survenue lors de la préparation de la suppression.",
        flags: ["Ephemeral"],
      });
    }
  }
}

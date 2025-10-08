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

export async function handleAddCommand(interaction: CommandInteraction) {
  try {
    // Vérifier que l'utilisateur est admin avant de créer un chantier
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Vérifier que c'est une commande slash avec options
    if (!interaction.isChatInputCommand()) return;

    const chatInputInteraction = interaction as ChatInputCommandInteraction;

    // Récupérer les options
    const nom = chatInputInteraction.options.getString("nom");
    const cout = chatInputInteraction.options.getInteger("cout");

    // Vérifier que les options requises sont présentes
    if (!nom || cout === null) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Erreur: Les paramètres 'nom' et 'cout' sont requis pour créer un chantier.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le chantier
    const result = await apiService.chantiers.createChantier(
      {
        name: nom,
        cost: cout,
        guildId: chatInputInteraction.guildId!,
      },
      interaction.user.id
    );

    // Répondre avec le résultat
    await chatInputInteraction.reply({
      content: `✅ Chantier "${result.name}" créé avec succès !\n${STATUS.STATS} Coût: ${
        result.cost
      } PA\n📋 Statut: ${getStatusText(result.status)}`,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de la création du chantier :", { error });
    await interaction.reply({
      content: "Une erreur est survenue lors de la création du chantier.",
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

    let points = parseInt(
      interaction.fields.getTextInputValue("points_input"),
      10
    );

    // Validation des points avec gestion des décimales
    const inputValue = interaction.fields.getTextInputValue("points_input");
    if (!inputValue || inputValue.trim() === "") {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Veuillez entrer un nombre valide de points d'action (entiers uniquement, supérieur à zéro).`,
        flags: ["Ephemeral"],
      });
      return;
    }

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
    if (isNaN(points) || points <= 0) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Veuillez entrer un nombre valide de points d'action (entiers uniquement, supérieur à zéro).`,
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

    // Vérification finale : si après ajustement il n'y a plus de PA à investir
    if (points <= 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous n'avez pas de points d'action disponibles pour investir dans ce chantier.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Appeler l'API pour effectuer l'investissement
    const result = (await apiService.chantiers.investInChantier(
      activeCharacter.id,
      chantierId,
      points
    )) as InvestResult;

    let responseMessage = `${STATUS.SUCCESS} Vous avez investi ${points} PA dans le chantier "${chantier.name}".`;

    // Ajouter des informations sur les ajustements effectués
    if (adjustedForChantierLimit) {
      responseMessage += ` (ajusté aux PA restants nécessaires pour terminer le chantier)`;
    } else if (usedAllAvailablePA) {
      responseMessage += ` (tous vos PA disponibles ont été utilisés)`;
    }

    if (result.isCompleted) {
      responseMessage +=
        `${CHANTIER.CELEBRATION} Félicitations ! Le chantier est maintenant terminé !`;

      // Envoyer un message dans le channel de logs
      const logMessage = `🏗️ Le chantier "**${chantier.name}**" a été terminé par **${activeCharacter.name}** !`;
      await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
    } else {
      const remainingPA = result.chantier.cost - result.chantier.spendOnIt;
      responseMessage += `\n${STATUS.STATS} Progression : ${result.chantier.spendOnIt}/${result.chantier.cost} PA (${remainingPA} PA restants)`;
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

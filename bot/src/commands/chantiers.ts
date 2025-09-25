import {
  SlashCommandBuilder,
  EmbedBuilder,
  type CommandInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  ModalActionRowComponentBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  Client,
} from "discord.js";
import type { Command } from "../types/command";
import { apiService } from "../services/api";
import { logger } from "../services/logger";
import { checkAdmin } from "../utils/roles";
import type { ChatInputCommandInteraction } from "discord.js";

interface Chantiers {
  id: string;
  name: string;
  cost: number;
  spendOnIt: number;
  status: "PLAN" | "IN_PROGRESS" | "COMPLETED";
  serverId: string;
  createdBy: string;
  startDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("chantiers")
    .setDescription("Gère les chantiers du serveur")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("liste")
        .setDescription("Affiche la liste des chantiers")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("build")
        .setDescription("Investir des points dans un chantier")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Ajouter un nouveau chantier")
        .addStringOption((option) =>
          option
            .setName("nom")
            .setDescription("Nom du chantier")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("cout")
            .setDescription("Coût total en points d'action")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Supprimer un chantier existant")
    ),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "liste") {
        await handleListCommand(interaction);
      } else if (subcommand === "build") {
        await handleInvestCommand(interaction);
      } else if (subcommand === "add") {
        await handleAddCommand(interaction);
      } else if (subcommand === "delete") {
        await handleDeleteCommand(interaction);
      }
    } catch (error) {
      logger.error("Error in chantiers command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        ephemeral: true,
      });
    }
  },
};

async function handleListCommand(interaction: CommandInteraction) {
  try {
    const chantiers: Chantiers[] = await apiService.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'a encore été créé sur ce serveur.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🏗️ Liste des chantiers")
      .setDescription("Voici la liste des chantiers en cours sur ce serveur :");

    // Grouper les chantiers par statut
    const chantiersParStatut = chantiers.reduce<Record<string, Chantiers[]>>(
      (acc, chantiers) => {
        if (!acc[chantiers.status]) {
          acc[chantiers.status] = [];
        }
        acc[chantiers.status].push(chantiers);
        return acc;
      },
      {}
    );

    // Ajouter une section pour chaque statut
    for (const [statut, listeChantiers] of Object.entries(chantiersParStatut)) {
      const chantiersText = listeChantiers
        .map(
          (chantiers) =>
            `**${chantiers.name}** - ${chantiers.spendOnIt}/${chantiers.cost} PA`
        )
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
        value: chantiersText || "Aucun chantier dans cette catégorie",
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error("Erreur lors de la récupération des chantiers :", { error });
    await interaction.reply({
      content: "Une erreur est survenue lors de la récupération des chantiers.",
      ephemeral: true,
    });
  }
}

async function handleInvestCommand(interaction: CommandInteraction) {
  try {
    // Récupérer les chantiers du serveur
    const chantiers: Chantiers[] = await apiService.getChantiersByServer(
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
        ephemeral: true,
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
      ephemeral: true,
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

      // Demander le nombre de PA à investir
      const modal = new ModalBuilder()
        .setCustomId("invest_modal")
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

      // Gérer la soumission du modal
      const modalFilter = (i: ModalSubmitInteraction) =>
        i.customId === "invest_modal" && i.user.id === interaction.user.id;

      try {
        const modalResponse = await interaction.awaitModalSubmit({
          filter: modalFilter,
          time: 300000, // 5 minutes pour répondre
        });

        const points = parseInt(
          modalResponse.fields.getTextInputValue("points_input"),
          10
        );

        if (isNaN(points) || points <= 0) {
          await modalResponse.reply({
            content: "Veuillez entrer un nombre valide de points d'action.",
            ephemeral: true,
          });
          return;
        }

        // Récupérer le personnage de l'utilisateur
        const character = await apiService.getOrCreateCharacter(
          interaction.user.id,
          interaction.guildId!,
          interaction.guild?.name || "Serveur inconnu",
          {
            nickname: interaction.user.username,
            roles: [],
          },
          interaction.client as Client
        );

        // Effectuer l'investissement
        const result = await apiService.investInChantier(
          character.id,
          selectedChantierId,
          points
        );

        // Mettre à jour le message avec le résultat
        await modalResponse.reply({
          content:
            `✅ Vous avez investi ${result.pointsInvested} PA dans le chantier "${selectedChantier.name}".\n` +
            `Il vous reste ${result.remainingPoints} PA.` +
            (result.isCompleted
              ? "\n\n🎉 Félicitations ! Ce chantier est maintenant terminé !"
              : ""),
          ephemeral: true,
        });
      } catch (error) {
        logger.error("Erreur lors de la soumission du modal:", { error });
        if (!interaction.replied) {
          await interaction.followUp({
            content: "Temps écoulé ou erreur lors de la saisie.",
            ephemeral: true,
          });
        }
      }
    } catch (error) {
      logger.error("Erreur lors de la sélection du chantier:", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "Temps écoulé ou erreur lors de la sélection.",
          ephemeral: true,
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
        ephemeral: true,
      });
    } else {
      await interaction.followUp({
        content:
          "Une erreur est survenue lors de la préparation de l'investissement.",
        ephemeral: true,
      });
    }
  }
}

async function handleAddCommand(interaction: CommandInteraction) {
  try {
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
          "❌ Erreur: Les paramètres 'nom' et 'cout' sont requis pour créer un chantier.",
        ephemeral: true,
      });
      return;
    }

    // Créer le chantier
    const result = await apiService.createChantier(
      {
        name: nom,
        cost: cout,
        serverId: chatInputInteraction.guildId!,
      },
      interaction.user.id
    );

    // Répondre avec le résultat
    await chatInputInteraction.reply({
      content: `✅ Chantier "${result.name}" créé avec succès !\n📊 Coût: ${
        result.cost
      } PA\n📋 Statut: ${getStatusText(result.status)}`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error("Erreur lors de la création du chantier :", { error });
    await interaction.reply({
      content: "Une erreur est survenue lors de la création du chantier.",
      ephemeral: true,
    });
  }
}

async function handleDeleteCommand(interaction: CommandInteraction) {
  try {
    // Vérifier si l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Récupérer les chantiers du serveur
    const chantiers: Chantiers[] = await apiService.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "❌ Aucun chantier trouvé sur ce serveur.",
        ephemeral: true,
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
      ephemeral: true,
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
      await apiService.deleteChantier(selectedChantierId);

      // Répondre avec le résultat
      await response.update({
        content: `✅ Le chantier "${selectedChantier.name}" a été supprimé avec succès.`,
        components: [],
      });
    } catch (error) {
      logger.error("Erreur lors de la suppression du chantier :", { error });
      if (!interaction.replied) {
        await interaction.followUp({
          content: "Temps écoulé ou erreur lors de la suppression.",
          ephemeral: true,
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
        ephemeral: true,
      });
    } else {
      await interaction.followUp({
        content:
          "Une erreur est survenue lors de la préparation de la suppression.",
        ephemeral: true,
      });
    }
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "PLAN":
      return "En projet";
    case "IN_PROGRESS":
      return "En cours de construction";
    case "COMPLETED":
      return "Terminé";
    default:
      return status;
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLAN":
      return "📝";
    case "IN_PROGRESS":
      return "🚧";
    case "COMPLETED":
      return "✅";
    default:
      return "❓";
  }
}

export default command;

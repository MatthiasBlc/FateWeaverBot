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
import { sendLogMessage } from "../../utils/channels.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
import type { Chantier } from "./chantiers.types";
import { getStatusText, getStatusEmoji } from "./chantiers.utils";

export async function handleListCommand(interaction: CommandInteraction) {
  try {
    const chantiers: Chantier[] = await apiService.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'a encore été créé sur ce serveur.",
        flags: ["Ephemeral"],
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🏗️ Liste des chantiers")
      .setDescription("Voici la liste des chantiers en cours sur ce serveur :");

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
    const chantiers: Chantier[] = await apiService.getChantiersByServer(
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
            flags: ["Ephemeral"],
          });
          return;
        }

        // Récupérer le personnage actif de l'utilisateur (sans création automatique)
        const user = await apiService.getOrCreateUser(
          interaction.user.id,
          interaction.user.username,
          interaction.user.discriminator
        );

        const town = await apiService.getTownByGuildId(interaction.guildId!);

        if (!town) {
          await modalResponse.reply({
            content: "❌ Impossible de trouver la ville pour ce serveur.",
            flags: ["Ephemeral"],
          });
          return;
        }

        // Pour l'instant, cette fonctionnalité n'est pas encore disponible
        // Le système de récupération du personnage actif doit être implémenté côté backend
        await modalResponse.reply({
          content: "❌ Fonctionnalité d'investissement en cours de développement. Veuillez réessayer plus tard.",
          flags: ["Ephemeral"],
        });
        return;
      } catch (error) {
        logger.error("Erreur lors de la soumission du modal:", { error });
        if (!interaction.replied) {
          await interaction.followUp({
            content: "Temps écoulé ou erreur lors de la saisie.",
            flags: ["Ephemeral"],
          });
        }
      }
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
          "❌ Erreur: Les paramètres 'nom' et 'cout' sont requis pour créer un chantier.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le chantier
    const result = await apiService.createChantier(
      {
        name: nom,
        cost: cout,
        guildId: chatInputInteraction.guildId!,
      },
      interaction.user.id
    );

    // Répondre avec le résultat
    await chatInputInteraction.reply({
      content: `✅ Chantier "${result.name}" créé avec succès !\n📊 Coût: ${
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

export async function handleDeleteCommand(interaction: CommandInteraction) {
  try {
    // Vérifier si l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Récupérer les chantiers de la guilde
    const chantiers: Chantier[] = await apiService.getChantiersByServer(
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

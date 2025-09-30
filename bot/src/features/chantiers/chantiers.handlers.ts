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
  status: 'PLAN' | 'IN_PROGRESS' | 'COMPLETED';
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
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
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

      let modalResponse: ModalSubmitInteraction | undefined;
      try {
        // Attendre la soumission du modal sur la même interaction qui l'a affiché
        modalResponse = await response.awaitModalSubmit({
          filter: modalFilter,
          time: 120000, // 2 minutes pour répondre
        });

        // Ne pas utiliser deferReply ici pour éviter les conflits

        const points = parseInt(
          modalResponse.fields.getTextInputValue("points_input"),
          10
        );

        // Validation des points
        if (isNaN(points)) {
          await modalResponse.reply({ 
            content: "❌ Veuillez entrer un nombre valide de points d'action.",
            ephemeral: true 
          }).catch(e => 
            logger.error("Erreur lors de l'envoi du message d'erreur:", e)
          );
          return;
        }
        
        if (points <= 0) {
          await modalResponse.reply({ 
            content: "❌ Le nombre de points d'action doit être supérieur à zéro.",
            ephemeral: true
          }).catch(e => 
            logger.error("Erreur lors de l'envoi du message d'erreur:", e)
          );
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
          const townResponse = await apiService.getTownByGuildId(interaction.guildId!);
          const town = townResponse as unknown as Town;
          
          if (!town || !town.id) {
            throw new Error("Ville non trouvée pour cette guilde");
          }

          // Récupérer le personnage actif de l'utilisateur
          const activeCharacter = await apiService.getActiveCharacter(
            interaction.user.id,
            town.id
          ) as ActiveCharacter | null;

          if (!activeCharacter) {
            throw new Error("Aucun personnage actif trouvé");
          }

          // Vérifier que l'utilisateur a assez de PA
          if (activeCharacter.paTotal < points) {
            const errorMsg = `❌ Pas assez de points d'action (${activeCharacter.paTotal}/${points} requis)`;
            if (modalResponse.deferred || modalResponse.replied) {
              await modalResponse.editReply({ content: errorMsg });
            } else {
              await modalResponse.reply({ content: errorMsg, flags: ["Ephemeral"] });
            }
            return;
          }

          // Appeler l'API pour effectuer l'investissement
          const result = await apiService.investInChantier(
            activeCharacter.id,
            selectedChantierId,
            points
          ) as InvestResult;

          let responseMessage = `✅ Vous avez investi ${points} PA dans le chantier "${selectedChantier.name}".`;
          
          if (result.isCompleted) {
            responseMessage += "\n🎉 Félicitations ! Le chantier est maintenant terminé !";
          } else {
            const remainingPA = result.chantier.cost - result.chantier.spendOnIt;
            responseMessage += `\n📊 Progression : ${result.chantier.spendOnIt}/${result.chantier.cost} PA (${remainingPA} PA restants)`;
          }

          try {
            if (modalResponse.deferred || modalResponse.replied) {
              await modalResponse.editReply({ content: responseMessage });
            } else {
              await modalResponse.reply({ content: responseMessage, flags: ["Ephemeral"] });
            }
          } catch (e) {
            logger.error("Impossible d'envoyer la réponse de succès:", { error: e });
          }
      } catch (error) {
        logger.error("Erreur lors de la soumission du modal:", { error });
        const errorMessage = error instanceof Error && !error.message.includes('Pas assez de points d\'action') 
          ? error.message 
          : 'Une erreur est survenue lors du traitement de votre demande';
        
        // Ne pas afficher le message d'erreur pour les erreurs de PA déjà gérées
        if (error instanceof Error && error.message.includes('Pas assez de points d\'action')) {
          return;
        }
        
        if (modalResponse) {
          try {
            try {
              if (modalResponse.deferred || modalResponse.replied) {
                await modalResponse.editReply({ content: `❌ ${errorMessage}. Veuillez réessayer.` });
              } else {
                await modalResponse.reply({ content: `❌ ${errorMessage}. Veuillez réessayer.`, flags: ["Ephemeral"] });
              }
            } catch (e3) {
              logger.error("Impossible d'envoyer le message d'erreur:", { error: e3 });
            }
          } catch (e) {
            // Si editReply échoue (pas de defer), tenter un followUp si possible
            try {
              await modalResponse.followUp({
                content: `❌ ${errorMessage}.`,
                flags: ["Ephemeral"],
              });
            } catch (e2) {
              logger.error("Impossible d'envoyer une réponse de fallback au modal:", { error: e2 });
            }
          }
        } else {
          // Aucun modalResponse dispo, on journalise uniquement
          logger.error("Aucun modalResponse disponible pour notifier l'utilisateur de l'erreur");
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

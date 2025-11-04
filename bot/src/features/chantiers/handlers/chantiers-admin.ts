/**
 * Handlers pour l'administration des chantiers (ajout/suppression)
 */

import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ComponentType,
  type ChatInputCommandInteraction,
  type CommandInteraction,
  type StringSelectMenuInteraction,
  type ButtonInteraction,
  ModalActionRowComponentBuilder,
} from "discord.js";
import { apiService } from "../../../services/api/index.js";
import { logger } from "../../../services/logger.js";
import { checkAdmin } from "../../../utils/roles.js";
import { STATUS } from "../../../constants/emojis.js";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { getStatusText } from "../chantiers.utils.js";
import type { Chantier } from "./chantiers-common.js";

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

    const completionTextInput = new TextInputBuilder()
      .setCustomId("chantier_completion_text")
      .setLabel("Message de fin (optionnel)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500)
      .setPlaceholder("Message affiché quand le chantier est terminé");

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(costInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(completionTextInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur lors de l'ouverture du modal de création:", { error });
    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'ouverture du formulaire de création.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Handler pour la commande /chantiers-admin delete
 * Affiche un select menu pour choisir le chantier à supprimer
 */
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
        content: `${STATUS.ERROR} Aucun chantier trouvé sur cette guilde.`,
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
          description: `${chantier.spendOnIt}/${chantier.cost
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
          ERROR_MESSAGES.CHANTIER_DELETE_PREP_ERROR,
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content:
          ERROR_MESSAGES.CHANTIER_DELETE_PREP_ERROR,
        flags: ["Ephemeral"],
      });
    }
  }
}

/**
 * Handler wrapper pour le bouton admin "Ajouter un chantier"
 * Convertit ButtonInteraction en ChatInputCommandInteraction pour handleAddChantierCommand
 */
export async function handleAdminAddButton(interaction: ButtonInteraction) {
  // ButtonInteraction hérite les méthodes nécessaires, on peut le passer directement
  await handleAddChantierCommand(interaction as any);
}

/**
 * Handler wrapper pour le bouton admin "Supprimer un chantier"
 * Convertit ButtonInteraction en CommandInteraction pour handleDeleteCommand
 */
export async function handleAdminDeleteButton(interaction: ButtonInteraction) {
  // ButtonInteraction hérite les méthodes nécessaires, on peut le passer directement
  await handleDeleteCommand(interaction as any);
}

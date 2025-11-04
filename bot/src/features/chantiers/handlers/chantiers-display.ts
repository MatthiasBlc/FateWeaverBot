/**
 * Handlers pour l'affichage des listes de chantiers
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type CommandInteraction,
} from "discord.js";
import { apiService } from "../../../services/api/index.js";
import { logger } from "../../../services/logger.js";
import { STATUS } from "../../../constants/emojis.js";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { checkAdmin } from "../../../utils/roles.js";
import type { Chantier } from "./chantiers-common.js";
import { createChantiersListEmbed } from "./chantiers-helpers.js";
import { CHANTIER } from "../../../constants/emojis.js";

/**
 * Nouvelle commande /chantiers unifiée - Affiche liste + bouton Participer
 */
export async function handleChantiersCommand(interaction: CommandInteraction) {
  try {
    // Récupérer le personnage actif pour vérifier s'il est en expédition
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);

    if (!town) {
      return interaction.reply({
        content: "Impossible de trouver la ville associée à ce serveur.",
        flags: ["Ephemeral"],
      });
    }

    const character = await apiService.characters.getActiveCharacter(
      interaction.user.id,
      town.id
    );

    if (character) {
      // Vérifier si le personnage est en expédition DEPARTED
      const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(character.id);
      const inDepartedExpedition = activeExpeditions?.some((exp: any) => exp.status === "DEPARTED");

      if (inDepartedExpedition) {
        return interaction.reply({
          content: `${STATUS.ERROR} Tu es en expédition et ne peux pas voir les chantiers de la ville. Ça aura peut être avancé d'ici ton retour !`,
          flags: ["Ephemeral"],
        });
      }
    }

    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier prévu pour l'instant.\n\nIl faudrait peut-être en discuter avec les autres ?\n\nEt si tu as déjà une idée, tu peux nous écrire pour  https://discord.com/channels/1418955325070905404/1429470751454662707 :hut: ",
        flags: ["Ephemeral"],
      });
    }

    const embed = createChantiersListEmbed(
      `${CHANTIER.ICON} Liste des chantiers`,
      "Voici la liste des chantiers en cours :",
      chantiers,
      true // Afficher les ressources
    );

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
      content: ERROR_MESSAGES.CHANTIER_FETCH_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Ancienne commande /chantiers-list (conservée pour rétrocompatibilité)
 */
export async function handleListCommand(interaction: CommandInteraction) {
  try {
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier prévu pour l'instant.\n\nIl faudrait peut-être en discuter avec les autres ?\n\nEt si tu as déjà une idée, tu peux nous écrire pour  https://discord.com/channels/1418955325070905404/1429470751454662707 :hut: ",
        flags: ["Ephemeral"],
      });
    }

    const embed = createChantiersListEmbed(
      `${CHANTIER.ICON} Liste des chantiers`,
      "Voici la liste des chantiers en cours :",
      chantiers,
      false // Pas de ressources dans la vue simple
    );

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la récupération des chantiers :", { error });
    await interaction.reply({
      content: ERROR_MESSAGES.CHANTIER_FETCH_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Commande /chantiers-admin - Affiche liste des chantiers + boutons Ajouter/Supprimer
 */
export async function handleChantiersAdminCommand(interaction: CommandInteraction) {
  try {
    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      return interaction.reply({
        content: "Seuls les administrateurs peuvent accéder à cette commande.",
        flags: ["Ephemeral"],
      });
    }

    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    const embed = createChantiersListEmbed(
      `${CHANTIER.ICON} Gestion des chantiers`,
      "Liste des chantiers et options d'administration :",
      chantiers,
      true // Afficher les ressources
    );

    // Ajouter boutons Ajouter et Supprimer
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("chantier_admin_add")
        .setLabel("➕ Ajouter un chantier")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("chantier_admin_delete")
        .setLabel("➖ Supprimer un chantier")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttonRow],
      flags: ["Ephemeral"]
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des chantiers admin :", { error });
    await interaction.reply({
      content: ERROR_MESSAGES.CHANTIER_FETCH_ERROR,
      flags: ["Ephemeral"],
    });
  }
}

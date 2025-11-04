/**
 * Handlers pour la participation aux chantiers (sélection chantier + modal)
 */

import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
  type CommandInteraction,
  type StringSelectMenuInteraction,
  ModalActionRowComponentBuilder,
} from "discord.js";
import { apiService } from "../../../services/api/index.js";
import { logger } from "../../../services/logger.js";
import { STATUS, CHARACTER } from "../../../constants/emojis.js";
import { ERROR_MESSAGES } from "../../../constants/messages.js";
import { getStatusText } from "../chantiers.utils.js";
import type { Chantier } from "./chantiers-common.js";
import { getAvailableChantiersSorted } from "./chantiers-helpers.js";

/**
 * Handler pour le bouton "Participer" - Affiche select menu des chantiers
 */
export async function handleParticipateButton(interaction: any) {
  try {
    // Récupérer la ville (townId) à partir du guildId
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);

    if (!town) {
      return interaction.reply({
        content: "Impossible de trouver la ville associée à ce serveur.",
        flags: ["Ephemeral"],
      });
    }

    // Récupérer le personnage actif dès le début
    const character = await apiService.characters.getActiveCharacter(
      interaction.user.id,
      town.id
    );

    if (!character) {
      return interaction.reply({
        content: "Vous devez d'abord créer un personnage.",
        flags: ["Ephemeral"],
      });
    }

    // Vérifier si le personnage est en expédition DEPARTED
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(character.id);
    const inDepartedExpedition = activeExpeditions?.some((exp: any) => exp.status === "DEPARTED");

    if (inDepartedExpedition) {
      return interaction.reply({
        content: `${STATUS.ERROR} pouvez pas participer aux chantiers de la ville. Attendez votre retour !`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les chantiers de la guilde
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    // Filtrer et trier les chantiers selon les critères
    const availableChantiers = getAvailableChantiersSorted(chantiers);

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
          description: `${chantier.spendOnIt}/${chantier.cost
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
        logger.error("Chantier non trouvé", { chantierId: selectedChantierId });
        await response.update({
          content: "Chantier non trouvé. Veuillez réessayer.",
          components: [],
        });
        return;
      }

      // Demander le nombre de PA à investir avec l'ID du chantier encodé dans le custom ID du modal
      // Discord limite les titres de modal à 45 caractères
      const modalTitle = `Construire ${selectedChantier.name}`.substring(0, 45);
      const modal = new ModalBuilder()
        .setCustomId(`invest_modal_${selectedChantierId}`)
        .setTitle(modalTitle);

      const actionRows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

      // Champ PA (toujours présent)
      const paRestants = selectedChantier.cost - selectedChantier.spendOnIt;
      const pointsInput = new TextInputBuilder()
        .setCustomId("points_input")
        .setLabel(
          `${CHARACTER.PA} PA (${character.paTotal}/4)`
        )
        .setStyle(TextInputStyle.Short)
        .setRequired(false) // Optionnel si ressources requises
        .setPlaceholder(`0-${paRestants}`)
        .setMinLength(1)
        .setMaxLength(2);

      actionRows.push(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
          pointsInput,
        ])
      );

      // Ajouter champs pour les ressources requises (max 4 ressources)
      if (selectedChantier.resourceCosts && selectedChantier.resourceCosts.length > 0) {
        // Récupérer le stock de ressources de la ville
        const townResources = await apiService.getResources("CITY", town.id);

        const resourceCosts = selectedChantier.resourceCosts.slice(0, 4); // Max 4 ressources (5 champs max - 1 pour PA)

        for (const rc of resourceCosts) {
          const remaining = rc.quantityRequired - rc.quantityContributed;

          // Ne pas afficher les ressources déjà complètement contribuées
          if (remaining <= 0) {
            continue;
          }

          // Trouver le stock de cette ressource dans la ville
          const resourceStock = Array.isArray(townResources)
            ? townResources.find((r: any) => r.resourceTypeId === rc.resourceTypeId)
            : null;
          const stockQuantity = resourceStock?.quantity ?? 0;

          const resourceInput = new TextInputBuilder()
            .setCustomId(`resource_${rc.resourceTypeId}`)
            .setLabel(
              `${rc.resourceType.emoji} ${rc.resourceType.name} (stock : ${stockQuantity})`
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
          ERROR_MESSAGES.CHANTIER_PARTICIPATE_ERROR,
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content:
          ERROR_MESSAGES.CHANTIER_PARTICIPATE_ERROR,
        flags: ["Ephemeral"],
      });
    }
  }
}

/**
 * Ancienne commande /chantiers-invest (conservée pour rétrocompatibilité)
 */
export async function handleInvestCommand(interaction: CommandInteraction) {
  try {
    // Récupérer les chantiers de la guilde
    const chantiers: Chantier[] = await apiService.chantiers.getChantiersByServer(
      interaction.guildId!
    );

    // Filtrer et trier les chantiers selon les critères
    const availableChantiers = getAvailableChantiersSorted(chantiers);

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
          description: `${chantier.spendOnIt}/${chantier.cost
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
      // Discord limite les titres de modal à 45 caractères
      const modalTitle = `Construire ${selectedChantier.name}`.substring(0, 45);
      const modal = new ModalBuilder()
        .setCustomId(`invest_modal_${selectedChantierId}`)
        .setTitle(modalTitle);

      const pointsInput = new TextInputBuilder()
        .setCustomId("points_input")
        .setLabel(
          `PA à investir (max: ${selectedChantier.cost - selectedChantier.spendOnIt
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
          ERROR_MESSAGES.CHANTIER_INVEST_ERROR,
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.followUp({
        content:
          ERROR_MESSAGES.CHANTIER_INVEST_ERROR,
        flags: ["Ephemeral"],
      });
    }
  }
}

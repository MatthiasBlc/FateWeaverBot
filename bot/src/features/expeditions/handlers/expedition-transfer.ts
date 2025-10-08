import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  TextChannel,
  type GuildMember,
  type ModalSubmitInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand, getActiveCharacterFromModal } from "../../../utils/character";
import { createExpeditionTransferModal, createExpeditionTransferAmountModal } from "../../../modals/expedition-modals";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { getStatusEmoji } from "../expedition-utils";

/**
 * Gestionnaire pour le bouton "Transférer nourriture"
 */
export async function handleExpeditionTransferButton(interaction: any) {
  try {
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await interaction.reply({
          content:
            "❌ Vous devez avoir un personnage actif pour transférer de la nourriture. Utilisez d'abord la commande `/start` pour créer un personnage.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content:
          "❌ Vous devez avoir un personnage actif pour transférer de la nourriture.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get character's active expeditions
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(
      character.id
    );

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await interaction.reply({
        content: "❌ Votre personnage ne participe à aucune expédition active.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const currentExpedition = activeExpeditions[0];

    // Double-check that the character is actually a member
    const isMember = currentExpedition.members?.some(
      (member) => member.character?.id === character.id
    );

    if (!isMember) {
      await interaction.reply({
        content: "❌ Votre personnage n'est pas membre de cette expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if expedition is in PLANNING status (only time you can transfer)
    if (currentExpedition.status !== "PLANNING") {
      await interaction.reply({
        content: `❌ Vous ne pouvez pas transférer de nourriture dans une expédition qui est déjà **${getStatusEmoji(currentExpedition.status).split(" ")[1]
          }**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town information for current food stock
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Show direction selection menu instead of modal directly
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_transfer_direction")
      .setPlaceholder("Sélectionnez la direction du transfert")
      .addOptions([
        {
          label: "Vers la ville",
          description: `Ajouter de la nourriture à la ville (stock actuel: ${townResponse.foodStock})`,
          value: "to_town",
          emoji: "🏛️",
        },
        {
          label: "Vers l'expédition",
          description: `Ajouter de la nourriture à l'expédition (stock actuel: ${currentExpedition.foodStock})`,
          value: "from_town",
          emoji: "⛺",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez la direction du transfert de nourriture :",
      components: [row],
      flags: ["Ephemeral"],
    });

    logger.info("Expedition transfer direction selection shown", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      characterName: character.name,
      expeditionFoodStock: currentExpedition.foodStock,
      townFoodStock: townResponse.foodStock,
    });
  } catch (error) {
    logger.error("Error in expedition transfer button:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de l'ouverture du transfert de nourriture: ${error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gestionnaire pour la sélection de direction du transfert
 */
export async function handleExpeditionTransferDirectionSelect(
  interaction: any
) {
  try {
    logger.info("Expedition transfer direction select handler called", {
      customId: interaction.customId,
      values: interaction.values,
    });

    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await interaction.reply({
          content:
            "❌ Vous devez avoir un personnage actif pour transférer de la nourriture.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content:
          "❌ Vous devez avoir un personnage actif pour transférer de la nourriture.",
        flags: ["Ephemeral"],
      });
      return;
    }

    logger.info("Character found in transfer direction select", {
      characterId: character.id,
      characterName: character.name,
    });

    const selectedDirection = interaction.values[0];

    logger.info("Selected direction", { selectedDirection });

    // Get character's active expeditions
    const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(
      character.id
    );

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await interaction.reply({
        content: "❌ Votre personnage ne participe à aucune expédition active.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const currentExpedition = activeExpeditions[0];

    // Double-check that the character is actually a member
    const isMember = currentExpedition.members?.some(
      (member) => member.character?.id === character.id
    );

    logger.info("Expedition membership check", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      isMember,
      expeditionStatus: currentExpedition.status,
    });

    if (!isMember) {
      await interaction.reply({
        content: "❌ Votre personnage n'est pas membre de cette expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if expedition is still in PLANNING status
    if (currentExpedition.status !== "PLANNING") {
      await interaction.reply({
        content: `❌ Cette expédition n'est plus en phase de planification et ne peut plus recevoir de transferts.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town information for validation
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Show amount input modal with selected direction
    const maxAmount =
      selectedDirection === "to_town"
        ? (currentExpedition.foodStock ?? 0)
        : townResponse.foodStock;

    logger.info("Creating transfer modal", {
      expeditionId: currentExpedition.id,
      selectedDirection,
      maxAmount,
      expeditionFoodStock: currentExpedition.foodStock,
      townFoodStock: townResponse.foodStock,
    });

    const modal = createExpeditionTransferAmountModal(
      currentExpedition.id,
      selectedDirection,
      maxAmount
    );

    await interaction.showModal(modal);

    logger.info("Expedition transfer amount modal shown", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      characterName: character.name,
      selectedDirection,
      maxAmount,
    });
  } catch (error) {
    logger.error("Error in expedition transfer direction select:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de la sélection de direction: ${error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gestionnaire pour le modal de transfert de nourriture
 */
export async function handleExpeditionTransferModal(
  interaction: ModalSubmitInteraction
) {
  try {
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromModal(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await interaction.reply({
          content:
            "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas transférer de nourriture.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Aucun personnage actif trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get form inputs
    const amountValue = interaction.fields.getTextInputValue(
      "transfer_amount_input"
    );

    // Get direction from modal custom ID (format: expedition_transfer_amount_modal_{expeditionId}_{direction})
    const modalCustomId = interaction.customId;
    const parts = modalCustomId.split("_");

    logger.info("Modal parsing debug", {
      modalCustomId,
      parts,
      partsLength: parts.length,
    });

    // Extract direction from the end of the ID
    // The direction is either "to_town" or "from_town" (both contain underscores)
    let directionValue = "";
    if (modalCustomId.endsWith("_to_town")) {
      directionValue = "to_town";
    } else if (modalCustomId.endsWith("_from_town")) {
      directionValue = "from_town";
    }

    logger.info("Direction extraction", {
      modalCustomId,
      directionValue,
      endsWith_to_town: modalCustomId.endsWith("_to_town"),
      endsWith_from_town: modalCustomId.endsWith("_from_town"),
    });

    // Validate direction
    if (!["to_town", "from_town"].includes(directionValue)) {
      await interaction.reply({
        content: "❌ Direction de transfert invalide.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Validate amount input
    const amount = parseInt(amountValue, 10);
    if (isNaN(amount) || amount <= 0) {
      await interaction.reply({
        content: "❌ Le montant doit être un nombre positif.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get expedition ID from modal custom ID (format: expedition_transfer_amount_modal_{expeditionId}_{direction})
    const modalPrefix = "expedition_transfer_amount_modal_";
    const expeditionId = modalCustomId.substring(
      modalPrefix.length,
      modalCustomId.lastIndexOf("_" + directionValue)
    );

    logger.info("Expedition ID parsing debug", {
      modalCustomId,
      modalPrefix,
      directionValue,
      lastIndexOf: modalCustomId.lastIndexOf("_" + directionValue),
      expeditionId,
      expeditionIdLength: expeditionId.length,
    });

    // Get current expedition data
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.reply({
        content: "❌ Expédition introuvable.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Verify character is a member
    const isMember = expedition.members?.some(
      (member) => member.character?.id === character.id
    );
    if (!isMember) {
      await interaction.reply({
        content: "❌ Votre personnage n'est pas membre de cette expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if expedition is still in PLANNING status
    if (expedition.status !== "PLANNING") {
      await interaction.reply({
        content: `❌ Cette expédition n'est plus en phase de planification et ne peut plus recevoir de transferts.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town data for validation
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Validate transfer based on direction
    if (directionValue === "to_town") {
      // Transferring FROM expedition TO town
      const expeditionFoodStock = expedition.foodStock ?? 0;
      if (amount > expeditionFoodStock) {
        await interaction.reply({
          content: `❌ L'expédition n'a que ${expeditionFoodStock} nourriture. Vous ne pouvez pas en retirer ${amount}.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    } else {
      // Transferring FROM town TO expedition
      if (amount > townResponse.foodStock) {
        await interaction.reply({
          content: `❌ La ville n'a que ${townResponse.foodStock} nourriture. Vous ne pouvez pas en ajouter ${amount} à l'expédition.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    }

    // Perform the transfer
    let transferSuccess = false;
    try {
      if (directionValue === "to_town") {
        // Transfer from expedition to town
        await apiService.transferExpeditionFood(
          expeditionId,
          amount,
          "to_town"
        );
      } else {
        // Transfer from town to expedition
        await apiService.transferExpeditionFood(
          expeditionId,
          amount,
          "from_town"
        );
      }
      transferSuccess = true;
    } catch (error) {
      logger.error("Error during food transfer:", {
        error,
        expeditionId,
        characterId: character.id,
        amount,
        direction: directionValue,
      });
      await interaction.reply({
        content: `❌ Erreur lors du transfert: ${error instanceof Error ? error.message : "Erreur inconnue"
          }`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (transferSuccess) {
      // Get updated data for response
      const updatedExpedition = await apiService.expeditions.getExpeditionById(
        expeditionId
      );
      const updatedTown = await apiService.guilds.getTownByGuildId(
        interaction.guildId!
      );

      // Create response embed
      const embed = createSuccessEmbed(
        `✅ Transfert de nourriture réussi`,
        `Le transfert de **${amount}** nourriture a été effectué avec succès !`
      )
      .addFields(
        {
          name: "📦 Stock de l'expédition",
          value: `${updatedExpedition?.foodStock || expedition.foodStock}`,
          inline: true,
        },
        {
          name: "🏛️ Stock de la ville",
          value: `${updatedTown?.foodStock || townResponse.foodStock}`,
          inline: true,
        },
        {
          name: "📍 Direction",
          value:
            directionValue === "to_town"
              ? "Expédition → Ville"
              : "Ville → Expédition",
          inline: true,
        }
      );

      await interaction.reply({
        embeds: [embed],
        flags: ["Ephemeral"],
      });

      // Send log message
      const directionText =
        directionValue === "to_town" ? "vers la ville" : "vers l'expédition";
      const logMessage = `🍖 **${character.name}** a transféré **${amount}** nourriture ${directionText} dans l'expédition "**${expedition.name}**"`;
      await sendLogMessage(
        interaction.guildId!,
        interaction.client,
        logMessage
      );

      logger.info("Expedition food transfer completed", {
        expeditionId,
        characterId: character.id,
        characterName: character.name,
        amount,
        direction: directionValue,
        previousExpeditionStock: expedition.foodStock,
        previousTownStock: townResponse.foodStock,
        newExpeditionStock: updatedExpedition?.foodStock,
        newTownStock: updatedTown?.foodStock,
      });
    }
  } catch (error) {
    logger.error("Error in expedition transfer modal:", { error });
    await interaction.reply({
      content: `❌ Erreur lors du traitement du transfert: ${error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      flags: ["Ephemeral"],
    });
  }
}

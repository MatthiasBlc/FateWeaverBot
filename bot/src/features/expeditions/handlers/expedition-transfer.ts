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

    // Récupérer les stocks de ressources (Vivres + Nourriture) pour l'expédition et la ville
    let expeditionVivresStock = 0;
    let expeditionNourritureStock = 0;
    let townVivresStock = 0;
    let townNourritureStock = 0;

    try {
      // Stocks de l'expédition
      const expeditionResources = await apiService.getResources(
        "EXPEDITION",
        currentExpedition.id
      );
      expeditionVivresStock =
        expeditionResources.find((r: any) => r.resourceType.name === "Vivres")
          ?.quantity || 0;
      expeditionNourritureStock =
        expeditionResources.find(
          (r: any) => r.resourceType.name === "Nourriture"
        )?.quantity || 0;

      // Stocks de la ville
      const townResources = await apiService.getResources(
        "CITY",
        townResponse.id
      );
      townVivresStock =
        townResources.find((r: any) => r.resourceType.name === "Vivres")
          ?.quantity || 0;
      townNourritureStock =
        townResources.find((r: any) => r.resourceType.name === "Nourriture")
          ?.quantity || 0;
    } catch (error) {
      logger.error("Error fetching resource stocks for transfer:", error);
      await interaction.reply({
        content:
          "❌ Erreur lors de la récupération des stocks de ressources.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Déterminer les maximums selon la direction
    const maxVivres =
      selectedDirection === "to_town" ? expeditionVivresStock : townVivresStock;
    const maxNourriture =
      selectedDirection === "to_town"
        ? expeditionNourritureStock
        : townNourritureStock;

    logger.info("Creating transfer modal with multi-resource support", {
      expeditionId: currentExpedition.id,
      selectedDirection,
      maxVivres,
      maxNourriture,
      expeditionVivresStock,
      expeditionNourritureStock,
      townVivresStock,
      townNourritureStock,
    });

    const modal = createExpeditionTransferAmountModal(
      currentExpedition.id,
      selectedDirection,
      maxVivres,
      maxNourriture
    );

    await interaction.showModal(modal);

    logger.info("Expedition transfer amount modal shown", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      characterName: character.name,
      selectedDirection,
      maxVivres,
      maxNourriture,
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

    // Get form inputs for both resources
    const vivresValue =
      interaction.fields.getTextInputValue("transfer_vivres_input") || "0";
    const nourritureValue =
      interaction.fields.getTextInputValue("transfer_nourriture_input") || "0";

    // Get direction from modal custom ID (format: expedition_transfer_amount_modal_{expeditionId}_{direction})
    const modalCustomId = interaction.customId;

    logger.info("Modal parsing debug", {
      modalCustomId,
      vivresValue,
      nourritureValue,
    });

    // Extract direction from the end of the ID
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

    // Parse and validate amounts
    const vivresAmount = parseInt(vivresValue, 10) || 0;
    const nourritureAmount = parseInt(nourritureValue, 10) || 0;

    if (vivresAmount < 0 || nourritureAmount < 0) {
      await interaction.reply({
        content: "❌ Les quantités doivent être positives ou nulles.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (vivresAmount === 0 && nourritureAmount === 0) {
      await interaction.reply({
        content:
          "❌ Vous devez transférer au moins une ressource (Vivres ou Nourriture).",
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

    // Récupérer les stocks actuels pour validation
    let expeditionResources: any[];
    let townResources: any[];

    try {
      expeditionResources = await apiService.getResources(
        "EXPEDITION",
        expeditionId
      );
      townResources = await apiService.getResources("CITY", townResponse.id);
    } catch (error) {
      logger.error("Error fetching resources for validation:", error);
      await interaction.reply({
        content:
          "❌ Erreur lors de la récupération des stocks de ressources.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const expeditionVivres =
      expeditionResources.find((r: any) => r.resourceType.name === "Vivres")
        ?.quantity || 0;
    const expeditionNourriture =
      expeditionResources.find(
        (r: any) => r.resourceType.name === "Nourriture"
      )?.quantity || 0;
    const townVivres =
      townResources.find((r: any) => r.resourceType.name === "Vivres")
        ?.quantity || 0;
    const townNourriture =
      townResources.find((r: any) => r.resourceType.name === "Nourriture")
        ?.quantity || 0;

    // Validate transfer based on direction
    if (directionValue === "to_town") {
      // Transferring FROM expedition TO town
      if (vivresAmount > expeditionVivres) {
        await interaction.reply({
          content: `❌ L'expédition n'a que ${expeditionVivres} vivres. Vous ne pouvez pas en retirer ${vivresAmount}.`,
          flags: ["Ephemeral"],
        });
        return;
      }
      if (nourritureAmount > expeditionNourriture) {
        await interaction.reply({
          content: `❌ L'expédition n'a que ${expeditionNourriture} nourriture. Vous ne pouvez pas en retirer ${nourritureAmount}.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    } else {
      // Transferring FROM town TO expedition
      if (vivresAmount > townVivres) {
        await interaction.reply({
          content: `❌ La ville n'a que ${townVivres} vivres. Vous ne pouvez pas en transférer ${vivresAmount}.`,
          flags: ["Ephemeral"],
        });
        return;
      }
      if (nourritureAmount > townNourriture) {
        await interaction.reply({
          content: `❌ La ville n'a que ${townNourriture} nourriture. Vous ne pouvez pas en transférer ${nourritureAmount}.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    }

    // Get resource type IDs
    let vivresTypeId: number | undefined;
    let nourritureTypeId: number | undefined;

    try {
      const resourceTypes = await apiService.getResourceTypes();
      vivresTypeId = resourceTypes.find(
        (rt: any) => rt.name === "Vivres"
      )?.id;
      nourritureTypeId = resourceTypes.find(
        (rt: any) => rt.name === "Nourriture"
      )?.id;

      if (!vivresTypeId || !nourritureTypeId) {
        throw new Error("Types de ressources Vivres ou Nourriture introuvables");
      }
    } catch (error) {
      logger.error("Error fetching resource types:", error);
      await interaction.reply({
        content: "❌ Erreur lors de la récupération des types de ressources.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Perform the transfers
    let transferSuccess = false;
    const transferredResources: { name: string; amount: number }[] = [];

    try {
      // Déterminer les locationType et locationId selon la direction
      const fromLocationType =
        directionValue === "to_town" ? "EXPEDITION" : "CITY";
      const fromLocationId =
        directionValue === "to_town" ? expeditionId : townResponse.id;
      const toLocationType =
        directionValue === "to_town" ? "CITY" : "EXPEDITION";
      const toLocationId =
        directionValue === "to_town" ? townResponse.id : expeditionId;

      // Transfer Vivres if amount > 0
      if (vivresAmount > 0 && vivresTypeId) {
        await apiService.transferResource(
          fromLocationType,
          fromLocationId,
          toLocationType,
          toLocationId,
          vivresTypeId,
          vivresAmount
        );
        transferredResources.push({ name: "Vivres", amount: vivresAmount });
        logger.info("Vivres transfer successful", {
          amount: vivresAmount,
          direction: directionValue,
        });
      }

      // Transfer Nourriture if amount > 0
      if (nourritureAmount > 0 && nourritureTypeId) {
        await apiService.transferResource(
          fromLocationType,
          fromLocationId,
          toLocationType,
          toLocationId,
          nourritureTypeId,
          nourritureAmount
        );
        transferredResources.push({
          name: "Nourriture",
          amount: nourritureAmount,
        });
        logger.info("Nourriture transfer successful", {
          amount: nourritureAmount,
          direction: directionValue,
        });
      }

      transferSuccess = true;
    } catch (error) {
      logger.error("Error during resource transfer:", {
        error,
        expeditionId,
        characterId: character.id,
        vivresAmount,
        nourritureAmount,
        direction: directionValue,
      });
      await interaction.reply({
        content: `❌ Erreur lors du transfert: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (transferSuccess) {
      // Get updated data for response
      const updatedExpeditionResources = await apiService.getResources(
        "EXPEDITION",
        expeditionId
      );
      const updatedTownResources = await apiService.getResources(
        "CITY",
        townResponse.id
      );

      const updatedExpeditionVivres =
        updatedExpeditionResources.find(
          (r: any) => r.resourceType.name === "Vivres"
        )?.quantity || 0;
      const updatedExpeditionNourriture =
        updatedExpeditionResources.find(
          (r: any) => r.resourceType.name === "Nourriture"
        )?.quantity || 0;
      const updatedTownVivres =
        updatedTownResources.find((r: any) => r.resourceType.name === "Vivres")
          ?.quantity || 0;
      const updatedTownNourriture =
        updatedTownResources.find(
          (r: any) => r.resourceType.name === "Nourriture"
        )?.quantity || 0;

      // Create transfer summary
      const transferSummary = transferredResources
        .map((r) => `**${r.amount}x** ${r.name}`)
        .join(" + ");

      // Create response embed
      const embed = createSuccessEmbed(
        `✅ Transfert de ressources réussi`,
        `Le transfert de ${transferSummary} a été effectué avec succès !`
      ).addFields(
        {
          name: "📦 Stock de l'expédition",
          value: `🍞 Vivres: ${updatedExpeditionVivres}\n🍖 Nourriture: ${updatedExpeditionNourriture}`,
          inline: true,
        },
        {
          name: "🏛️ Stock de la ville",
          value: `🍞 Vivres: ${updatedTownVivres}\n🍖 Nourriture: ${updatedTownNourriture}`,
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
      const logMessage = `📦 **${character.name}** a transféré ${transferSummary} ${directionText} dans l'expédition "**${expedition.name}**"`;
      await sendLogMessage(
        interaction.guildId!,
        interaction.client,
        logMessage
      );

      logger.info("Expedition multi-resource transfer completed", {
        expeditionId,
        characterId: character.id,
        characterName: character.name,
        vivresAmount,
        nourritureAmount,
        direction: directionValue,
        transferredResources,
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

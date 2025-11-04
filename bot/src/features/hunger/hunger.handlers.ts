import { EmbedBuilder, type GuildMember } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { sendLogMessage } from "../../utils/channels";
import {
  getHungerLevelText,
  getHungerEmoji,
} from "../../utils/hunger";
import { replyEphemeral, replyError } from "../../utils/interaction-helpers.js";
import { validateCharacterExists, validateCharacterAlive } from "../../utils/character-validation.js";
import { getActiveCharacterForUser } from "../../utils/character";
import type { EatResult } from "./hunger.types";
import { createCustomEmbed, createSuccessEmbed, getHungerColor } from "../../utils/embeds";
import { STATUS, HUNGER } from "../../constants/emojis.js";



/**
 * Crée un embed pour afficher le résultat d'un repas
 */
function createEatEmbed(
  eatResult: EatResult,
  characterName: string
): EmbedBuilder {
  const hungerLevelText = getHungerLevelText(eatResult.character.hungerLevel);
  const hungerEmoji = getHungerEmoji(eatResult.character.hungerLevel);

  // Déterminer le nom du lieu selon la source du stock
  const stockSourceName =
    eatResult.stockSource === "EXPEDITION"
      ? `expédition "${eatResult.expeditionName}"`
      : "ville";

  return createCustomEmbed({
    color: getHungerColor(eatResult.character.hungerLevel),
    title: "🍽️ Repas",
    description: `${hungerEmoji} **${characterName}** a mangé !`,
    fields: [
      {
        name: "État de faim",
        value: hungerLevelText,
        inline: true,
      },
      {
        name: "Vivres consommés",
        value: `${eatResult.foodConsumed}`,
        inline: true,
      },
      {
        name: "Stock restant",
        value: `${eatResult.town.foodStock} (dans ${stockSourceName})`,
        inline: true,
      }
    ],
    timestamp: true,
  });
}


// Fonction pour gérer le bouton de Vivres (pour les interactions de boutons)
export async function handleEatButton(interaction: any, character: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Le personnage actif est maintenant passé en paramètre par le middleware
    if (!character) {
      await interaction.editReply({
        content:
          `${STATUS.ERROR} Vous devez d'abord créer un personnage avec la commande \`/start\`.`,
        components: [],
      });
      return;
    }

    logger.info(`[handleEatButton] Tentative de manger pour le personnage:`, {
      characterId: character.id,
      characterName: character.name,
      hungerLevel: character.hungerLevel,
      guildId: interaction.guildId,
    });

    // Tenter de faire manger le personnage
    const eatResult = await apiService.characters.eatFood(character.id);

    // Créer l'embed de réponse
    const embed = createEatEmbed(eatResult, character.name || user.username);

    // Modifier la réponse originale avec l'embed et supprimer les boutons
    await interaction.editReply({
      embeds: [embed],
      components: [], // Supprimer les boutons
    });

    // Envoyer le message de log avec la bonne source de stock
    const stockSource =
      eatResult.stockSource === "EXPEDITION"
        ? `expédition "${eatResult.expeditionName}"`
        : "ville";

    await sendLogMessage(
      interaction.guildId!,
      interaction.client,
      `🍽️ **${character.name || user.username}** a pris un repas, il reste **${eatResult.town.foodStock
      }** de vivres dans ${stockSource}`
    );
  } catch (error: any) {
    logger.warn("Bouton manger - situation non-error gérée:", {
      error: error.message,
      responseData: error.response?.data,
      status: error.status,
      characterId: character?.id,
    });

    let errorMessage = "Une erreur est survenue lors du repas.";

    // Cas spécial : le personnage n'a pas faim
    if (
      error.response?.data?.error?.includes("pas faim") ||
      error.response?.data?.error?.includes("pas besoin de manger") ||
      error.message?.includes("pas faim") ||
      error.message?.includes("pas besoin de manger")
    ) {
      const embed = createSuccessEmbed(
        "🍽️ Pas faim",
        `${HUNGER.FED} Vous êtes en pleine forme et n'avez pas besoin de manger pour le moment !`
      );

      await interaction.editReply({
        embeds: [embed],
        components: [], // Supprimer les boutons même en cas d'erreur
      });
      return;
    }

    if (
      error.response?.data?.error?.includes("mort") ||
      error.message?.includes("mort")
    ) {
      errorMessage = `${STATUS.ERROR} Votre personnage est mort et ne peut plus manger.`;
    } else if (
      error.response?.data?.error?.includes("vivres") ||
      error.message?.includes("vivres")
    ) {
      errorMessage = `${STATUS.ERROR} L'expédition n'a plus de vivres disponibles.`;
    } else if (
      error.response?.data?.error?.includes("nécessaires") ||
      error.message?.includes("nécessaires")
    ) {
      errorMessage =
        `${STATUS.ERROR} L'expédition n'a pas assez de vivres pour votre repas.`;
    }

    // Modifier la réponse avec le message d'erreur et supprimer les boutons
    await interaction.editReply({
      content: errorMessage,
      embeds: [],
      components: [],
    });
  }
}

// Fonction pour gérer le bouton de nourriture alternative (Repas, etc.)
export async function handleEatAlternativeButton(
  interaction: any,
  character: any
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Le personnage actif est maintenant passé en paramètre par le middleware
    if (!character) {
      await interaction.editReply({
        content:
          `${STATUS.ERROR} Vous devez d'abord créer un personnage avec la commande \`/profil\`.`,
        components: [],
      });
      return;
    }

    logger.info(
      `[handleEatAlternativeButton] Tentative de manger Repas pour le personnage:`,
      {
        characterId: character.id,
        characterName: character.name,
        hungerLevel: character.hungerLevel,
        guildId: interaction.guildId,
      }
    );

    // Tenter de faire manger le personnage avec un Repas
    const eatResult = await apiService.characters.eatFoodAlternative(
      character.id,
      "Repas"
    );

    // Créer l'embed de réponse
    const embed = createEatEmbed(eatResult, character.name || user.username);

    // Modifier la réponse originale avec l'embed et supprimer les boutons
    await interaction.editReply({
      embeds: [embed],
      components: [], // Supprimer les boutons
    });

    // Envoyer le message de log avec la bonne source de stock
    const stockSource =
      eatResult.stockSource === "EXPEDITION"
        ? `expédition "${eatResult.expeditionName}"`
        : "ville";

    await sendLogMessage(
      interaction.guildId!,
      interaction.client,
      `🍽️ **${character.name || user.username
      }** a mangé un Repas, il reste **${eatResult.town.foodStock
      }** de ${eatResult.resourceTypeConsumed} dans ${stockSource}`
    );
  } catch (error: any) {
    logger.warn("Bouton manger Repas - situation non-error gérée:", {
      error: error.message,
      responseData: error.response?.data,
      status: error.status,
      characterId: character?.id,
    });

    let errorMessage = "Une erreur est survenue lors du repas.";

    // Cas spécial : le personnage n'a pas faim
    if (
      error.response?.data?.error?.includes("pas faim") ||
      error.response?.data?.error?.includes("pas besoin de manger") ||
      error.message?.includes("pas faim") ||
      error.message?.includes("pas besoin de manger")
    ) {
      const embed = createSuccessEmbed(
        "🍽️ Pas faim",
        `${HUNGER.FED} Vous êtes en pleine forme et n'avez pas besoin de manger pour le moment !`
      );

      await interaction.editReply({
        embeds: [embed],
        components: [], // Supprimer les boutons même en cas d'erreur
      });
      return;
    }

    if (
      error.response?.data?.error?.includes("mort") ||
      error.message?.includes("mort")
    ) {
      errorMessage = `${STATUS.ERROR} Votre personnage est mort et ne peut plus manger.`;
    } else if (
      error.response?.data?.error?.includes("repas") ||
      error.message?.includes("repas")
    ) {
      errorMessage = `${STATUS.ERROR} L'expédition n'a plus de repas disponible.`;
    } else if (
      error.response?.data?.error?.includes("nécessaires") ||
      error.message?.includes("nécessaires")
    ) {
      errorMessage =
        `${STATUS.ERROR} L'expédition n'a pas assez de Repas.`;
    }

    // Modifier la réponse avec le message d'erreur et supprimer les boutons
    await interaction.editReply({
      content: errorMessage,
      embeds: [],
      components: [],
    });
  }
}

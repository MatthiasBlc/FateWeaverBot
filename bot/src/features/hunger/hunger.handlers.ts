import { EmbedBuilder, type GuildMember } from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { sendLogMessage } from "../../utils/channels";
import { getHungerLevelText, getHungerEmoji, getHungerColor } from "../../utils/hunger";
import type { EatResult } from "./hunger.types";

/**
 * Crée un embed pour afficher le résultat d'un repas
 */
function createEatEmbed(eatResult: EatResult, characterName: string): EmbedBuilder {
  const hungerLevelText = getHungerLevelText(eatResult.character.hungerLevel);
  const hungerEmoji = getHungerEmoji(eatResult.character.hungerLevel);

  return new EmbedBuilder()
    .setColor(getHungerColor(eatResult.character.hungerLevel))
    .setTitle("🍽️ Repas")
    .setDescription(`${hungerEmoji} **${characterName}** a mangé !`)
    .addFields(
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
        value: `${eatResult.town.foodStock}`,
        inline: true,
      }
    )
    .setTimestamp();
}

export async function handleEatCommand(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  let character: any = null;

  try {
    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer le personnage actif de l'utilisateur
    character = await apiService.getActiveCharacter(user.id, town.id);

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez d'abord créer un personnage avec la commande `/start`.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Tenter de faire manger le personnage
    const eatResult = await apiService.eatFood(character.id);

    // Créer l'embed de réponse
    const embed = createEatEmbed(eatResult, character.name || user.username);

    // Envoyer la réponse à l'utilisateur
    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });

    // Envoyer le message de log
    await sendLogMessage(
      interaction.guildId!,
      interaction.client,
      `🍽️ **${character.name || user.username}** a pris un repas, il reste **${
        eatResult.town.foodStock
      }** de vivres dans la ville`
    );
  } catch (error: any) {
    logger.warn("Commande manger - situation non-error gérée:", {
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
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("🍽️ Pas faim")
        .setDescription(
          "😊 Vous êtes en pleine forme et n'avez pas besoin de manger pour le moment !"
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
      return;
    }

    if (
      error.response?.data?.error?.includes("mort") ||
      error.message?.includes("mort")
    ) {
      errorMessage = "❌ Votre personnage est mort et ne peut plus manger.";
    } else if (
      error.response?.data?.error?.includes("vivres") ||
      error.message?.includes("vivres")
    ) {
      errorMessage = "❌ La ville n'a plus de vivres disponibles.";
    } else if (
      error.response?.data?.error?.includes("nécessaires") ||
      error.message?.includes("nécessaires")
    ) {
      errorMessage = "❌ La ville n'a pas assez de vivres pour votre repas.";
    }

    await interaction.reply({
      content: errorMessage,
      flags: ["Ephemeral"],
    });
  }
}

// Fonction pour gérer le bouton de nourriture (pour les interactions de boutons)
export async function handleEatButton(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  let character: any = null;

  try {
    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.editReply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        components: [],
      });
      return;
    }

    // Récupérer le personnage actif de l'utilisateur
    character = await apiService.getActiveCharacter(user.id, town.id);

    if (!character) {
      await interaction.editReply({
        content: "❌ Vous devez d'abord créer un personnage avec la commande `/start`.",
        components: [],
      });
      return;
    }

    // Tenter de faire manger le personnage
    const eatResult = await apiService.eatFood(character.id);

    // Créer l'embed de réponse
    const embed = createEatEmbed(eatResult, character.name || user.username);

    // Modifier la réponse originale avec l'embed et supprimer les boutons
    await interaction.editReply({
      embeds: [embed],
      components: [] // Supprimer les boutons
    });

    // Envoyer le message de log
    await sendLogMessage(
      interaction.guildId!,
      interaction.client,
      `🍽️ **${character.name || user.username}** a pris un repas, il reste **${
        eatResult.town.foodStock
      }** de vivres dans la ville`
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
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("🍽️ Pas faim")
        .setDescription(
          "😊 Vous êtes en pleine forme et n'avez pas besoin de manger pour le moment !"
        )
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        components: [] // Supprimer les boutons même en cas d'erreur
      });
      return;
    }

    if (
      error.response?.data?.error?.includes("mort") ||
      error.message?.includes("mort")
    ) {
      errorMessage = "❌ Votre personnage est mort et ne peut plus manger.";
    } else if (
      error.response?.data?.error?.includes("vivres") ||
      error.message?.includes("vivres")
    ) {
      errorMessage = "❌ La ville n'a plus de vivres disponibles.";
    } else if (
      error.response?.data?.error?.includes("nécessaires") ||
      error.message?.includes("nécessaires")
    ) {
      errorMessage = "❌ La ville n'a pas assez de vivres pour votre repas.";
    }

    // Modifier la réponse avec le message d'erreur et supprimer les boutons
    await interaction.editReply({
      content: errorMessage,
      embeds: [],
      components: []
    });
  }
}

import { createCustomEmbed, getHungerColor } from "../../utils/embeds";
import { EmbedBuilder } from "discord.js";
import { getHungerLevelText, getHungerEmoji } from "../../utils/hunger";
import type { EatResult } from "./hunger.types";

/**
 * Crée un embed pour afficher le résultat d'un repas
 */
export function createEatEmbed(
  eatResult: EatResult,
  characterName: string
): EmbedBuilder {
  const hungerLevelText = getHungerLevelText(eatResult.character.hungerLevel);
  const hungerEmoji = getHungerEmoji(eatResult.character.hungerLevel);

  const embed = createCustomEmbed({
    color: getHungerColor(eatResult.character.hungerLevel),
    title: "🍽️ Repas",
    description: `${hungerEmoji} **${characterName}** a mangé !`,
    timestamp: true,
  }).addFields(
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
  );

  return embed;
}

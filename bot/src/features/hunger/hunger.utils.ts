import { EmbedBuilder } from "discord.js";
import { getHungerLevelText, getHungerEmoji, getHungerColor } from "../../utils/hunger";
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

  const embed = new EmbedBuilder()
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

  return embed;
}

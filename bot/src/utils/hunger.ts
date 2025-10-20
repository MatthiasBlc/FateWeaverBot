/**
 * Utilitaires pour la gestion de la faim des personnages
 * Logique alignée avec le backend : 0 = mort, 4 = en bonne santé
 */

import { HUNGER } from "@shared/constants/emojis";

/**
 * Convertit un niveau de faim en texte descriptif (backend: 0 = mort, 4 = en bonne santé)
 */
export function getHungerLevelText(level: number): string {
  switch (level) {
    case 0:
      return "Mort";
    case 1:
      return "Agonie";
    case 2:
      return "Affamé";
    case 3:
      return "Faim";
    case 4:
      return "En bonne santé";
    default:
      return "Inconnu";
  }
}

/**
 * Convertit un niveau de faim en emoji (backend: 0 = mort, 4 = en bonne santé)
 */
export function getHungerEmoji(level: number): string {
  switch (level) {
    case 0:
      return HUNGER.DEAD;
    case 1:
      return HUNGER.STARVING;
    case 2:
      return HUNGER.HUNGRY;
    case 3:
      return HUNGER.APPETITE;
    case 4:
      return HUNGER.FED;
    default:
      return HUNGER.UNKNOWN;
  }
}

/**
 * Convertit un niveau de faim en couleur pour les embeds Discord (backend: 0 = mort, 4 = en bonne santé)
 */
export function getHungerColor(level: number): number {
  switch (level) {
    case 0:
      return 0x000000; // Noir - Mort
    case 1:
      return 0xff4500; // Rouge-orange - Agonie
    case 2:
      return 0xffa500; // Orange - Affamé
    case 3:
      return 0xffff00; // Jaune - Faim
    case 4:
      return 0x00ff00; // Vert - En bonne santé
    default:
      return 0x808080; // Gris - Inconnu
  }
}

/**
 * Crée un affichage avancé du niveau de faim avec texte et emoji (backend: 0 = mort, 4 = en bonne santé)
 */
export function createHungerDisplay(level: number): {
  text: string;
  emoji: string;
  color: number;
} {
  const emoji = getHungerEmoji(level);
  const text = getHungerLevelText(level);
  const color = getHungerColor(level);

  switch (level) {
    case 0:
      return {
        text: `${emoji} **${text}** - Incapable d'agir`,
        emoji,
        color
      };
    case 1:
      return {
        text: `${emoji} **${text}** - Plus de régénération PA !`,
        emoji,
        color
      };
    case 2:
      return {
        text: `${emoji} **${text}** - Régénération PA réduite`,
        emoji,
        color
      };
    case 3:
      return {
        text: `${emoji} **${text}** - Commence à avoir faim`,
        emoji,
        color
      };
    case 4:
      return {
        text: `${emoji} **${text}** - Parfait état !`,
        emoji,
        color
      };
    default:
      return {
        text: `${emoji} **État inconnu**`,
        emoji,
        color
      };
  }
}

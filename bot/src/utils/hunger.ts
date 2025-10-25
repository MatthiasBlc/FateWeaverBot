/**
 * Utilitaires pour la gestion de la faim des personnages
 * Aligné avec l'implémentation de /profil pour cohérence
 * 0 = Meurt de faim, 1 = Affamé, 2 = Faim, 3 = Petit creux, 4 = Satiété
 */

import { HUNGER } from "@shared/constants/emojis";

/**
 * Convertit un niveau de faim en texte descriptif
 * Aligné avec /profil pour cohérence
 */
export function getHungerLevelText(level: number): string {
  switch (level) {
    case 0:
      return "Meurt de faim";
    case 1:
      return "Affamé";
    case 2:
      return "Faim";
    case 3:
      return "Petit creux";
    case 4:
      return "Satiété";
    default:
      return "Inconnu";
  }
}

/**
 * Convertit un niveau de faim en emoji
 * Aligné avec /profil pour cohérence
 */
export function getHungerEmoji(level: number): string {
  switch (level) {
    case 0:
      return HUNGER.STARVATION;
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
 * Convertit un niveau de faim en couleur pour les embeds Discord
 * Aligné avec /profil
 */
export function getHungerColor(level: number): number {
  switch (level) {
    case 0:
      return 0xff0000; // Rouge - Meurt de faim
    case 1:
      return 0xff4500; // Rouge-orange - Affamé
    case 2:
      return 0xffa500; // Orange - Faim
    case 3:
      return 0xffff00; // Jaune - Petit creux
    case 4:
      return 0x00ff00; // Vert - Satiété
    default:
      return 0x808080; // Gris - Inconnu
  }
}

/**
 * Crée un affichage avancé du niveau de faim avec texte et emoji
 * Aligné avec /profil
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
        text: `${emoji} **${text}** - Critiquement affamé`,
        emoji,
        color
      };
    case 1:
      return {
        text: `${emoji} **${text}** - Très affamé`,
        emoji,
        color
      };
    case 2:
      return {
        text: `${emoji} **${text}** - Faim normale`,
        emoji,
        color
      };
    case 3:
      return {
        text: `${emoji} **${text}** - Légèrement rassasié`,
        emoji,
        color
      };
    case 4:
      return {
        text: `${emoji} **${text}** - Bien rassasié !`,
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

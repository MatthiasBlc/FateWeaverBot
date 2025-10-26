/**
 * Utilitaires partagés pour les expéditions
 */

import { EXPEDITION, DIRECTION } from "@shared/constants/emojis";

/**
 * Retourne l'emoji et le texte correspondant au statut de l'expédition
 */
export function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLANNING":
      return `${EXPEDITION.PLANNING} PLANIFICATION`;
    case "LOCKED":
      return `${EXPEDITION.LOCKED} VERROUILLÉE`;
    case "DEPARTED":
      return `${EXPEDITION.DEPARTED} PARTIE`;
    case "RETURNED":
      return `${EXPEDITION.RETURNED} REVENUE`;
    default:
      return status;
  }
}

/**
 * Retourne uniquement l'emoji du statut de l'expédition (sans texte)
 */
export function getStatusEmojiOnly(status: string): string {
  switch (status) {
    case "PLANNING":
      return EXPEDITION.PLANNING;
    case "LOCKED":
      return EXPEDITION.LOCKED;
    case "DEPARTED":
      return EXPEDITION.DEPARTED;
    case "RETURNED":
      return EXPEDITION.RETURNED;
    default:
      return "❓";
  }
}

/**
 * Vérifie si une expédition est modifiable (en planification)
 */
export function isExpeditionEditable(status: string): boolean {
  return status === "PLANNING";
}

/**
 * Vérifie si une expédition est en cours
 */
export function isExpeditionActive(status: string): boolean {
  return status === "DEPARTED";
}

/**
 * Vérifie si un utilisateur peut rejoindre une expédition
 */
export function canJoinExpedition(status: string): boolean {
  return status === "PLANNING";
}

/**
 * Vérifie si un utilisateur peut quitter une expédition
 */
export function canLeaveExpedition(status: string): boolean {
  return status === "PLANNING" || status === "LOCKED";
}

/**
 * Calcule le temps restant avant le retour d'une expédition
 */
export function calculateRemainingTime(departedAt: Date, duration: number): number {
  const now = new Date();
  const returnDate = new Date(departedAt.getTime() + duration * 24 * 60 * 60 * 1000);
  return Math.max(0, returnDate.getTime() - now.getTime());
}

/**
 * Formate le temps restant en texte lisible
 */
export function formatRemainingTime(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days}j ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
}

/**
 * Retourne l'emoji correspondant à une direction
 */
export function getDirectionEmoji(direction: string | null | undefined): string {
  if (!direction) return DIRECTION.UNKNOWN;

  const emojis: Record<string, string> = {
    NORD: DIRECTION.NORTH,
    NORD_EST: DIRECTION.NORTHEAST,
    EST: DIRECTION.EAST,
    SUD_EST: DIRECTION.SOUTHEAST,
    SUD: DIRECTION.SOUTH,
    SUD_OUEST: DIRECTION.SOUTHWEST,
    OUEST: DIRECTION.WEST,
    NORD_OUEST: DIRECTION.NORTHWEST,
    UNKNOWN: DIRECTION.UNKNOWN,
  };
  return emojis[direction] || DIRECTION.UNKNOWN;
}

/**
 * Retourne le texte correspondant à une direction
 */
export function getDirectionText(direction: string | null | undefined): string {
  if (!direction) return "Inconnue";

  const texts: Record<string, string> = {
    NORD: "Nord",
    NORD_EST: "Nord-Est",
    EST: "Est",
    SUD_EST: "Sud-Est",
    SUD: "Sud",
    SUD_OUEST: "Sud-Ouest",
    OUEST: "Ouest",
    NORD_OUEST: "Nord-Ouest",
    UNKNOWN: "Inconnue",
  };
  return texts[direction] || "Inconnue";
}

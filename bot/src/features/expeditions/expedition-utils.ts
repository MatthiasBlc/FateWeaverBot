/**
 * Utilitaires partagés pour les expéditions
 */

/**
 * Retourne l'emoji et le texte correspondant au statut de l'expédition
 */
export function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLANNING":
      return "🔄 PLANIFICATION";
    case "LOCKED":
      return "🔒 VERROUILLÉE";
    case "DEPARTED":
      return "✈️ PARTIE";
    case "RETURNED":
      return "🏠 REVENUE";
    default:
      return status;
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

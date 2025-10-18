// Utilitaires pour le système de profil avec embeds détaillés

// Fonction pour obtenir la date/heure actuelle en Europe/Paris
function getParisTime(): Date {
  // Obtenir le décalage horaire actuel en minutes
  const now = new Date();
  // Paris est à UTC+1 (heure d'hiver) ou UTC+2 (heure d'été)
  // On utilise getTimezoneOffset() pour obtenir le décalage en minutes
  // Puis on ajoute 60 minutes pour UTC+1 (heure d'hiver)
  // Note: Pour gérer correctement l'heure d'été, on pourrait utiliser une bibliothèque comme date-fns-tz
  const timezoneOffset = now.getTimezoneOffset() + 60; // +60 minutes pour UTC+1
  const parisTime = new Date(now.getTime() + (timezoneOffset * 60000));
  return parisTime;
}

export function calculateTimeUntilNextUpdate(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = getParisTime();
  const nextUpdate = new Date(now);

  // Toujours définir sur minuit du jour suivant (00:00:00)
  nextUpdate.setDate(nextUpdate.getDate() + 1);
  nextUpdate.setHours(0, 0, 0, 0);

  const diffMs = nextUpdate.getTime() - now.getTime();
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
  const seconds = Math.max(0, Math.floor((diffMs % (1000 * 60)) / 1000));

  return { hours, minutes, seconds };
}

export function formatTimeUntilUpdate(timeUntilUpdate: {
  hours: number;
  minutes: number;
  seconds: number;
}): string {
  if (timeUntilUpdate.hours > 0) {
    return `${timeUntilUpdate.hours}h ${timeUntilUpdate.minutes}m`;
  } else {
    return `${timeUntilUpdate.minutes}m`;
  }
}

export function getActionPointsEmoji(points: number): string {
  switch (points) {
    case 0:
      return "⚫";
    case 1:
      return "🔴";
    case 2:
      return "🟠";
    case 3:
      return "🟡";
    case 4:
      return "🟢";
    default:
      return "⚪";
  }
}
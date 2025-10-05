// Utilitaires pour le système de profil avec embeds détaillés

export function calculateTimeUntilNextUpdate(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const nextUpdate = new Date(now);
  
  // Calculer le temps restant jusqu'à minuit (prochaine exécution du cron)
  if (now.getHours() < 24) {
    // Avant minuit aujourd'hui
    nextUpdate.setHours(24, 0, 0, 0);
  } else {
    // Après minuit aujourd'hui, aller à demain
    nextUpdate.setDate(nextUpdate.getDate() + 1);
    nextUpdate.setHours(0, 0, 0, 0);
  }

  const diffMs = nextUpdate.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export function formatTimeUntilUpdate(timeUntilUpdate: {
  hours: number;
  minutes: number;
  seconds: number;
}): string {
  if (timeUntilUpdate.hours > 0) {
    return `${timeUntilUpdate.hours}h ${timeUntilUpdate.minutes}m`;
  } else if (timeUntilUpdate.minutes > 0) {
    return `${timeUntilUpdate.minutes}m ${timeUntilUpdate.seconds}s`;
  } else {
    return `${timeUntilUpdate.seconds}s`;
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
export function getStatusText(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Actif";
    case "COMPLETED":
      return "Terminé";
    default:
      return status;
  }
}

export function getStatusEmoji(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "🔧";
    case "COMPLETED":
      return "✅";
    default:
      return "❓";
  }
}

export function getCraftTypeEmoji(craftType: string): string {
  switch (craftType) {
    case 'TISSER':
      return '🧵';
    case 'FORGER':
      return '🔨';
    case 'TRAVAILLER_LE_BOIS':
      return '🪚';
    default:
      return '🛠️';
  }
}

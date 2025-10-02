export function getStatusText(status: string): string {
  switch (status) {
    case "PLAN":
      return "En projet";
    case "IN_PROGRESS":
      return "En cours de construction";
    case "COMPLETED":
      return "Terminé";
    default:
      return status;
  }
}

export function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLAN":
      return "📝";
    case "IN_PROGRESS":
      return "🚧";
    case "COMPLETED":
      return "✅";
    default:
      return "❓";
  }
}

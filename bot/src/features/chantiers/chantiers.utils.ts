import { CHANTIER } from "@shared/constants/emojis";

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
      return CHANTIER.PLAN;
    case "IN_PROGRESS":
      return CHANTIER.IN_PROGRESS;
    case "COMPLETED":
      return CHANTIER.COMPLETED;
    default:
      return CHANTIER.ICON;
  }
}

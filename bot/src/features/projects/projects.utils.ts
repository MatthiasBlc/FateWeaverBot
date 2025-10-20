import { PROJECT, CAPABILITIES } from "@shared/constants/emojis";

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
      return PROJECT.ACTIVE;
    case "COMPLETED":
      return PROJECT.COMPLETED;
    default:
      return PROJECT.UNKNOWN;
  }
}

export function getCraftTypeEmoji(craftType: string): string {
  switch (craftType) {
    case 'TISSER':
      return CAPABILITIES.WEAVING;
    case 'FORGER':
      return CAPABILITIES.FORGING;
    case 'MENUISER':
      return CAPABILITIES.WOODWORKING;
    default:
      return PROJECT.ICON;
  }
}

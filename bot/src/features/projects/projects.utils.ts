import { PROJECT, CAPABILITIES } from "@shared/constants/emojis";

export type CraftEnum = "TISSER" | "FORGER" | "MENUISER";
export type CraftDisplayName = "Tisser" | "Forger" | "Travailler le bois";

const craftDisplayMap: Record<CraftEnum, CraftDisplayName> = {
  TISSER: "Tisser",
  FORGER: "Forger",
  MENUISER: "Travailler le bois",
};

const craftAliasToEnumMap: Record<string, CraftEnum> = {
  tisser: "TISSER",
  forger: "FORGER",
  "travailler le bois": "MENUISER",
  menuiser: "MENUISER",
  menuiseuse: "MENUISER",
  "travailler_le_bois": "MENUISER",
  "travailler-le-bois": "MENUISER",
  menuiserie: "MENUISER",
};

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
    case "TISSER":
      return CAPABILITIES.WEAVING;
    case "FORGER":
      return CAPABILITIES.FORGING;
    case "MENUISER":
      return CAPABILITIES.WOODWORKING;
    default:
      return PROJECT.ICON;
  }
}

export function getCraftDisplayName(craftType: CraftEnum): CraftDisplayName {
  return craftDisplayMap[craftType];
}

export function toCraftEnum(value: string | undefined | null): CraftEnum | undefined {
  if (!value) return undefined;
  return craftAliasToEnumMap[value.trim().toLowerCase()];
}

export function getCraftDisplayFromUnknown(value: string | undefined | null): CraftDisplayName | undefined {
  const craftEnum = toCraftEnum(value);
  return craftEnum ? craftDisplayMap[craftEnum] : undefined;
}

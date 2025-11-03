/**
 * Types et interfaces communes pour le module projects
 */

export interface Town {
  id: string;
  name: string;
}

export interface ActiveCharacter {
  id: string;
  paTotal: number;
  name: string;
  townId: string;
  isDead?: boolean;
}

export interface Capability {
  id: string;
  name: string;
  emojiTag: string;
  category: string;
  costPA: number;
  description: string;
}

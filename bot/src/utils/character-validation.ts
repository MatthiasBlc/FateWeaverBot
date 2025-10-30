import type { Character } from "../types/entities";
import { STATUS } from "../constants/emojis.js";


/**
 * Messages d'erreur standardisés pour les validations de personnage
 */
export const CHARACTER_ERRORS = {
  NO_CHARACTER: `${STATUS.ERROR} Aucun personnage actif trouvé.`,
  DEAD_CHARACTER: `${STATUS.ERROR} Un mort ne peut pas effectuer cette action.`,
  NO_LIVING_CHARACTER: "❌ Aucun personnage vivant trouvé. Utilisez d'abord la commande `/start` pour créer un personnage.",
  NO_TOWN: `${STATUS.ERROR} Ville de votre personnage introuvable.`,
  NO_PERMISSION: `${STATUS.ERROR} Vous n'avez pas la permission d'effectuer cette action.`,
} as const;

/**
 * Valide qu'un personnage existe
 * @throws Error avec message si validation échoue
 */
export function validateCharacterExists(character: Character | null | undefined): asserts character is Character {
  if (!character) {
    throw new Error(CHARACTER_ERRORS.NO_CHARACTER);
  }
}

/**
 * Valide qu'un personnage existe et est vivant
 * @throws Error avec message si validation échoue
 */
export function validateCharacterAlive(character: Character | null | undefined): asserts character is Character {
  validateCharacterExists(character);

  if (character.isDead) {
    throw new Error(CHARACTER_ERRORS.DEAD_CHARACTER);
  }
}

/**
 * Valide qu'un personnage a une ville
 * @throws Error avec message si validation échoue
 */
export function validateCharacterHasTown(character: Character): void {
  if (!character.townId) {
    throw new Error(CHARACTER_ERRORS.NO_TOWN);
  }
}

/**
 * Valide toutes les conditions de base (existe, vivant, a une ville)
 * @throws Error avec message si validation échoue
 */
export function validateCharacterReady(character: Character | null | undefined): asserts character is Character {
  validateCharacterAlive(character);
  validateCharacterHasTown(character);
}

/**
 * Vérifie si un personnage peut effectuer une action (non null et vivant)
 * @returns true si le personnage peut agir, false sinon
 */
export function canCharacterAct(character: Character | null | undefined): character is Character {
  return character !== null && character !== undefined && !character.isDead;
}

/**
 * Vérifie si un personnage est mort
 */
export function isCharacterDead(character: Character | null | undefined): boolean {
  return character?.isDead ?? false;
}

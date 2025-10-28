/**
 * Interface standardisée pour les résultats d'exécution de capacités
 * Utilisée pour unifier les retours entre capability.service et character-capability.service
 */

export interface CapabilityExecutionResult {
  /** Indique si l'exécution a réussi */
  success: boolean;

  /** Message pour le joueur qui a utilisé la capacité */
  message: string;

  /** Message public à afficher dans le feed de la ville (optionnel) */
  publicMessage?: string;

  /** Ressources générées ou consommées (quantités positives = production, négatives = consommation) */
  loot?: {
    [resourceName: string]: number;
  };

  /** Effets appliqués aux personnages (heal, PM, statuts, etc.) */
  effects?: Array<{
    targetCharacterId: string;
    hpChange?: number;
    pmChange?: number;
    statusChange?: string;
  }>;

  /** Nombre de PA réellement consommés par cette action */
  paConsumed: number;

  /** Métadonnées additionnelles (compteurs spéciaux, flags, etc.) */
  metadata?: {
    divertCounter?: number;      // Compteur pour Divertir
    bonusApplied?: string[];     // Liste des bonus appliqués (LUCKY_ROLL, HEAL_EXTRA, etc.)
    rolls?: any;                  // Détails des tirages aléatoires (pour debug)
    [key: string]: any;
  };
}

/**
 * Paramètres communs pour l'exécution des capacités
 */
export interface CapabilityExecutionParams {
  /** Saison actuelle (pour Chasser, Cueillir) */
  isSummer?: boolean;

  /** Nombre de PA à utiliser (pour capacités à coût variable) */
  paToUse?: number;

  /** Quantité d'input (pour Cuisiner, craft, etc.) */
  inputQuantity?: number;

  /** ID du personnage cible (pour Soigner) */
  targetCharacterId?: string;

  /** Mode d'exécution (pour Soigner : "heal" ou "craft") */
  mode?: string;

  /** Paramètres additionnels spécifiques */
  [key: string]: any;
}

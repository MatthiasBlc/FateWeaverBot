/**
 * Module utilitaire pour les tirages pondérés des capacités selon la saison
 */

// Tables pondérées selon la saison pour la chasse
const huntSummer = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const huntWinter = [0, 1, 1, 1, 2, 2, 3, 3, 4];

// Tables pondérées selon la saison pour la cueillette
const gatherSummer = [1, 2, 2, 3];
const gatherWinter = [0, 1, 1, 2];

/**
 * Sélectionne un élément aléatoire depuis un pool de valeurs
 * @param pool Array de valeurs possibles
 * @returns Un élément aléatoire du pool
 */
export function getRandomFromPool(pool: number[]): number {
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Calcule le rendement de chasse selon la saison
 * @param isWinter Indique si c'est l'hiver
 * @returns Nombre de vivres obtenus (0-10 en été, 0-4 en hiver)
 */
export function getHuntYield(isWinter: boolean): number {
  return getRandomFromPool(isWinter ? huntWinter : huntSummer);
}

/**
 * Calcule le rendement de cueillette selon la saison
 * @param isWinter Indique si c'est l'hiver
 * @returns Nombre de vivres obtenus (0-3 en été, 0-2 en hiver)
 */
export function getGatherYield(isWinter: boolean): number {
  return getRandomFromPool(isWinter ? gatherWinter : gatherSummer);
}

/**
 * Tables de valeurs disponibles pour inspection/debugging
 */
export const CAPACITY_POOLS = {
  huntSummer,
  huntWinter,
  gatherSummer,
  gatherWinter,
} as const;

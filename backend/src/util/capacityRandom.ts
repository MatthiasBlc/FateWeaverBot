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
 * @param isSummer Indique si c'est l'été
 * @returns Nombre de vivres obtenus (2-10 en été, 0-4 en hiver)
 */
export function getHuntYield(isSummer: boolean): number {
  return getRandomFromPool(isSummer ? huntSummer : huntWinter);
}

/**
 * Calcule le rendement de cueillette selon la saison
 * @param isSummer Indique si c'est l'été
 * @returns Nombre de vivres obtenus (1-3 en été, 0-2 en hiver)
 */
export function getGatherYield(isSummer: boolean): number {
  return getRandomFromPool(isSummer ? gatherSummer : gatherWinter);
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

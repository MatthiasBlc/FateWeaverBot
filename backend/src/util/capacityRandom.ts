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
 * @param luckyRoll Si true, effectue deux tirages et conserve le meilleur
 * @returns Nombre de vivres obtenus (2-10 en été, 0-4 en hiver)
 */
export function getHuntYield(isSummer: boolean, luckyRoll: boolean = false): number {
  const pool = isSummer ? huntSummer : huntWinter;

  if (!luckyRoll) {
    return getRandomFromPool(pool);
  }

  // LUCKY_ROLL : deux tirages, on garde le meilleur (le plus élevé)
  const roll1 = getRandomFromPool(pool);
  const roll2 = getRandomFromPool(pool);
  return Math.max(roll1, roll2);
}

/**
 * Calcule le rendement de cueillette selon la saison
 * @param isSummer Indique si c'est l'été
 * @param luckyRoll Si true, effectue deux tirages et conserve le meilleur
 * @returns Nombre de vivres obtenus (1-3 en été, 0-2 en hiver)
 */
export function getGatherYield(isSummer: boolean, luckyRoll: boolean = false): number {
  const pool = isSummer ? gatherSummer : gatherWinter;

  if (!luckyRoll) {
    return getRandomFromPool(pool);
  }

  // LUCKY_ROLL : deux tirages, on garde le meilleur (le plus élevé)
  const roll1 = getRandomFromPool(pool);
  const roll2 = getRandomFromPool(pool);
  return Math.max(roll1, roll2);
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

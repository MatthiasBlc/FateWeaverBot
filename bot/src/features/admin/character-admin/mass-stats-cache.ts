/**
 * Cache temporaire pour les sélections de personnages lors des modifications de masse.
 * Utilisé pour éviter de dépasser la limite de 100 caractères des customId Discord.
 */

interface CacheEntry {
  characterIds: string[];
  timestamp: number;
}

// Cache en mémoire avec nettoyage automatique
const cache = new Map<string, CacheEntry>();

// Durée de vie d'une entrée : 15 minutes
const CACHE_TTL = 15 * 60 * 1000;

/**
 * Génère un ID de session court (8 caractères alphanumériques)
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Nettoie les entrées expirées du cache
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

/**
 * Stocke une sélection de personnages et retourne un ID de session
 */
export function storeSelection(characterIds: string[]): string {
  cleanupExpiredEntries();

  const sessionId = generateSessionId();
  cache.set(sessionId, {
    characterIds,
    timestamp: Date.now(),
  });

  return sessionId;
}

/**
 * Récupère une sélection de personnages depuis un ID de session
 */
export function getSelection(sessionId: string): string[] | null {
  cleanupExpiredEntries();

  const entry = cache.get(sessionId);
  if (!entry) {
    return null;
  }

  // Vérifier si l'entrée n'est pas expirée
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(sessionId);
    return null;
  }

  return entry.characterIds;
}

/**
 * Supprime une sélection du cache (optionnel, pour nettoyage immédiat)
 */
export function clearSelection(sessionId: string): void {
  cache.delete(sessionId);
}

/**
 * Obtient la taille actuelle du cache (pour debug)
 */
export function getCacheSize(): number {
  cleanupExpiredEntries();
  return cache.size;
}

import { apiService } from "./api";
import { logger } from "./logger";
import type { EmojiConfig } from "./api/emoji-api.service";

/**
 * Service de cache pour les emojis
 * Maintient une copie locale des configurations d'emoji pour un accès rapide
 */
class EmojiCache {
  private cache: Map<string, Record<string, string>> = new Map();
  private initialized = false;

  /**
   * Rafraîchit le cache en récupérant toutes les configurations depuis l'API
   */
  async refresh(): Promise<void> {
    try {
      logger.info("Refreshing emoji cache...");

      const emojis = await apiService.emojis.listEmojis();

      // Reconstruire le cache
      this.cache.clear();

      for (const emoji of emojis) {
        if (!this.cache.has(emoji.type)) {
          this.cache.set(emoji.type, {});
        }

        const typeCache = this.cache.get(emoji.type)!;
        typeCache[emoji.key] = emoji.emoji;
      }

      this.initialized = true;
      logger.info(`Emoji cache refreshed with ${emojis.length} emojis across ${this.cache.size} types`);
    } catch (error) {
      logger.error("Failed to refresh emoji cache:", { error });
      throw error;
    }
  }

  /**
   * Récupère un emoji depuis le cache
   * @param type Type d'emoji (resource, capability, skill, etc.)
   * @param key Clé de l'emoji
   * @returns L'emoji ou "📦" comme placeholder
   */
  getEmoji(type: string, key: string): string {
    if (!this.initialized) {
      logger.warn("Emoji cache not initialized, returning placeholder");
      return "📦";
    }

    const typeCache = this.cache.get(type);
    if (!typeCache) {
      return "📦";
    }

    return typeCache[key] || "📦";
  }

  /**
   * Récupère tous les emojis d'un type donné
   * @param type Type d'emoji
   * @returns Un objet key -> emoji ou un objet vide
   */
  getByType(type: string): Record<string, string> {
    const typeCache = this.cache.get(type);
    return typeCache ? { ...typeCache } : {};
  }

  /**
   * Récupère tous les emojis du cache
   * @returns Le cache complet (copie)
   */
  getAllEmojis(): Map<string, Record<string, string>> {
    const copy = new Map<string, Record<string, string>>();

    for (const [type, emojis] of this.cache.entries()) {
      copy.set(type, { ...emojis });
    }

    return copy;
  }

  /**
   * Vérifie si le cache est initialisé
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const emojiCache = new EmojiCache();

/**
 * Helper function to get resource emoji from cache or fallback to DB emoji
 * @param resourceName Name of the resource
 * @param dbEmoji Optional emoji from database (fallback)
 * @returns Emoji string from cache or fallback placeholder
 */
export async function getResourceEmoji(resourceName: string, dbEmoji?: string): Promise<string> {
  // Check cache first
  const cachedEmoji = emojiCache.getEmoji("resource", resourceName);

  // If cached emoji exists and is not placeholder, return it
  if (cachedEmoji && cachedEmoji !== "📦") {
    return cachedEmoji;
  }

  // Fallback to DB emoji if provided
  if (dbEmoji) {
    return dbEmoji;
  }

  // Final fallback to placeholder
  return "📦";
}

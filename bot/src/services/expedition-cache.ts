import { logger } from "./logger";

/**
 * Type pour les données d'expédition temporaires
 */
export interface TempExpeditionData {
  name: string;
  townId: string;
  characterId: string;
  createdBy: string;
  resources: Array<{
    resourceTypeId: number;
    resourceTypeName: string;
    emoji: string;
    quantity: number;
  }>;
  duration: number;
  userId: string;
  timestamp: number;
}

/**
 * Service de cache pour les données temporaires d'expédition
 * Utilisé pour contourner la limite de 100 caractères des customId Discord
 */
class ExpeditionCache {
  private cache: Map<string, TempExpeditionData> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Génère un identifiant unique court pour une expédition
   */
  private generateId(userId: string): string {
    return `exp_${userId}_${Date.now()}`;
  }

  /**
   * Stocke temporairement les données d'une expédition
   * @param userId ID de l'utilisateur Discord
   * @param data Données de l'expédition
   * @param existingId ID existant à mettre à jour (optionnel)
   * @returns L'identifiant (généré ou existant)
   */
  store(userId: string, data: Omit<TempExpeditionData, 'userId' | 'timestamp'>, existingId?: string): string {
    const id = existingId || this.generateId(userId);

    this.cache.set(id, {
      ...data,
      userId,
      timestamp: Date.now(),
    });

    logger.debug("Stored expedition data in cache", { id, userId, isUpdate: !!existingId });

    // Nettoyer les anciennes entrées
    this.cleanup();

    return id;
  }

  /**
   * Récupère les données d'une expédition depuis le cache
   * @param id Identifiant de l'expédition
   * @param userId ID de l'utilisateur (pour validation)
   * @returns Les données ou null si non trouvées/expirées
   */
  retrieve(id: string, userId: string): TempExpeditionData | null {
    const data = this.cache.get(id);

    if (!data) {
      logger.warn("Expedition data not found in cache", { id, userId });
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() - data.timestamp > this.TTL_MS) {
      logger.warn("Expedition data expired", { id, userId });
      this.cache.delete(id);
      return null;
    }

    // Vérifier que l'utilisateur correspond
    if (data.userId !== userId) {
      logger.warn("Expedition data user mismatch", { id, expectedUserId: data.userId, actualUserId: userId });
      return null;
    }

    logger.debug("Retrieved expedition data from cache", { id, userId });
    return data;
  }

  /**
   * Supprime les données expirées du cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [id, data] of this.cache.entries()) {
      if (now - data.timestamp > this.TTL_MS) {
        this.cache.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug("Cleaned up expired expedition data", { removedCount, remainingCount: this.cache.size });
    }
  }

  /**
   * Supprime une entrée spécifique du cache
   * @param id Identifiant de l'expédition
   */
  remove(id: string): void {
    this.cache.delete(id);
    logger.debug("Removed expedition data from cache", { id });
  }

  /**
   * Retourne la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const expeditionCache = new ExpeditionCache();

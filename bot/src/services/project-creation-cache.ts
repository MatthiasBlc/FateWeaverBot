import { logger } from "./logger";

/**
 * Type pour les données de projet temporaires
 */
export interface TempProjectData {
  name: string;
  townId: string;
  craftTypes: string[];
  outputType: "RESOURCE" | "OBJECT";
  outputResourceTypeId?: number;
  outputObjectTypeId?: number;
  outputQuantity: number;
  paRequired: number;
  resourceCosts: Array<{
    resourceTypeId: number;
    quantityRequired: number;
    resourceTypeName?: string;
    emoji?: string;
  }>;
  isBlueprint?: boolean;
  paBlueprintRequired?: number;
  blueprintResourceCosts?: Array<{
    resourceTypeId: number;
    quantityRequired: number;
    resourceTypeName?: string;
    emoji?: string;
  }>;
  userId: string;
  timestamp: number;
}

/**
 * Service de cache pour les données temporaires de création de projet
 * Utilisé pour contourner la limite de 100 caractères des customId Discord
 */
class ProjectCreationCache {
  private cache: Map<string, TempProjectData> = new Map();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Génère un identifiant unique court pour un projet
   */
  private generateId(userId: string): string {
    return `prj_${userId}_${Date.now()}`;
  }

  /**
   * Stocke temporairement les données d'un projet
   * @param userId ID de l'utilisateur Discord
   * @param data Données du projet
   * @param existingId ID existant à mettre à jour (optionnel)
   * @returns L'identifiant (généré ou existant)
   */
  store(userId: string, data: Omit<TempProjectData, 'userId' | 'timestamp'>, existingId?: string): string {
    const id = existingId || this.generateId(userId);

    this.cache.set(id, {
      ...data,
      userId,
      timestamp: Date.now(),
    });

    logger.debug("Stored project data in cache", { id, userId, isUpdate: !!existingId });

    // Nettoyer les anciennes entrées
    this.cleanup();

    return id;
  }

  /**
   * Récupère les données d'un projet depuis le cache
   * @param id Identifiant du projet
   * @param userId ID de l'utilisateur (pour validation)
   * @returns Les données ou null si non trouvées/expirées
   */
  retrieve(id: string, userId: string): TempProjectData | null {
    const data = this.cache.get(id);

    if (!data) {
      logger.warn("Project data not found in cache", { id, userId });
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() - data.timestamp > this.TTL_MS) {
      logger.warn("Project data expired", { id, userId });
      this.cache.delete(id);
      return null;
    }

    // Vérifier que l'utilisateur correspond
    if (data.userId !== userId) {
      logger.warn("Project data user mismatch", { id, expectedUserId: data.userId, actualUserId: userId });
      return null;
    }

    logger.debug("Retrieved project data from cache", { id, userId });
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
      logger.debug("Cleaned up expired project data", { removedCount, remainingCount: this.cache.size });
    }
  }

  /**
   * Supprime une entrée spécifique du cache
   * @param id Identifiant du projet
   */
  remove(id: string): void {
    this.cache.delete(id);
    logger.debug("Removed project data from cache", { id });
  }

  /**
   * Retourne la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const projectCreationCache = new ProjectCreationCache();

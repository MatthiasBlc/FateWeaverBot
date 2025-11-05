import { sendAdminLog, type AdminLogData } from "../services/admin-log.service.js";
import { logger } from "../services/logger.js";
import type { Client } from "discord.js";

/**
 * Résultat d'exécution de capacité (simplifié pour le bot)
 *
 * ⚠️ DUPLICATION: Ce type existe aussi dans backend/src/services/types/capability-result.types.ts
 *
 * Raison de la duplication:
 * - Le backend et le bot sont des projets TypeScript séparés
 * - Pas de package @shared/types commun pour l'instant
 *
 * TODO (Long terme):
 * - Créer un package @shared/types pour partager les interfaces entre backend et bot
 * - Utiliser pnpm workspaces ou lerna pour gérer le monorepo
 *
 * En attendant, IMPORTANT:
 * - Garder ce type synchronisé avec backend/src/services/types/capability-result.types.ts
 * - Si vous ajoutez un champ dans metadata, l'ajouter dans les 2 fichiers
 */
export interface CapabilityExecutionResult {
  success: boolean;
  message: string;
  publicMessage?: string;
  paConsumed: number;
  loot?: { [resourceName: string]: number };
  metadata?: {
    bonusApplied?: string[];
    bonusLogMessage?: string;
    pmGained?: number;
    divertCounter?: number;
    [key: string]: any;
  };
}

/**
 * Envoie un log admin après l'utilisation d'une capacité
 * Cette fonction centralise la logique de génération des logs admin pour toutes les capacités
 * @param guildId ID de la guilde Discord
 * @param client Client Discord
 * @param characterName Nom du personnage
 * @param capabilityName Nom de la capacité
 * @param capabilityEmoji Emoji de la capacité
 * @param paSpent PA dépensés
 * @param result Résultat de l'exécution de la capacité (contient les bonus)
 * @param locations Coordonnées optionnelles (pour cartographie)
 */
export async function handleCapabilityAdminLog(
  guildId: string,
  client: Client,
  characterName: string,
  capabilityName: string,
  capabilityEmoji: string,
  paSpent: number,
  result: CapabilityExecutionResult,
  locations?: string[]
): Promise<void> {
  try {
    const adminLogData: AdminLogData = {
      characterName,
      capabilityName,
      capabilityEmoji,
      paSpent,
    };

    // Ajouter le bonus log si présent dans les metadata
    if (result.metadata?.bonusLogMessage) {
      adminLogData.bonusLog = result.metadata.bonusLogMessage;
    }

    // Ajouter les coordonnées si fournies OU si présentes dans les metadata
    if (locations && locations.length > 0) {
      adminLogData.locations = locations;
    } else if (result.metadata?.locations && result.metadata.locations.length > 0) {
      adminLogData.locations = result.metadata.locations;
    }

    // Ajouter les objets bonus si présents dans les metadata
    if (result.metadata?.bonusObjects && result.metadata.bonusObjects.length > 0) {
      adminLogData.bonusObjects = result.metadata.bonusObjects;
    }

    await sendAdminLog(guildId, client, adminLogData);
  } catch (error) {
    logger.error("Error in handleCapabilityAdminLog:", {
      guildId,
      characterName,
      capabilityName,
      error,
    });
  }
}

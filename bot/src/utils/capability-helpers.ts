import { sendAdminLog, type AdminLogData } from "../services/admin-log.service.js";
import { logger } from "../services/logger.js";
import type { Client } from "discord.js";

/**
 * Résultat d'exécution de capacité (simplifié pour le bot)
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
 */
export async function handleCapabilityAdminLog(
  guildId: string,
  client: Client,
  characterName: string,
  capabilityName: string,
  capabilityEmoji: string,
  paSpent: number,
  result: CapabilityExecutionResult
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

import { Client, TextChannel } from "discord.js";
import { apiService } from "../services/api";
import { logger } from "../services/logger";
import { STATUS, CHARACTER } from "@shared/constants/emojis";

/**
 * Envoie un log dans le canal admin si configuré
 * @param guildId ID Discord de la guilde
 * @param client Client Discord
 * @param message Message à envoyer
 */
export async function sendAdminLog(
  guildId: string,
  client: Client,
  message: string
): Promise<void> {
  try {
    // Récupérer la configuration de la guilde
    const guildConfig = (await apiService.guilds.getGuildByDiscordId(
      guildId
    )) as any;

    if (!guildConfig?.adminLogChannelId) {
      // Pas de channel configuré, ne rien faire (silencieux)
      return;
    }

    // Récupérer le channel
    const channel = await client.channels.fetch(guildConfig.adminLogChannelId);

    if (!channel || !channel.isTextBased()) {
      logger.warn("Admin log channel not found or not text-based", {
        guildId,
        channelId: guildConfig.adminLogChannelId,
      });
      return;
    }

    // Envoyer le message
    await (channel as TextChannel).send(message);
    logger.info("Admin log sent successfully", { guildId });
  } catch (error) {
    logger.error("Error sending admin log:", {
      guildId,
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Formate un log d'utilisation de capacité admin (Cartographier, Rechercher, Auspice)
 * @param characterName Nom du personnage
 * @param capabilityName Nom de la capacité
 * @param capabilityEmoji Emoji de la capacité
 * @param paUsed Points d'action dépensés
 * @param bonusObjectName Nom de l'objet bonus (optionnel)
 * @param result Résultat de la capacité
 */
export function formatAdminCapabilityLog(
  characterName: string,
  capabilityName: string,
  capabilityEmoji: string,
  paUsed: number,
  result: string,
  bonusObjectName?: string
): string {
  let log = `${STATUS.STATS} **Capacité utilisée - Tag Admin**\n`;
  log += `${CHARACTER.PERSON} **Personnage:** ${characterName}\n`;
  log += `${CHARACTER.PA} **Capacité:** ${capabilityEmoji} ${capabilityName}\n`;
  log += `${CHARACTER.PA} **PA dépensés:** ${paUsed}\n`;
  log += `📋 **Résultat:** ${result}\n`;

  if (bonusObjectName) {
    log += `🎒 **Objet bonus:** ${bonusObjectName} (amélioration active)`;
  }

  return log;
}

/**
 * Formate un log d'utilisation de capacité améliorée (autres capacités avec bonus)
 * @param debugLogs Les logs de debug du backend
 */
export function formatBonusCapabilityLogs(debugLogs: string[]): string {
  if (debugLogs.length === 0) {
    return "";
  }

  let log = `${STATUS.STATS} **Capacité améliorée - Bonus activé**\n\n`;
  log += debugLogs.map((l) => `📊 ${l}`).join("\n");

  return log;
}

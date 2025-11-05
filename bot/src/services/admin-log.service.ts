import { Client, TextChannel } from "discord.js";
import { apiService } from "./api.js";
import { logger } from "./logger.js";

/**
 * Données pour un log admin
 */
export interface AdminLogData {
  characterName: string;
  capabilityName: string;
  capabilityEmoji: string;
  paSpent: number;
  bonusLog?: string; // Message de log bonus (format console.log)
}

/**
 * Récupère le salon de logs admin configuré pour une guilde
 * @param guildId L'ID de la guilde Discord
 * @param client Le client Discord
 * @returns Le salon de logs admin ou null si non configuré
 */
export async function getAdminLogChannel(
  guildId: string,
  client: Client
): Promise<TextChannel | null> {
  try {
    const guild = await apiService.getGuildByDiscordId(guildId) as {
      adminLogChannelId?: string;
    } | null;

    if (!guild || typeof guild !== "object" || !guild.adminLogChannelId) {
      return null;
    }

    const channel = client.channels.cache.get(
      guild.adminLogChannelId
    ) as TextChannel;

    if (!channel || channel.type !== 0) {
      logger.warn(
        `Admin log channel ${guild?.adminLogChannelId || "unknown"} not found or not a text channel for guild ${guildId}`
      );
      return null;
    }

    return channel;
  } catch (error) {
    logger.error("Error getting admin log channel:", {
      guildId,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    });
    return null;
  }
}

/**
 * Formate un message de log admin
 * @param data Les données du log
 * @returns Le message formaté
 */
function formatAdminLogMessage(data: AdminLogData): string {
  let message = `${data.capabilityEmoji} **${data.capabilityName}**\n`;
  message += `**Personnage :** ${data.characterName}\n`;
  message += `**PA dépensés :** ${data.paSpent}`;

  if (data.bonusLog) {
    message += `\n\n\`\`\`\n${data.bonusLog}\n\`\`\``;
  }

  return message;
}

/**
 * Envoie un message dans le salon de logs admin configuré
 * Si le channel n'est pas configuré, ne fait rien (silent fail)
 * @param guildId L'ID de la guilde Discord
 * @param client Le client Discord
 * @param data Les données du log admin
 * @returns true si le message a été envoyé, false sinon
 */
export async function sendAdminLog(
  guildId: string,
  client: Client,
  data: AdminLogData
): Promise<boolean> {
  try {
    const adminLogChannel = await getAdminLogChannel(guildId, client);

    if (!adminLogChannel) {
      logger.debug(
        `No admin log channel configured for guild ${guildId}, skipping admin log`
      );
      return false;
    }

    const message = formatAdminLogMessage(data);
    await adminLogChannel.send(message);
    logger.info(`Admin log sent to guild ${guildId}`, {
      characterName: data.characterName,
      capability: data.capabilityName,
      paSpent: data.paSpent,
      hadBonus: !!data.bonusLog,
    });
    return true;
  } catch (error) {
    logger.error("Error sending admin log message:", {
      guildId,
      data,
      error,
    });
    return false;
  }
}

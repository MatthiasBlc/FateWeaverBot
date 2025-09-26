import { Client, TextChannel } from "discord.js";
import { apiService } from "../services/api.js";
import { logger } from "../services/logger.js";

/**
 * Récupère le salon de logs configuré pour un serveur
 * @param guildId L'ID du serveur Discord
 * @param client Le client Discord
 * @returns Le salon de logs ou null si non configuré
 */
export async function getLogChannel(
  guildId: string,
  client: Client
): Promise<TextChannel | null> {
  try {
    // Récupérer les informations du serveur depuis la base de données
    const server = await apiService.getServerByDiscordId(guildId);

    if (!server || !server.logChannelId) {
      return null;
    }

    // Récupérer le salon Discord
    const channel = client.channels.cache.get(server.logChannelId) as TextChannel;

    if (!channel || channel.type !== 0) {
      logger.warn(`Log channel ${server.logChannelId} not found or not a text channel for guild ${guildId}`);
      return null;
    }

    return channel;
  } catch (error) {
    logger.error("Error getting log channel:", {
      guildId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return null;
  }
}

/**
 * Envoie un message dans le salon de logs configuré
 * @param guildId L'ID du serveur Discord
 * @param client Le client Discord
 * @param message Le message à envoyer
 * @returns true si le message a été envoyé, false sinon
 */
export async function sendLogMessage(
  guildId: string,
  client: Client,
  message: string
): Promise<boolean> {
  try {
    const logChannel = await getLogChannel(guildId, client);

    if (!logChannel) {
      logger.debug(`No log channel configured for guild ${guildId}`);
      return false;
    }

    await logChannel.send(message);
    return true;
  } catch (error) {
    logger.error("Error sending log message:", { guildId, message, error });
    return false;
  }
}

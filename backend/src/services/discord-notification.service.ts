import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { prisma } from '../util/db';
import { logger } from './logger';

class DiscordNotificationService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async sendNotification(guildId: string, message: string): Promise<boolean> {
    try {
      // Find the guild's log channel
      const guild = await prisma.guild.findUnique({
        where: { discordGuildId: guildId },
        select: { logChannelId: true }
      });

      if (!guild?.logChannelId) {
        logger.warn(`No log channel configured for guild ${guildId}`);
        return false;
      }

      // Get the channel
      const channel = await this.client.channels.fetch(guild.logChannelId) as TextChannel | null;
      if (!channel) {
        logger.warn(`Channel ${guild.logChannelId} not found`);
        return false;
      }

      // Send the message
      await channel.send(message);
      return true;
    } catch (error) {
      logger.error('Error sending Discord notification:', error);
      return false;
    }
  }

  async sendDailyMessage(guildId: string, townName: string, data: {
    weather: string;
    actions: string;
    stocks: string;
    expeditions: string;
  }): Promise<boolean> {
    try {
      // Find the guild's daily message channel
      const guild = await prisma.guild.findUnique({
        where: { discordGuildId: guildId },
        select: { dailyMessageChannelId: true }
      });

      if (!guild?.dailyMessageChannelId) {
        logger.warn(`No daily message channel configured for guild ${guildId}`);
        return false;
      }

      const channel = await this.client.channels.fetch(guild.dailyMessageChannelId) as TextChannel | null;
      if (!channel) {
        logger.error(`Channel not found for channel ID: ${guild.dailyMessageChannelId}`);
        return false;
      }

      // Format the message with the provided data
      const message = `**${townName} - Mise à jour quotidienne**\n` +
        `🌦️ **Météo:** ${data.weather}\n` +
        `📝 **Actions disponibles:** ${data.actions}\n` +
        `📦 **Stocks:** ${data.stocks}\n` +
        `⚔️ **Expéditions en cours:** ${data.expeditions}`;

      await channel.send(message);
      return true;
    } catch (error) {
      logger.error('Error sending daily message:', error);
      return false;
    }
  }

  async sendSeasonChangeNotification(channelId: string, seasonName: string, emoji: string): Promise<boolean> {
    try {
      const channel = await this.client.channels.fetch(channelId) as TextChannel | null;
      if (!channel) {
        logger.error(`Channel not found for channel ID: ${channelId}`);
        return false;
      }

      const seasonMap: Record<string, string> = {
        'SPRING': 'Printemps',
        'SUMMER': 'Été',
        'AUTUMN': 'Automne',
        'WINTER': 'Hiver'
      };

      const seasonNameFr = seasonMap[seasonName] || seasonName;
      const message = `${emoji} **Changement de saison !** ${emoji}\n` +
        `La saison change pour : **${seasonNameFr}** ${emoji}\n` +
        `Les effets de saison sont maintenant actifs !`;

      await channel.send(message);
      return true;
    } catch (error) {
      logger.error('Error sending season change notification:', error);
      return false;
    }
  }
}

// Export a singleton instance with necessary intents
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

export const discordNotificationService = new DiscordNotificationService(discordClient);

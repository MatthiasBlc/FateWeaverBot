import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { prisma } from '../util/db';
import { logger } from './logger';
import env from '../util/validateEnv';

class DiscordNotificationService {
  private client: Client;
  private isReady: boolean = false;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Initialize and login the Discord client
   * Should be called once at application startup
   */
  async initialize(): Promise<void> {
    if (this.isReady) {
      logger.warn('Discord notification service already initialized');
      return;
    }

    if (!env.DISCORD_TOKEN) {
      logger.warn('DISCORD_TOKEN not configured - Discord notifications will not work');
      return;
    }

    try {
      this.client.once('ready', () => {
        this.isReady = true;
        logger.info(`Discord notification client logged in as ${this.client.user?.tag}`);
      });

      await this.client.login(env.DISCORD_TOKEN);
    } catch (error) {
      logger.error('Failed to initialize Discord notification client:', error);
      throw error;
    }
  }

  /**
   * Check if the Discord client is ready to send notifications
   */
  private ensureReady(): void {
    if (!this.isReady) {
      throw new Error('Discord notification service not initialized. Call initialize() first.');
    }
  }

  async sendNotification(guildId: string, message: string): Promise<boolean> {
    try {
      this.ensureReady();

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
      this.ensureReady();

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
      this.ensureReady();

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

  /**
   * Send notification to expedition's dedicated channel (if configured and DEPARTED)
   * Falls back to guild's log channel if no dedicated channel
   */
  async sendExpeditionNotification(
    expeditionId: string,
    guildId: string,
    message: string
  ): Promise<boolean> {
    try {
      this.ensureReady();

      // Import container here to avoid circular dependency
      const { container } = await import('../infrastructure/container');

      // Check if expedition has a dedicated channel
      const expeditionChannelId = await container.expeditionService.getExpeditionChannelId(expeditionId);

      if (expeditionChannelId) {
        // Send to expedition's dedicated channel
        return await this.sendNotificationToChannel(expeditionChannelId, message);
      } else {
        // Fallback to guild's log channel
        return await this.sendNotification(guildId, message);
      }
    } catch (error) {
      logger.error("Error sending expedition notification:", {
        expeditionId,
        guildId,
        error,
      });
      return false;
    }
  }

  /**
   * Send message to a specific channel ID
   */
  private async sendNotificationToChannel(
    channelId: string,
    message: string
  ): Promise<boolean> {
    try {
      this.ensureReady();

      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        logger.warn(`Channel ${channelId} not found or not text-based`);
        return false;
      }

      await (channel as TextChannel).send(message);
      return true;
    } catch (error) {
      logger.error(`Error sending message to channel ${channelId}:`, error);
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

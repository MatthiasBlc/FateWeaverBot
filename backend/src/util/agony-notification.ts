/**
 * Agony Notification Utility
 *
 * Handles sending public log messages when characters enter agony state.
 */

import { discordNotificationService } from '../services/discord-notification.service';
import { logger } from '../services/logger';

/**
 * Sends a public log notification when a character enters agony
 *
 * @param guildDiscordId Discord guild ID where the notification should be sent
 * @param characterName Name of the character entering agony
 * @param cause Cause of agony (e.g., "hunger", "combat", "damage")
 */
export async function notifyAgonyEntered(
  guildDiscordId: string,
  characterName: string,
  cause?: 'hunger' | 'damage' | 'other'
): Promise<void> {
  try {
    // Determine message based on cause
    let message = `⚠️ **${characterName}** vient de passer en agonie`;

    if (cause === 'hunger') {
      message += ' à cause de la faim';
    } else if (cause === 'damage') {
      message += ' suite à des blessures';
    }

    message += ' ! 💀';

    // Send notification to the configured log channel
    await discordNotificationService.sendNotification(guildDiscordId, message);

    logger.info('Agony notification sent', {
      guildDiscordId,
      characterName,
      cause
    });
  } catch (error) {
    logger.error('Error sending agony notification', {
      guildDiscordId,
      characterName,
      cause,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  }
}

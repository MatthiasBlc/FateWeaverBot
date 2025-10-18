import { CronJob } from "cron";
import { PrismaClient } from "@prisma/client";
import { dailyMessageService } from "../services/daily-message.service";
import { discordNotificationService } from "../services/discord-notification.service";
import { logger } from "../services/logger";

const prisma = new PrismaClient();

async function sendDailyMessages() {
  try {
    logger.info("Starting daily message broadcast at 08:00");

    const towns = await prisma.town.findMany({
      include: {
        guild: {
          select: { logChannelId: true }
        }
      }
    });

    let sentCount = 0;

    for (const town of towns) {
      try {
        if (!town.guild?.logChannelId) {
          logger.warn(`Town ${town.name} has no log channel configured, skipping`);
          continue;
        }

        // Build message content with separate sections
        const [weather, actions, stocks, expeditions] = await Promise.all([
          dailyMessageService.getWeatherMessage(town.id),
          dailyMessageService.getActionRecap(town.id),
          dailyMessageService.getStockSummary(town.id),
          dailyMessageService.getExpeditionSummary(town.id)
        ]);

        // Send via Discord
        const result = await discordNotificationService.sendDailyMessage(
          town.guild.logChannelId,
          town.name,
          { weather, actions, stocks, expeditions }
        );

        if (result) {
          logger.info(`Daily message sent to Discord for ${town.name}`);
          sentCount++;
        } else {
          logger.warn(`Failed to send daily message for ${town.name} - check Discord service`);
        }
      } catch (error) {
        logger.error(`Failed to send daily message for town ${town.name}:`, { error });
      }
    }

    logger.info(`Daily messages sent to ${sentCount} towns`);
  } catch (error) {
    logger.error("Error in sendDailyMessages cron job:", { error });
  }
}

export function setupDailyMessageJob() {
  const job = new CronJob(
    "5 8 * * *", // 08:00:05 every day (after expedition returns/departs at 08:00:00)
    sendDailyMessages,
    null,
    true,
    "Europe/Paris"
  );

  logger.info("Daily message job scheduled for 08:00:05 daily (after expedition processing)");

  return { dailyMessageJob: job };
}

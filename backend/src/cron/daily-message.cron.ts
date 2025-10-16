import { CronJob } from "cron";
import { PrismaClient } from "@prisma/client";
import { dailyMessageService } from "../services/daily-message.service";
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

        const message = await dailyMessageService.buildDailyMessage(town.id);

        // TODO: Implement Discord webhook or API call to send message
        // For now, just log it
        logger.info(`Daily message for ${town.name}:`, { message });

        // In production, this would send to Discord:
        // await discordClient.channels.cache.get(town.guild.logChannelId)?.send(message);

        sentCount++;
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
    "0 8 * * *", // 08:00:00 every day
    sendDailyMessages,
    null,
    true,
    "Europe/Paris"
  );

  logger.info("Daily message job scheduled for 08:00 daily");

  return { dailyMessageJob: job };
}

import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { ExpeditionService } from "../services/expedition.service";
import { logger } from "../services/logger";

const prisma = new PrismaClient();
const expeditionService = new ExpeditionService();

async function lockExpeditionsDue() {
  try {
    logger.debug("Starting scheduled expedition lock check");

    const now = new Date();
    const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all PLANNING expeditions created before midnight today
    const expeditionsToLock = await prisma.expedition.findMany({
      where: {
        status: "PLANNING",
        createdAt: { lt: midnightToday }
      },
      select: { id: true, name: true }
    });

    logger.info(`Found ${expeditionsToLock.length} expeditions to lock`);

    let lockedCount = 0;
    for (const expedition of expeditionsToLock) {
      try {
        await expeditionService.lockExpedition(expedition.id);
        lockedCount++;
      } catch (error) {
        logger.error(`Failed to lock expedition ${expedition.id}:`, { error });
      }
    }

    logger.info(`Locked ${lockedCount} expeditions`);
  } catch (error) {
    logger.error("Error in lockExpeditionsDue cron job:", { error });
  }
}

async function departExpeditionsDue() {
  try {
    logger.debug("Starting scheduled expedition depart check");

    // Find all LOCKED expeditions
    const expeditionsToDepart = await prisma.expedition.findMany({
      where: {
        status: "LOCKED"
      },
      select: { id: true, name: true }
    });

    logger.info(`Found ${expeditionsToDepart.length} expeditions to depart`);

    let departedCount = 0;
    for (const expedition of expeditionsToDepart) {
      try {
        await expeditionService.departExpedition(expedition.id);
        departedCount++;
      } catch (error) {
        logger.error(`Failed to depart expedition ${expedition.id}:`, { error });
      }
    }

    logger.info(`Departed ${departedCount} expeditions`);
  } catch (error) {
    logger.error("Error in departExpeditionsDue cron job:", { error });
  }
}

async function returnExpeditionsDue() {
  try {
    logger.debug("Starting scheduled expedition return check");

    const now = new Date();

    // Find all DEPARTED expeditions whose return time has passed
    const expeditionsToReturn = await prisma.expedition.findMany({
      where: {
        status: "DEPARTED",
        returnAt: { lte: now }
      },
      select: { id: true, name: true, returnAt: true }
    });

    logger.info(`Found ${expeditionsToReturn.length} expeditions to return`);

    let returnedCount = 0;
    for (const expedition of expeditionsToReturn) {
      try {
        await expeditionService.returnExpedition(expedition.id);
        returnedCount++;
      } catch (error) {
        logger.error(`Failed to return expedition ${expedition.id}:`, { error });
      }
    }

    logger.info(`Returned ${returnedCount} expeditions`);
  } catch (error) {
    logger.error("Error in returnExpeditionsDue cron job:", { error });
  }
}

export function setupExpeditionJobs() {
  // Lock expeditions at midnight (00:00)
  const lockJob = new CronJob("0 0 * * *", lockExpeditionsDue, null, true, "Europe/Paris");
  logger.info("Expedition lock job scheduled for midnight daily");

  // Depart expeditions at 08:00
  const departJob = new CronJob("0 8 * * *", departExpeditionsDue, null, true, "Europe/Paris");
  logger.info("Expedition depart job scheduled for 08:00 daily");

  // Return expeditions every 10 minutes
  const returnJob = new CronJob("*/10 * * * *", returnExpeditionsDue, null, true, "Europe/Paris");
  logger.info("Expedition return job scheduled every 10 minutes");

  return {
    lockJob,
    departJob,
    returnJob
  };
}

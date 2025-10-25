import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { container } from "../infrastructure/container";
import { logger } from "../services/logger";

const prisma = new PrismaClient();

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
      include: {
        members: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                isDead: true,
                hp: true,
                hungerLevel: true,
                pm: true
              }
            }
          }
        }
      }
    });

    logger.info(`Found ${expeditionsToLock.length} expeditions to lock`);

    let lockedCount = 0;
    let membersRemovedCount = 0;

    for (const expedition of expeditionsToLock) {
      try {
        // STEP 1: Check member states and remove those who shouldn't continue
        for (const member of expedition.members) {
          const { character } = member;
          const shouldRemove =
            character.isDead ||            // Mort
            character.hp <= 1 ||           // Agonie/Mort (HP)
            character.hungerLevel <= 1 ||  // Affamé/Agonie (hunger)
            character.pm <= 1;             // Dépression (PM=0) ou déprime (PM=1)

          if (shouldRemove) {
            // Determine reason
            let reason = "";
            if (character.isDead || character.hp <= 1) reason = "mort/agonie";
            else if (character.hungerLevel <= 1) reason = "affamé/agonie";
            else if (character.pm <= 1) reason = "dépression/déprime";

            try {
              await container.expeditionService.removeMemberCatastrophic(
                expedition.id,
                character.id,
                reason
              );
              membersRemovedCount++;
              logger.info(`Member ${character.name} removed from expedition ${expedition.name} during lock (${reason})`);
            } catch (error) {
              logger.error(`Failed to remove member ${character.id} from expedition ${expedition.id}:`, { error });
            }
          }
        }

        // STEP 2: Lock the expedition
        await container.expeditionService.lockExpedition(expedition.id);

        // Set UNKNOWN direction if not set
        if (!expedition.initialDirection || expedition.initialDirection === "UNKNOWN") {
          await prisma.expedition.update({
            where: { id: expedition.id },
            data: { initialDirection: "UNKNOWN" },
          });
        }

        lockedCount++;
      } catch (error) {
        logger.error(`Failed to lock expedition ${expedition.id}:`, { error });
      }
    }

    logger.info(`Locked ${lockedCount} expeditions`);
    logger.info(`Removed ${membersRemovedCount} members during locking`);
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
      select: { id: true, name: true, initialDirection: true }
    });

    logger.info(`Found ${expeditionsToDepart.length} expeditions to depart`);

    let departedCount = 0;
    for (const expedition of expeditionsToDepart) {
      try {
        await container.expeditionService.departExpedition(expedition.id);

        // Initialize path with initial direction (default to UNKNOWN if null)
        await prisma.expedition.update({
          where: { id: expedition.id },
          data: {
            path: [expedition.initialDirection || "UNKNOWN"],
          },
        });

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
        await container.expeditionService.returnExpedition(expedition.id);
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

async function processEmergencyReturns() {
  try {
    logger.debug("Starting emergency return check");

    const emergencyCount = await container.expeditionService.forceEmergencyReturns();

    if (emergencyCount > 0) {
      logger.info(`Processed ${emergencyCount} emergency returns`);
    }
  } catch (error) {
    logger.error("Error in processEmergencyReturns cron job:", { error });
  }
}

async function morningExpeditionUpdate() {
  try {
    logger.info("=== Starting morning expedition update at 08:00 ===");

    // STEP 1: Process all returns (normal + emergency)
    await returnExpeditionsDue();
    await processEmergencyReturns();

    // STEP 2: Depart new expeditions
    await departExpeditionsDue();

    logger.info("=== Morning expedition update completed ===");
  } catch (error) {
    logger.error("Error in morning expedition update:", { error });
  }
}

export function setupExpeditionJobs() {
  // Lock expeditions at midnight (00:00)
  const lockJob = new CronJob("0 0 * * *", lockExpeditionsDue, null, true, "Europe/Paris");
  logger.info("Expedition lock job scheduled for midnight daily");

  // Morning update at 08:00: Returns → Departs
  const morningJob = new CronJob("0 8 * * *", morningExpeditionUpdate, null, true, "Europe/Paris");
  logger.info("Morning expedition update job scheduled for 08:00 daily (returns then departs)");

  return {
    lockJob,
    morningJob
  };
}

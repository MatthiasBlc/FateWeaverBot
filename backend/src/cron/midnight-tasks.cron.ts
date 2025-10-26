/**
 * Unified midnight CRON job (00:00:00)
 * Executes all midnight tasks in the correct order:
 * 1. Hunger Decrease
 * 2. PM Contagion
 * 3. Expedition Lock
 * 4. Daily PA Update (includes PA regen + PA deduction for LOCKED/DEPARTED expeditions)
 */

import { CronJob } from "cron";
import { logger } from "../services/logger";

// Import individual task functions (we'll need to export them from their respective files)
import { increaseAllCharactersHunger } from "./hunger-increase.cron";
import { updateMentalHealthContagion } from "./daily-pm.cron";
import { lockExpeditionsDue } from "./expedition.cron";
import { dailyPaUpdate } from "./daily-pa.cron";

/**
 * Main midnight orchestrator
 * Executes all tasks sequentially to guarantee order
 */
async function midnightTasksOrchestrator() {
  try {
    logger.info("╔════════════════════════════════════════════════════════════════════╗");
    logger.info("║         EXÉCUTION DES TÂCHES CRON DE MINUIT (00:00:00)           ║");
    logger.info("╚════════════════════════════════════════════════════════════════════╝");

    // STEP 1: Hunger Decrease
    logger.info("\n=== STEP 1: HUNGER DECREASE ===");
    await increaseAllCharactersHunger();

    // STEP 2: PM Contagion
    logger.info("\n=== STEP 2: PM CONTAGION ===");
    await updateMentalHealthContagion();

    // STEP 3: Expedition Lock
    logger.info("\n=== STEP 3: EXPEDITION LOCK ===");
    await lockExpeditionsDue();

    // STEP 4: Daily PA Update
    logger.info("\n=== STEP 4: DAILY PA UPDATE ===");
    await dailyPaUpdate();

    logger.info("\n✅ TOUTES LES TÂCHES DE MINUIT SONT TERMINÉES");
  } catch (error) {
    logger.error("❌ ERREUR lors de l'exécution des tâches de minuit:", { error });
  }
}

export function setupMidnightTasksJob() {
  // Single unified job at midnight (00:00:00)
  const job = new CronJob(
    "0 0 0 * * *",
    midnightTasksOrchestrator,
    null,
    true,
    "Europe/Paris"
  );

  logger.info("Job CRON unifié de minuit configuré (00:00:00)");
  logger.info("  - Ordre garanti: Hunger → PM → Expedition Lock → PA Update");

  return job;
}

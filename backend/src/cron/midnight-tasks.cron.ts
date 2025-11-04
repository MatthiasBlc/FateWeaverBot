/**
 * Unified midnight CRON job (00:00:00)
 * Executes all midnight tasks in the correct order:
 * 1. Hunger Decrease
 * 2. PM Contagion
 * 3. PA Regeneration (CRITICAL: must happen BEFORE expedition lock)
 * 4. Expedition Lock (characters must have regenerated PA first)
 * 5. PA Deduction for expeditions (LOCKED/DEPARTED)
 */

import { CronJob } from "cron";
import { logger } from "../services/logger";

// Import individual task functions (we'll need to export them from their respective files)
import { increaseAllCharactersHunger } from "./hunger-increase.cron";
import { updateMentalHealthContagion } from "./daily-pm.cron";
import { lockExpeditionsDue } from "./expedition.cron";
import {
  updateAllCharactersActionPoints,
  appendDailyDirections,
  deductExpeditionPA
} from "./daily-pa.cron";

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

    // STEP 3: PA Regeneration
    // CRITICAL: Must happen BEFORE expedition lock so characters have PA available
    logger.info("\n=== STEP 3: PA REGENERATION ===");
    await updateAllCharactersActionPoints();

    // STEP 4: Append daily expedition directions (for DEPARTED expeditions)
    logger.info("\n=== STEP 4: APPEND EXPEDITION DIRECTIONS ===");
    await appendDailyDirections();

    // STEP 5: Expedition Lock (PLANNING → LOCKED)
    // Happens AFTER PA regeneration so characters can afford the first 2 PA cost
    logger.info("\n=== STEP 5: EXPEDITION LOCK ===");
    await lockExpeditionsDue();

    // STEP 6: Deduct PA for expeditions (LOCKED = first day, DEPARTED = ongoing)
    // Happens AFTER lock so newly LOCKED expeditions are charged
    logger.info("\n=== STEP 6: DEDUCT EXPEDITION PA ===");
    await deductExpeditionPA();

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
  logger.info("  - Ordre garanti: Hunger → PM → PA Regen → Directions → Lock → PA Deduct");

  return job;
}

/**
 * Script de simulation des tâches CRON du matin (08:00:00 + 08:00:05)
 * Exécute dans le bon ordre :
 * 1. Return Expeditions (08:00:00)
 * 2. Depart Expeditions (08:00:00)
 * 3. Daily Message (08:00:05)
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";
import { container } from "../infrastructure/container";
import { logger } from "../services/logger";
import { dailyMessageService } from "../services/daily-message.service";
import { discordNotificationService } from "../services/discord-notification.service";

const prisma = new PrismaClient();

// ====================================================================
// STEP 1: RETURN EXPEDITIONS
// ====================================================================
async function returnExpeditions() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: RETURN EXPEDITIONS (08:00:00)");
  console.log("=".repeat(70));

  const now = new Date();

  const expeditionsToReturn = await prisma.expedition.findMany({
    where: {
      status: "DEPARTED",
      returnAt: { lte: now }
    },
    select: { id: true, name: true, returnAt: true }
  });

  console.log(`${expeditionsToReturn.length} expéditions à retourner`);

  let returnedCount = 0;
  for (const expedition of expeditionsToReturn) {
    try {
      await container.expeditionService.returnExpedition(expedition.id);
      returnedCount++;
      console.log(`   ✅ ${expedition.name} retournée`);
    } catch (error) {
      console.error(`   ❌ Erreur pour ${expedition.name}:`, error);
    }
  }

  console.log(`✅ ${returnedCount} expéditions retournées`);

  // Process emergency returns
  console.log("\n--- Traitement des retours d'urgence ---");
  const emergencyCount = await container.expeditionService.forceEmergencyReturns();
  if (emergencyCount > 0) {
    console.log(`✅ ${emergencyCount} retours d'urgence traités`);
  } else {
    console.log("   Aucun retour d'urgence");
  }
}

// ====================================================================
// STEP 2: DEPART EXPEDITIONS
// ====================================================================
async function departExpeditions() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: DEPART EXPEDITIONS (08:00:00)");
  console.log("=".repeat(70));

  const expeditionsToDepart = await prisma.expedition.findMany({
    where: {
      status: "LOCKED"
    },
    select: { id: true, name: true, initialDirection: true }
  });

  console.log(`${expeditionsToDepart.length} expéditions à faire partir`);

  let departedCount = 0;
  for (const expedition of expeditionsToDepart) {
    try {
      await container.expeditionService.departExpedition(expedition.id);

      // Initialize path with initial direction
      await prisma.expedition.update({
        where: { id: expedition.id },
        data: {
          path: [expedition.initialDirection || "UNKNOWN"],
        },
      });

      departedCount++;
      console.log(`   ✅ ${expedition.name} partie (direction: ${expedition.initialDirection || "UNKNOWN"})`);
    } catch (error) {
      console.error(`   ❌ Erreur pour ${expedition.name}:`, error);
    }
  }

  console.log(`✅ ${departedCount} expéditions parties`);
}

// ====================================================================
// STEP 3: DAILY MESSAGE
// ====================================================================
async function sendDailyMessages() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: DAILY MESSAGE (08:00:05)");
  console.log("=".repeat(70));

  const towns = await prisma.town.findMany({
    include: {
      guild: {
        select: { logChannelId: true }
      }
    }
  });

  console.log(`${towns.length} villes trouvées`);

  let sentCount = 0;

  for (const town of towns) {
    try {
      if (!town.guild?.logChannelId) {
        console.log(`   ⚠️  ${town.name}: pas de canal de log configuré`);
        continue;
      }

      // Build message content
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
        console.log(`   ✅ ${town.name}: message quotidien envoyé`);
        sentCount++;
      } else {
        console.log(`   ⚠️  ${town.name}: échec d'envoi (vérifier le service Discord)`);
      }
    } catch (error) {
      console.error(`   ❌ Erreur pour ${town.name}:`, error);
    }
  }

  console.log(`✅ Messages quotidiens envoyés à ${sentCount} villes`);
}

// ====================================================================
// MAIN
// ====================================================================
async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║         SIMULATION DES TÂCHES CRON DU MATIN (08:00:00)            ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  try {
    await returnExpeditions();
    await departExpeditions();
    await sendDailyMessages();

    console.log("\n" + "=".repeat(70));
    console.log("✅ TOUTES LES TÂCHES DU MATIN SONT TERMINÉES");
    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERREUR lors de la simulation:", error);
    process.exit(1);
  }
}

main();

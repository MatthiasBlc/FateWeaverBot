import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { container } from "../infrastructure/container";

const prisma = new PrismaClient();

export function setupDailyPaJob() {
  // Single unified PA job at 00:00:00
  const mainJob = new CronJob("0 0 * * *", dailyPaUpdate, null, true, "Europe/Paris");

  console.log("Job CRON pour la mise à jour quotidienne des PA configuré");
  console.log("  - Job unifié: 00:00:00 (régénération PA + directions + expéditions)");

  return { mainJob };
}

async function dailyPaUpdate() {
  try {
    console.log("=== Début de la mise à jour quotidienne des PA ===");

    // STEP 1-5: Update all characters (PA, death, agony, etc.)
    await updateAllCharactersActionPoints();

    // STEP 6: Append daily expedition directions
    await appendDailyDirections();

    // STEP 7: Deduct PA for expeditions
    await deductExpeditionPA();

    console.log("=== Mise à jour quotidienne des PA terminée ===");
  } catch (error) {
    console.error("Erreur lors de la mise à jour quotidienne des PA:", error);
  }
}

async function updateAllCharactersActionPoints() {
  try {
    console.log("Début de la mise à jour quotidienne des points d'action...");

    // Get ALL living characters for the daily update
    const characters = await prisma.character.findMany({
      where: { isDead: false },
    });

    console.log(`${characters.length} personnages à traiter`);
    let updatedCount = 0;
    let deathCount = 0;

    for (const character of characters) {
      const now = new Date();
      const updateData: {
        hp?: number;
        isDead?: boolean;
        agonySince?: null;
        paUsedToday?: number;
        lastPaReset?: Date;
        paTotal?: { increment: number };
        lastPaUpdate?: Date;
      } = {};

      // STEP 1: Reset agonySince if character has recovered from agony (hp > 1)
      // This must happen BEFORE agony duration check to handle healed characters
      if (character.hp > 1 && character.agonySince) {
        updateData.agonySince = null;
      }

      // STEP 2: Check for death (HP = 0)
      if (character.hp === 0) {
        updateData.isDead = true;
        deathCount++;
      }

      // STEP 3: Check agony duration (2 days = death)
      // Only for characters still in agony (hp=1) who haven't recovered
      if (character.hp === 1 && character.agonySince) {
        const daysSinceAgony = Math.floor(
          (now.getTime() - character.agonySince.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceAgony >= 2) {
          updateData.isDead = true;
          updateData.hp = 0;
          deathCount++;
        }
      }

      // STEP 4: Reset PA counter daily (pour déprime)
      updateData.paUsedToday = 0;
      updateData.lastPaReset = now;

      // STEP 5: Update PA (regenerate daily at midnight)
      const lastUpdate = character.lastPaUpdate;

      // Check if midnight has passed since last update (compare dates, not time)
      const lastUpdateDate = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysSinceLastUpdate = Math.floor((currentDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));

      // DEBUG: Log PA regeneration check
      console.log(`[PA CHECK] ${character.name}: daysSince=${daysSinceLastUpdate}, paTotal=${character.paTotal}, isDead=${!!updateData.isDead}, lastUpdate=${lastUpdate.toISOString()}`);

      // Regenerate PA if at least one midnight has passed
      if (daysSinceLastUpdate >= 1 && character.paTotal < 4 && !updateData.isDead) {
        // Calculate PA to add based on hunger level
        let pointsToAdd = 2; // Default: +2 PA

        // Affamé penalty: hungerLevel <= 1 → only +1 PA
        if (character.hungerLevel <= 1) {
          pointsToAdd = 1;
        }

        const maxPointsToAdd = 4 - character.paTotal;
        pointsToAdd = Math.min(pointsToAdd, maxPointsToAdd);

        if (pointsToAdd > 0) {
          updateData.paTotal = { increment: pointsToAdd };
          updateData.lastPaUpdate = now;
          console.log(`[PA REGEN] ${character.name}: +${pointsToAdd} PA (hunger=${character.hungerLevel})`);
        }
      } else {
        console.log(`[PA SKIP] ${character.name}: Condition non remplie`);
      }

      // Apply all updates if any
      if (Object.keys(updateData).length > 0) {
        await prisma.character.update({
          where: { id: character.id },
          data: updateData,
        });
        updatedCount++;
      }
    }

    console.log(`Mise à jour terminée. ${updatedCount} personnages mis à jour.`);
    console.log(`  - ${deathCount} personnages décédés (HP=0 ou agonie 2j)`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour quotidienne des PA:", error);
  }
}

async function appendDailyDirections() {
  try {
    console.log("\n--- STEP 6: Append daily expedition directions ---");

    const expeditions = await prisma.expedition.findMany({
      where: {
        status: "DEPARTED",
        currentDayDirection: { not: null },
      },
      select: { id: true, name: true, path: true, currentDayDirection: true },
    });

    for (const exp of expeditions) {
      if (exp.currentDayDirection) {
        // Append direction to path
        const newPath = [...exp.path, exp.currentDayDirection];

        await prisma.expedition.update({
          where: { id: exp.id },
          data: {
            path: newPath,
            currentDayDirection: null,
            directionSetBy: null,
            directionSetAt: null,
          },
        });

        console.log(`  - Appended direction ${exp.currentDayDirection} to expedition ${exp.name}`);
      }
    }

    console.log(`Appended directions for ${expeditions.length} expedition(s)`);
  } catch (error) {
    console.error("Error appending daily directions:", error);
  }
}

async function deductExpeditionPA() {
  try {
    console.log("\n--- STEP 7: Deduct PA for expeditions ---");

    // Get all expedition members from DEPARTED expeditions
    const expeditionMembers = await prisma.expeditionMember.findMany({
      where: {
        expedition: { status: "DEPARTED" }
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            paTotal: true,
            hungerLevel: true,
            isDead: true,
            hp: true,
            pm: true
          }
        },
        expedition: {
          select: {
            id: true,
            name: true,
            townId: true,
            pendingEmergencyReturn: true
          }
        }
      }
    });

    console.log(`${expeditionMembers.length} membres d'expédition à traiter`);

    let deductedCount = 0;
    let catastrophicReturns = 0;

    for (const member of expeditionMembers) {
      const { character, expedition } = member;

      // Skip if expedition has pending emergency return
      if (expedition.pendingEmergencyReturn) {
        console.log(`  - Expédition ${expedition.name} en attente de retour d'urgence - skip ${character.name}`);
        continue;
      }

      // Check if character can afford the expedition cost (needs PA >= 2)
      // PA has already been regenerated in STEP 5 (with hunger penalties applied)
      const canAffordExpedition = character.paTotal >= 2;

      if (canAffordExpedition) {
        // Deduct 2 PA for expedition
        await prisma.character.update({
          where: { id: character.id },
          data: { paTotal: { decrement: 2 } }
        });
        deductedCount++;
        console.log(`  - ${character.name}: ${character.paTotal} PA → ${character.paTotal - 2} PA (expédition)`);
      } else {
        // Check catastrophic return conditions (when character cannot afford 2 PA)
        const shouldCatastrophicReturn =
          character.hungerLevel <= 1 || // Affamé/Agonie (hunger level 0-1)
          character.isDead || // Mort
          character.hp <= 1 || // Agonie/Mort (HP = 0-1)
          character.pm <= 1; // Dépression (PM=0) ou déprime (PM=1)

        if (shouldCatastrophicReturn) {
          // Determine reason for catastrophic return
          let reason = "";
          if (character.hungerLevel <= 1) reason = "affamé/agonie";
          else if (character.isDead || character.hp <= 1) reason = "mort/agonie";
          else if (character.pm <= 1) reason = "dépression/déprime";

          await container.expeditionService.removeMemberCatastrophic(expedition.id, character.id, reason);

          catastrophicReturns++;
          console.log(`  - ${character.name}: Retrait catastrophique (${reason})`);
        } else {
          // Cannot afford expedition but doesn't meet catastrophic conditions
          console.warn(`  - ${character.name}: PA insuffisant (${character.paTotal}) mais pas de conditions catastrophiques`);
        }
      }
    }

    console.log(`Déduction PA expéditions terminée.`);
    console.log(`  - ${deductedCount} membres ont payé 2 PA`);
    console.log(`  - ${catastrophicReturns} retraits catastrophiques`);
  } catch (error) {
    console.error("Erreur lors de la déduction des PA expéditions:", error);
  }
}

if (require.main === module) {
  console.log("Exécution manuelle de la mise à jour des PA...");
  updateAllCharactersActionPoints()
    .then(() => {
      console.log("Mise à jour manuelle terminée");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erreur lors de la mise à jour manuelle:", error);
      process.exit(1);
    });
}

import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";

const prisma = new PrismaClient();

export function setupDailyPaJob() {
  // Main PA regeneration job at 00:00:00
  const mainJob = new CronJob("0 0 * * *", updateAllCharactersActionPoints, null, true, "Europe/Paris");

  // Expedition PA deduction job at 00:00:10
  const expeditionJob = new CronJob("10 0 * * *", deductExpeditionPA, null, true, "Europe/Paris");

  console.log("Jobs CRON pour la mise à jour quotidienne des PA configurés");
  console.log("  - Job principal: 00:00:00 (régénération PA)");
  console.log("  - Job expéditions: 00:00:10 (déduction PA expéditions)");

  return { mainJob, expeditionJob };
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
    let healedCount = 0;
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

      // STEP 1: Heal HP if hungerLevel = 4 (Satiété)
      if (character.hungerLevel === 4 && character.hp < 5) {
        updateData.hp = Math.min(5, character.hp + 1);
        healedCount++;
      }

      // STEP 2: Check for death (HP = 0)
      if (character.hp === 0) {
        updateData.isDead = true;
        deathCount++;
      }

      // STEP 2.5: Check agony duration (2 days = death)
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

      // STEP 2.6: Reset agonySince if character has recovered from agony
      if (character.hp > 1 && character.agonySince) {
        updateData.agonySince = null;
      }

      // STEP 2.7: Reset PA counter daily (pour déprime)
      updateData.paUsedToday = 0;
      updateData.lastPaReset = now;

      // STEP 3: Update PA (only if alive and time has passed)
      const lastUpdate = character.lastPaUpdate;
      const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastUpdate > 0 && character.paTotal < 4 && !updateData.isDead) {
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
        }
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
    console.log(`  - ${healedCount} personnages soignés (Satiété)`);
    console.log(`  - ${deathCount} personnages décédés (HP=0)`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour quotidienne des PA:", error);
  }
}

async function deductExpeditionPA() {
  try {
    console.log("Début de la déduction des PA pour les expéditions...");

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
        console.log(`Expédition ${expedition.name} en attente de retour d'urgence - pas de déduction PA pour ${character.name}`);
        continue;
      }

      // Give +2 PA first (normal daily regeneration)
      const newPaTotal = character.paTotal + 2;

      // Check if character can afford the expedition cost (needs PA >= 2 after regeneration)
      const canAffordExpedition = newPaTotal >= 2;

      if (canAffordExpedition) {
        // Deduct 2 PA for expedition
        await prisma.character.update({
          where: { id: character.id },
          data: { paTotal: newPaTotal - 2 }
        });
        deductedCount++;
        console.log(`${character.name} : +2 PA → ${newPaTotal - 2} PA (expédition)`);
      } else {
        // Check catastrophic return conditions
        const shouldCatastrophicReturn =
          character.hungerLevel <= 1 || // Agonie
          character.isDead || // Mort
          character.hp === 0 || // HP = 0
          character.pm <= 2; // Dépression/déprime

        if (shouldCatastrophicReturn) {
          // Determine reason for catastrophic return
          let reason = "";
          if (character.hungerLevel <= 1) reason = "agonie";
          else if (character.isDead || character.hp === 0) reason = "mort";
          else if (character.pm <= 2) reason = "dépression";

          // Remove member catastrophically
          const expeditionService = (await import("../services/expedition.service")).ExpeditionService;
          const service = new expeditionService();

          await service.removeMemberCatastrophic(expedition.id, character.id, reason);

          catastrophicReturns++;
          console.log(`${character.name} : Retrait catastrophique (${reason})`);
        } else {
          // Cannot afford expedition but doesn't meet catastrophic conditions
          // This shouldn't happen in normal gameplay, but handle gracefully
          console.warn(`${character.name} : Impossible de payer l'expédition mais ne remplit pas les conditions de retrait catastrophique`);
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

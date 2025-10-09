import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";

const prisma = new PrismaClient();

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
      const updateData: any = {};

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

export function setupDailyPaJob() {
  const job = new CronJob("0 0 * * *", updateAllCharactersActionPoints, null, true, "Europe/Paris");
  console.log("Job CRON pour la mise à jour quotidienne des PA configuré");
  return job;
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

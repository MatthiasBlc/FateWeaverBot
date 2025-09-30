import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";

const prisma = new PrismaClient();

async function updateAllCharactersActionPoints() {
  try {
    console.log("Début de la mise à jour quotidienne des points d'action...");

    const characters = await prisma.character.findMany({
      where: { paTotal: { lt: 4 }, isDead: false },
    });

    console.log(`${characters.length} personnages à mettre à jour`);
    let updatedCount = 0;

    for (const character of characters) {
      const now = new Date();
      const lastUpdate = character.lastPaUpdate;
      const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastUpdate > 0) {
        let pointsToAdd = 2;
        if (character.hungerLevel === 2) {
          pointsToAdd = 1;
        } else if (character.hungerLevel <= 1) {
          pointsToAdd = 0;
        }

        const maxPointsToAdd = 4 - character.paTotal;
        pointsToAdd = Math.min(pointsToAdd, maxPointsToAdd);

        if (pointsToAdd > 0) {
          await prisma.character.update({
            where: { id: character.id },
            data: { paTotal: { increment: pointsToAdd }, lastPaUpdate: now },
          });
          updatedCount++;
        }
      }
    }

    console.log(`Mise à jour terminée. ${updatedCount} personnages mis à jour.`);
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

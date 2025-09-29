import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";

const prisma = new PrismaClient();

/**
 * Met à jour les points d'action pour tous les personnages
 * S'exécute tous les jours à minuit
 */
async function updateAllCharactersActionPoints() {
  try {
    console.log("Début de la mise à jour quotidienne des points d'action...");

    // Récupère tous les personnages avec moins de 4 PA
    const characters = await prisma.character.findMany({
      where: {
        paTotal: { lt: 4 }, // Seulement ceux qui ont moins de 4 PA
      },
      select: {
        id: true,
        paTotal: true,
        hungerLevel: true, // Ajout du niveau de faim
        lastPaUpdate: true,
      },
    });

    console.log(`${characters.length} personnages à mettre à jour`);
    let updatedCount = 0;

    for (const character of characters) {
      const now = new Date();
      const lastUpdate = character.lastPaUpdate;
      const daysSinceLastUpdate = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastUpdate > 0) {
        // Calcul des points à ajouter selon l'état de faim
        let pointsToAdd = 2; // Par défaut, 2 PA

        // Conséquences de la faim sur la régénération de PA
        if (character.hungerLevel === 2) {
          // Affamé : ne récupère que 1 PA au lieu de 2
          pointsToAdd = 1;
        } else if (character.hungerLevel >= 3) {
          // Agonie ou mort : ne régénère pas de PA
          pointsToAdd = 0;
        }

        // Calcul des points à ajouter (maximum selon l'espace disponible pour atteindre 4 PA)
        const maxPointsToAdd = 4 - character.paTotal;
        pointsToAdd = Math.min(pointsToAdd, maxPointsToAdd);

        if (pointsToAdd > 0) {
          await prisma.character.update({
            where: { id: character.id },
            data: {
              paTotal: { increment: pointsToAdd },
              lastPaUpdate: now,
              updatedAt: now,
            },
          });
          updatedCount++;
        }
      }
    }

    console.log(
      `Mise à jour terminée. ${updatedCount} personnages mis à jour.`
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour quotidienne des PA:", error);
  }
}

// Création du job CRON
export function setupDailyPaJob() {
  // Exécution tous les jours à minuit (heure de Paris)
  const job = new CronJob(
    "0 0 * * *", // Tous les jours à minuit
    updateAllCharactersActionPoints,
    null,
    true, // Démarrer le job immédiatement
    "Europe/Paris"
  );

  console.log("Job CRON pour la mise à jour quotidienne des PA configuré");
  return job;
}

// Pour le développement: exécution immédiate si ce fichier est exécuté directement
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

import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";

const prisma = new PrismaClient();

/**
 * Augmente automatiquement le niveau de faim de tous les personnages
 * S'exécute tous les 2 jours à minuit
 */
async function increaseAllCharactersHunger() {
  try {
    console.log("Début de l'augmentation automatique de la faim...");

    // Récupère tous les personnages qui ne sont pas morts (hungerLevel > 0 ET isDead = false)
    const characters = await prisma.character.findMany({
      where: {
        hungerLevel: { gt: 0 }, // Seulement ceux qui ne sont pas morts
        isDead: false, // Exclure explicitement les personnages morts
      },
      select: {
        id: true,
        name: true,
        hungerLevel: true,
        user: {
          select: {
            username: true,
          },
        },
        town: {
          include: {
            guild: {
              select: {
                name: true,
                discordGuildId: true,
              },
            },
          },
        },
      },
    });

    console.log(
      `${characters.length} personnages éligibles à l'augmentation de faim`
    );

    let updatedCount = 0;
    const deaths = [];

    for (const character of characters) {
      const oldLevel = character.hungerLevel;
      const newLevel = Math.max(0, oldLevel - 1); // Ne pas descendre en dessous de 0 (mort)

      // Mettre à jour le niveau de faim
      await prisma.character.update({
        where: { id: character.id },
        data: {
          hungerLevel: newLevel,
          updatedAt: new Date(),
        },
      });

      updatedCount++;

      // Si le personnage meurt, le marquer comme mort et l'ajouter à la liste
      if (oldLevel > 0 && newLevel === 0) {
        // Marquer le personnage comme mort
        await prisma.character.update({
          where: { id: character.id },
          data: {
            isDead: true,
            isActive: true,
            updatedAt: new Date(),
          },
        });

        deaths.push({
          name: character.name || character.user.username,
          guild: character.town.guild.name,
        });
      }
    }

    console.log(
      `Augmentation de la faim terminée. ${updatedCount} personnages mis à jour.`
    );

    // Log des décès si il y en a eu
    if (deaths.length > 0) {
      console.log(`💀 ${deaths.length} personnages sont morts de faim:`);
      deaths.forEach((death) => {
        console.log(`  - ${death.name} (${death.guild})`);
      });
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'augmentation automatique de la faim:",
      error
    );
  }
}

// Création du job CRON
export function setupHungerIncreaseJob() {
  // Exécution tous les 2 jours à minuit (heure de Paris)
  // Expression CRON : "0 0 */2 * *" = minuit tous les 2 jours
  const job = new CronJob(
    "0 0 */2 * *", // Tous les 2 jours à minuit
    increaseAllCharactersHunger,
    null,
    true, // Démarrer le job immédiatement
    "Europe/Paris"
  );

  console.log(
    "Job CRON pour l'augmentation automatique de la faim configuré (tous les 2 jours)"
  );
  return job;
}

// Pour le développement: exécution immédiate si ce fichier est exécuté directement
if (require.main === module) {
  console.log("Exécution manuelle de l'augmentation de la faim...");
  increaseAllCharactersHunger()
    .then(() => {
      console.log("Augmentation manuelle terminée");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erreur lors de l'augmentation manuelle:", error);
      process.exit(1);
    });
}

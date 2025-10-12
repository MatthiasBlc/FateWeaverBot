import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";

const prisma = new PrismaClient();

async function increaseAllCharactersHunger() {
  try {
    console.log("Début de l'augmentation automatique de la faim...");

    const characters = await prisma.character.findMany({
      where: { isDead: false },
      include: {
        user: true,
        town: { include: { guild: true } },
      },
    });

    console.log(
      `${characters.length} personnages éligibles à l'augmentation de faim`
    );

    let updatedCount = 0;
    const deaths = [];

    for (const character of characters) {
      const newLevel = Math.max(0, character.hungerLevel - 1);

      const updateData: any = { hungerLevel: newLevel };

      // When hunger reaches 0, set HP to 1 (Agonie) and mark agonySince if not already set
      if (newLevel === 0) {
        updateData.hp = 1;
        // Mark agony start date if not already in agony
        if (character.hp !== 1 || !character.agonySince) {
          updateData.agonySince = new Date();
        }
      }

      await prisma.character.update({
        where: { id: character.id },
        data: updateData,
      });

      updatedCount++;

      if (newLevel === 0) {
        deaths.push({
          name: character.name || character.user.username,
          guild: character.town.guild.name,
        });
      }
    }

    console.log(
      `Augmentation de la faim terminée. ${updatedCount} personnages mis à jour.`
    );

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

export function setupHungerIncreaseJob() {
  // Décrément quotidien à minuit (comme les PA)
  const job = new CronJob(
    "0 0 0 * * *",
    increaseAllCharactersHunger,
    null,
    true,
    "Europe/Paris"
  );
  console.log("Job CRON pour l'augmentation de la faim configuré (quotidien à minuit)");
  return job;
}

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

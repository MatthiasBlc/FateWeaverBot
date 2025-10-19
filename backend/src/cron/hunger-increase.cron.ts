import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { CharacterQueries } from "../infrastructure/database/query-builders/character.queries";

const prisma = new PrismaClient();

async function increaseAllCharactersHunger() {
  try {
    console.log("Début de l'augmentation automatique de la faim...");

    const characters = await prisma.character.findMany({
      where: { isDead: false },
      ...CharacterQueries.baseInclude(),
    });

    console.log(
      `${characters.length} personnages éligibles à l'augmentation de faim`
    );

    let updatedCount = 0;
    let healedCount = 0;
    const deaths = [];

    for (const character of characters) {
      const updateData: any = {};

      // STEP 1: Heal HP if hungerLevel = 4 (Satiété) BEFORE decreasing hunger
      if (character.hungerLevel === 4 && character.hp < 5) {
        updateData.hp = Math.min(5, character.hp + 1);
        healedCount++;
      }

      // STEP 2: Decrease hunger level
      const newLevel = Math.max(0, character.hungerLevel - 1);
      updateData.hungerLevel = newLevel;

      // STEP 3: When hunger reaches 0, set HP to 1 (Agonie) and mark agonySince if not already set
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
    console.log(`  - ${healedCount} personnages soignés (Satiété avant hunger decrease)`);

    if (deaths.length > 0) {
      console.log(`💀 ${deaths.length} personnages en agonie (hunger=0):`);
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

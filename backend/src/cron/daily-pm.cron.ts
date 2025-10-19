import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { logger } from "../services/logger";
import { CharacterQueries } from "../infrastructure/database/query-builders/character.queries";

const prisma = new PrismaClient();

/**
 * Daily PM (Mental Health) contagion system
 *
 * Characters with PM=0 (Dépression) spread their depression to others in the same location:
 * - Same CITY if in town
 * - Same DEPARTED expedition if on expedition
 *
 * Each depressed character affects ONE random character in their location per day.
 */
async function updateMentalHealthContagion() {
  try {
    console.log("Début de la contagion de dépression...");

    // Find all characters with PM = 0 (Dépression) who are alive
    const depressedCharacters = await prisma.character.findMany({
      where: {
        pm: 0,
        isDead: false,
      },
      ...CharacterQueries.withExpeditions(),
    });

    console.log(`${depressedCharacters.length} personnages en dépression trouvés`);

    let affectedCount = 0;

    for (const depressedChar of depressedCharacters) {
      // Determine the depressed character's location
      const departedExpedition = depressedChar.expeditionMembers.find(
        (em) => em.expedition.status === "DEPARTED"
      );

      let potentialVictims: any[] = [];

      if (departedExpedition) {
        // Character is in a DEPARTED expedition
        // Find all OTHER characters in the same expedition who are NOT already depressed
        const expeditionMembers = await prisma.expeditionMember.findMany({
          where: {
            expeditionId: departedExpedition.expeditionId,
          },
          include: {
            character: true,
          },
        });

        potentialVictims = expeditionMembers
          .map((em) => em.character)
          .filter(
            (char) =>
              char.id !== depressedChar.id && // Not the depressed character themselves
              char.pm > 0 && // Not already depressed
              !char.isDead // Not dead
          );
      } else {
        // Character is in town
        // Find all OTHER characters in the same town who are NOT already depressed
        // AND are not in a DEPARTED expedition (they must be in the city)
        const townCharacters = await prisma.character.findMany({
          where: {
            townId: depressedChar.townId,
            isDead: false,
          },
          ...CharacterQueries.withExpeditions(),
        });

        potentialVictims = townCharacters.filter((char) => {
          // Skip the depressed character themselves
          if (char.id === depressedChar.id) return false;

          // Skip if already depressed
          if (char.pm === 0) return false;

          // Skip if in a DEPARTED expedition (not in city)
          const inDepartedExpedition = char.expeditionMembers.some(
            (em) => em.expedition.status === "DEPARTED"
          );
          if (inDepartedExpedition) return false;

          return true;
        });
      }

      // If there are potential victims, select one at random
      if (potentialVictims.length > 0) {
        const randomIndex = Math.floor(Math.random() * potentialVictims.length);
        const victim = potentialVictims[randomIndex];

        // Decrease the victim's PM by 1
        const updatedVictim = await prisma.character.update({
          where: { id: victim.id },
          data: {
            pm: { decrement: 1 },
          },
        });

        affectedCount++;

        console.log(
          `  - ${victim.name} (${victim.id}) a perdu 1 PM à cause de ${depressedChar.name} (${depressedChar.id})`
        );

        // Log PM contagion event for Discord notifications
        const locationText = departedExpedition
          ? `dans l'expédition "${departedExpedition.expedition.name}"`
          : `en ville`;

        const newPmStatus = updatedVictim.pm === 0
          ? "🌧️ est maintenant en **Dépression**"
          : updatedVictim.pm === 1
            ? "😔 est maintenant en **Déprime**"
            : `a maintenant ${updatedVictim.pm} PM`;

        // Get guild Discord ID from town for logging
        const guild = await prisma.guild.findFirst({
          where: {
            town: {
              id: depressedChar.townId,
            },
          },
          select: {
            discordGuildId: true,
          },
        });

        // Log structured event that can be picked up by Discord log system
        logger.info("pm_contagion", {
          guildId: guild?.discordGuildId,
          location: locationText,
          victimName: victim.name,
          victimId: victim.id,
          depressedName: depressedChar.name,
          depressedId: depressedChar.id,
          newPm: updatedVictim.pm,
          message: `🌧️ La dépression se propage ${locationText} : **${victim.name}** a perdu 1 PM à cause de **${depressedChar.name}** et ${newPmStatus}.`,
        });
      } else {
        console.log(
          `  - Aucune victime disponible pour ${depressedChar.name} (${depressedChar.id})`
        );
      }
    }

    console.log(
      `Contagion de dépression terminée. ${affectedCount} personnages affectés.`
    );
  } catch (error) {
    console.error("Erreur lors de la contagion de dépression:", error);
  }
}

export function setupDailyPmJob() {
  // Run daily at midnight (after hunger decrease and before PA update)
  const job = new CronJob(
    "0 0 * * *",
    updateMentalHealthContagion,
    null,
    true,
    "Europe/Paris"
  );
  console.log(
    "Job CRON pour la contagion de dépression configuré (quotidien à minuit)"
  );
  return job;
}

// Allow manual execution for testing
if (require.main === module) {
  console.log("Exécution manuelle de la contagion de dépression...");
  updateMentalHealthContagion()
    .then(() => {
      console.log("Contagion manuelle terminée");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erreur lors de la contagion manuelle:", error);
      process.exit(1);
    });
}

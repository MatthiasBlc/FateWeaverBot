/**
 * Script de debug pour comprendre pourquoi les PA ne se régénèrent pas
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║              DEBUG RÉGÉNÉRATION PA                                ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  const characters = await prisma.character.findMany({
    where: { isDead: false },
    select: {
      id: true,
      name: true,
      paTotal: true,
      lastPaUpdate: true,
      hungerLevel: true,
      isDead: true,
    },
  });

  console.log(`${characters.length} personnages trouvés\n`);

  const now = new Date();
  console.log(`Date actuelle: ${now.toISOString()}\n`);

  for (const character of characters) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Personnage: ${character.name}`);
    console.log(`  - PA Total: ${character.paTotal}`);
    console.log(`  - Hunger Level: ${character.hungerLevel}`);
    console.log(`  - Last PA Update: ${character.lastPaUpdate.toISOString()}`);

    // Calculate days since last update (using Europe/Paris timezone)
    const lastUpdate = character.lastPaUpdate;

    const toParisDate = (date: Date) => {
      // Get date components in Paris timezone
      const parisDateStr = date.toLocaleDateString('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [day, month, year] = parisDateStr.split('/');
      // Create date at midnight UTC (not Paris time)
      // This represents "day X at 00:00 in the Date's natural timezone"
      return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
    };

    const lastUpdateDate = toParisDate(lastUpdate);
    const currentDate = toParisDate(now);
    const daysSinceLastUpdate = Math.floor(
      (currentDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`  - Days Since Last Update: ${daysSinceLastUpdate}`);
    console.log(`  - Last Update Date (normalized): ${lastUpdateDate.toISOString()}`);
    console.log(`  - Current Date (normalized): ${currentDate.toISOString()}`);

    // Check conditions
    console.log(`\n  Vérification des conditions:`);
    console.log(`    ✓ daysSinceLastUpdate >= 1: ${daysSinceLastUpdate >= 1} (${daysSinceLastUpdate} >= 1)`);
    console.log(`    ✓ paTotal < 4: ${character.paTotal < 4} (${character.paTotal} < 4)`);
    console.log(`    ✓ !isDead: ${!character.isDead}`);

    const shouldRegenerate = daysSinceLastUpdate >= 1 && character.paTotal < 4 && !character.isDead;

    if (shouldRegenerate) {
      let pointsToAdd = 2;
      if (character.hungerLevel <= 1) {
        pointsToAdd = 1;
      }
      const maxPointsToAdd = 4 - character.paTotal;
      pointsToAdd = Math.min(pointsToAdd, maxPointsToAdd);

      console.log(`\n  ✅ DEVRAIT RÉGÉNÉRER: +${pointsToAdd} PA`);
      console.log(`     (hunger penalty: ${character.hungerLevel <= 1 ? "OUI (affamé, +1 seulement)" : "NON (+2)"})`);
    } else {
      console.log(`\n  ❌ NE DEVRAIT PAS RÉGÉNÉRER`);
      if (daysSinceLastUpdate < 1) {
        console.log(`     Raison: Pas assez de jours écoulés (${daysSinceLastUpdate} < 1)`);
      }
      if (character.paTotal >= 4) {
        console.log(`     Raison: Déjà au maximum (${character.paTotal} >= 4)`);
      }
      if (character.isDead) {
        console.log(`     Raison: Personnage mort`);
      }
    }
    console.log();
  }

  process.exit(0);
}

main();

/**
 * Script pour déboguer l'affichage du bouton de direction
 * Vérifie les champs returnAt et currentDayDirection des expéditions DEPARTED
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║         DEBUG BOUTON DIRECTION (DEPARTED)                         ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  const now = new Date();
  console.log(`Date actuelle: ${now.toISOString()}\n`);

  const expeditions = await prisma.expedition.findMany({
    where: { status: "DEPARTED" },
    select: {
      id: true,
      name: true,
      status: true,
      returnAt: true,
      currentDayDirection: true,
      directionSetBy: true,
      directionSetAt: true,
      path: true,
      duration: true,
    },
  });

  if (expeditions.length === 0) {
    console.log("❌ Aucune expédition DEPARTED trouvée");
    process.exit(0);
  }

  console.log(`${expeditions.length} expédition(s) DEPARTED trouvée(s):\n`);

  for (const exp of expeditions) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Expédition: ${exp.name}`);
    console.log(`  ID: ${exp.id}`);
    console.log(`  Status: ${exp.status}`);
    console.log(`  Durée: ${exp.duration} jours`);
    console.log(`  returnAt: ${exp.returnAt ? exp.returnAt.toISOString() : "❌ NULL"}`);

    if (exp.returnAt) {
      const hoursUntilReturn = (exp.returnAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      console.log(`  ⏱️  Heures avant retour: ${hoursUntilReturn.toFixed(2)}h`);

      const isLastDay = hoursUntilReturn < 24;
      console.log(`  📅 Dernier jour: ${isLastDay ? "OUI (< 24h)" : "NON (>= 24h)"}`);
    }

    console.log(`  currentDayDirection: ${exp.currentDayDirection || "❌ NULL/Non définie"}`);
    console.log(`  directionSetBy: ${exp.directionSetBy || "NULL"}`);
    console.log(`  directionSetAt: ${exp.directionSetAt ? exp.directionSetAt.toISOString() : "NULL"}`);
    console.log(`  path: [${exp.path.join(", ")}] (${exp.path.length} étapes)`);

    console.log(`\n  🎯 Affichage du bouton:`);
    const hasDirection = !!exp.currentDayDirection;
    const isLastDay = exp.returnAt ? (exp.returnAt.getTime() - now.getTime()) / (1000 * 60 * 60) < 24 : false;

    if (!exp.returnAt) {
      console.log(`     ❌ returnAt NULL → Impossible de calculer isLastDay`);
    } else if (hasDirection) {
      console.log(`     ❌ Direction déjà définie → Bouton masqué`);
    } else if (isLastDay) {
      console.log(`     ❌ Dernier jour (< 24h) → Bouton masqué`);
    } else {
      console.log(`     ✅ BOUTON DEVRAIT ÊTRE AFFICHÉ`);
    }

    console.log();
  }

  process.exit(0);
}

main();

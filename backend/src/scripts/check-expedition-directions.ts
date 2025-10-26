/**
 * Script pour vérifier que les directions initiales sont bien enregistrées
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║         VÉRIFICATION DES DIRECTIONS INITIALES                     ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  const expeditions = await prisma.expedition.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      initialDirection: true,
      status: true,
      createdAt: true,
    },
  });

  console.log(`${expeditions.length} dernières expéditions trouvées:\n`);

  for (const expedition of expeditions) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Nom: ${expedition.name}`);
    console.log(`  Status: ${expedition.status}`);
    console.log(`  Direction initiale: ${expedition.initialDirection || "❌ NULL/VIDE"}`);
    console.log(`  Créée le: ${expedition.createdAt.toISOString()}`);
    console.log();
  }

  process.exit(0);
}

main();

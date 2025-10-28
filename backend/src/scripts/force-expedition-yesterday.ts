/**
 * Script utilitaire pour modifier la date de création d'une expédition
 * Utile pour tester le système de lock sans attendre 24h
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const expeditionId = process.argv[2];

  if (!expeditionId) {
    console.error("❌ Usage: ts-node force-expedition-yesterday.ts <expedition-id>");
    process.exit(1);
  }

  try {
    // Get current expedition
    const expedition = await prisma.expedition.findUnique({
      where: { id: expeditionId },
      select: { id: true, name: true, status: true, createdAt: true }
    });

    if (!expedition) {
      console.error(`❌ Expédition ${expeditionId} introuvable`);
      process.exit(1);
    }

    console.log("\n📋 Expédition actuelle:");
    console.log(`   ID: ${expedition.id}`);
    console.log(`   Nom: ${expedition.name}`);
    console.log(`   Status: ${expedition.status}`);
    console.log(`   CreatedAt: ${expedition.createdAt.toISOString()}`);

    if (expedition.status !== "PLANNING") {
      console.warn(`⚠️  L'expédition n'est pas en PLANNING (status: ${expedition.status})`);
      console.log("   Voulez-vous continuer quand même ? (pas d'impact si déjà LOCKED/DEPARTED)");
    }

    // Set createdAt to yesterday at noon
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    await prisma.expedition.update({
      where: { id: expeditionId },
      data: { createdAt: yesterday }
    });

    console.log("\n✅ Date de création modifiée !");
    console.log(`   Nouvelle createdAt: ${yesterday.toISOString()}`);
    console.log("\n🎯 L'expédition peut maintenant être verrouillée par le prochain minuit (simulate-midnight.ts)");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERREUR:", error);
    process.exit(1);
  }
}

main();

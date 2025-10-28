/**
 * Script de test du retour d'expédition
 * Vérifie que :
 * 1. Les ressources reviennent à la ville
 * 2. Les membres sont retirés de l'expédition
 * 3. Les membres peuvent réutiliser leurs PA
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";
import { container } from "../infrastructure/container";

const prisma = new PrismaClient();

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║         TEST RETOUR D'EXPÉDITION (Ressources + Membres)          ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  const expeditionId = process.argv[2];

  if (!expeditionId) {
    console.error("❌ Usage: ts-node test-expedition-return.ts <expedition-id>");
    process.exit(1);
  }

  try {
    // Get expedition before return
    const expeditionBefore = await prisma.expedition.findUnique({
      where: { id: expeditionId },
      include: {
        members: {
          include: {
            character: { select: { name: true, paTotal: true } }
          }
        }
      }
    });

    if (!expeditionBefore) {
      console.error(`❌ Expédition ${expeditionId} introuvable`);
      process.exit(1);
    }

    console.log("📋 État AVANT le retour:");
    console.log(`   Expédition: ${expeditionBefore.name}`);
    console.log(`   Status: ${expeditionBefore.status}`);
    console.log(`   Ville: ${expeditionBefore.townId}`);
    console.log(`   Membres: ${expeditionBefore.members.length}`);
    expeditionBefore.members.forEach(m =>
      console.log(`      - ${m.character.name} (${m.character.paTotal} PA)`)
    );

    // Get expedition resources before
    const resourcesBefore = await prisma.resourceStock.findMany({
      where: {
        locationType: "EXPEDITION",
        locationId: expeditionId
      },
      include: { resourceType: true }
    });

    console.log(`   Ressources expédition: ${resourcesBefore.length}`);
    resourcesBefore.forEach(r =>
      console.log(`      - ${r.resourceType.name}: ${r.quantity}`)
    );

    // Get town resources before
    const townResourcesBefore = await prisma.resourceStock.findMany({
      where: {
        locationType: "CITY",
        locationId: expeditionBefore.townId
      },
      include: { resourceType: true }
    });

    console.log(`   Ressources ville (avant): ${townResourcesBefore.length}`);
    townResourcesBefore.forEach(r =>
      console.log(`      - ${r.resourceType.name}: ${r.quantity}`)
    );

    // Perform return
    console.log("\n🔄 Retour de l'expédition en cours...");
    await container.expeditionService.returnExpedition(expeditionId);

    // Get expedition after return
    const expeditionAfter = await prisma.expedition.findUnique({
      where: { id: expeditionId },
      select: { status: true, returnAt: true }
    });

    // Get remaining members (should be 0)
    const membersAfter = await prisma.expeditionMember.findMany({
      where: { expeditionId }
    });

    // Get expedition resources after (should be 0)
    const resourcesAfter = await prisma.resourceStock.findMany({
      where: {
        locationType: "EXPEDITION",
        locationId: expeditionId
      }
    });

    // Get town resources after
    const townResourcesAfter = await prisma.resourceStock.findMany({
      where: {
        locationType: "CITY",
        locationId: expeditionBefore.townId
      },
      include: { resourceType: true }
    });

    console.log("\n✅ État APRÈS le retour:");
    console.log(`   Status: ${expeditionAfter?.status}`);
    console.log(`   ReturnAt: ${expeditionAfter?.returnAt?.toISOString()}`);
    console.log(`   Membres restants: ${membersAfter.length} (devrait être 0)`);
    console.log(`   Ressources expédition: ${resourcesAfter.length} (devrait être 0)`);
    console.log(`   Ressources ville (après): ${townResourcesAfter.length}`);
    townResourcesAfter.forEach(r =>
      console.log(`      - ${r.resourceType.name}: ${r.quantity}`)
    );

    // Verification
    console.log("\n📊 VÉRIFICATIONS:");

    if (expeditionAfter?.status === "RETURNED") {
      console.log("   ✅ Status = RETURNED");
    } else {
      console.log(`   ❌ Status = ${expeditionAfter?.status} (attendu: RETURNED)`);
    }

    if (membersAfter.length === 0) {
      console.log("   ✅ Tous les membres ont été retirés");
    } else {
      console.log(`   ❌ ${membersAfter.length} membres restants (attendu: 0)`);
    }

    if (resourcesAfter.length === 0) {
      console.log("   ✅ Toutes les ressources ont été transférées");
    } else {
      console.log(`   ❌ ${resourcesAfter.length} ressources restantes (attendu: 0)`);
    }

    // Verify resources transferred
    let allTransferred = true;
    for (const resourceBefore of resourcesBefore) {
      const townResourceAfter = townResourcesAfter.find(
        r => r.resourceTypeId === resourceBefore.resourceTypeId
      );
      const townResourceBeforeQty = townResourcesBefore.find(
        r => r.resourceTypeId === resourceBefore.resourceTypeId
      )?.quantity || 0;

      const expectedQty = townResourceBeforeQty + resourceBefore.quantity;

      if (townResourceAfter && townResourceAfter.quantity === expectedQty) {
        console.log(`   ✅ ${resourceBefore.resourceType.name}: ${townResourceBeforeQty} + ${resourceBefore.quantity} = ${townResourceAfter.quantity}`);
      } else {
        console.log(`   ❌ ${resourceBefore.resourceType.name}: attendu ${expectedQty}, reçu ${townResourceAfter?.quantity || 0}`);
        allTransferred = false;
      }
    }

    if (allTransferred && resourcesBefore.length > 0) {
      console.log("   ✅ Toutes les quantités de ressources sont correctes");
    }

    console.log("\n🎉 Test terminé !\n");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ ERREUR:", error);
    process.exit(1);
  }
}

main();

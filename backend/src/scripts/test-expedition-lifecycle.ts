/**
 * Script de test end-to-end du cycle de vie complet d'une expédition
 * Teste : PLANNING → LOCKED → DEPARTED → RETURNED
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";
import { container } from "../infrastructure/container";

const prisma = new PrismaClient();

function printSeparator() {
  console.log("\n" + "=".repeat(70));
}

function printStep(step: string) {
  printSeparator();
  console.log(`🎯 ${step}`);
  printSeparator();
}

async function main() {
  try {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════════════╗");
    console.log("║      TEST CYCLE DE VIE COMPLET D'UNE EXPÉDITION                  ║");
    console.log("╚════════════════════════════════════════════════════════════════════╝");

    // ====================================================================
    // PRÉPARATION : Récupérer une ville et des personnages
    // ====================================================================
    printStep("PRÉPARATION : Récupération d'une ville de test");

    const town = await prisma.town.findFirst({
      select: { id: true, name: true }
    });

    if (!town) {
      console.error("❌ Aucune ville trouvée dans la base de données");
      process.exit(1);
    }

    console.log(`✅ Ville trouvée: ${town.name} (${town.id})`);

    const characters = await prisma.character.findMany({
      where: {
        townId: town.id,
        isDead: false,
        isActive: true
      },
      select: { id: true, name: true, paTotal: true },
      take: 2
    });

    if (characters.length === 0) {
      console.error("❌ Aucun personnage actif trouvé dans cette ville");
      process.exit(1);
    }

    console.log(`✅ ${characters.length} personnages trouvés:`);
    characters.forEach(c => console.log(`   - ${c.name} (${c.paTotal} PA)`));

    // ====================================================================
    // ÉTAPE 1 : Créer une expédition en PLANNING
    // ====================================================================
    printStep("ÉTAPE 1 : Création d'une expédition en PLANNING");

    const expedition = await prisma.expedition.create({
      data: {
        name: `Test Expedition ${Date.now()}`,
        townId: town.id,
        status: "PLANNING",
        duration: 2,
        initialDirection: "NORD",
        path: [],
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // Créée il y a 25h (hier)
        createdBy: characters[0].id // Use first character as creator
      }
    });

    console.log(`✅ Expédition créée: ${expedition.name}`);
    console.log(`   ID: ${expedition.id}`);
    console.log(`   Status: ${expedition.status}`);
    console.log(`   CreatedAt: ${expedition.createdAt.toISOString()} (il y a 25h)`);

    // Ajouter les membres
    for (const character of characters) {
      await prisma.expeditionMember.create({
        data: {
          expeditionId: expedition.id,
          characterId: character.id
        }
      });
      console.log(`   ✅ Membre ajouté: ${character.name}`);
    }

    // ====================================================================
    // ÉTAPE 2 : LOCK (minuit)
    // ====================================================================
    printStep("ÉTAPE 2 : LOCK de l'expédition (simule minuit)");

    await container.expeditionService.lockExpedition(expedition.id);

    const lockedExpedition = await prisma.expedition.findUnique({
      where: { id: expedition.id },
      select: { status: true, updatedAt: true }
    });

    console.log(`✅ Expédition verrouillée`);
    console.log(`   Status: ${lockedExpedition?.status}`);
    console.log(`   UpdatedAt: ${lockedExpedition?.updatedAt?.toISOString()}`);

    if (lockedExpedition?.status !== "LOCKED") {
      throw new Error(`❌ ERREUR: Status attendu LOCKED, reçu ${lockedExpedition?.status}`);
    }

    // ====================================================================
    // ÉTAPE 3 : DEPART (matin 08h)
    // ====================================================================
    printStep("ÉTAPE 3 : DEPART de l'expédition (simule 08h)");

    await container.expeditionService.departExpedition(expedition.id);

    // Initialize path with initial direction
    await prisma.expedition.update({
      where: { id: expedition.id },
      data: { path: [expedition.initialDirection || "UNKNOWN"] }
    });

    const departedExpedition = await prisma.expedition.findUnique({
      where: { id: expedition.id },
      select: { status: true, updatedAt: true, returnAt: true, path: true }
    });

    console.log(`✅ Expédition partie`);
    console.log(`   Status: ${departedExpedition?.status}`);
    console.log(`   UpdatedAt: ${departedExpedition?.updatedAt?.toISOString()}`);
    console.log(`   ReturnAt: ${departedExpedition?.returnAt?.toISOString()}`);
    console.log(`   Path: ${JSON.stringify(departedExpedition?.path)}`);

    if (departedExpedition?.status !== "DEPARTED") {
      throw new Error(`❌ ERREUR: Status attendu DEPARTED, reçu ${departedExpedition?.status}`);
    }

    // ====================================================================
    // ÉTAPE 4 : RETURN (après la durée)
    // ====================================================================
    printStep("ÉTAPE 4 : RETURN de l'expédition (après durée)");

    // Forcer returnAt dans le passé pour simuler
    await prisma.expedition.update({
      where: { id: expedition.id },
      data: { returnAt: new Date(Date.now() - 1000) } // Il y a 1 seconde
    });

    await container.expeditionService.returnExpedition(expedition.id);

    const returnedExpedition = await prisma.expedition.findUnique({
      where: { id: expedition.id },
      select: { status: true, returnAt: true, updatedAt: true }
    });

    console.log(`✅ Expédition retournée`);
    console.log(`   Status: ${returnedExpedition?.status}`);
    console.log(`   ReturnAt: ${returnedExpedition?.returnAt?.toISOString()}`);
    console.log(`   UpdatedAt: ${returnedExpedition?.updatedAt?.toISOString()}`);

    if (returnedExpedition?.status !== "RETURNED") {
      throw new Error(`❌ ERREUR: Status attendu RETURNED, reçu ${returnedExpedition?.status}`);
    }

    // ====================================================================
    // RÉSUMÉ FINAL
    // ====================================================================
    printSeparator();
    console.log("✅ ✅ ✅  TOUS LES TESTS SONT PASSÉS  ✅ ✅ ✅");
    printSeparator();
    console.log("\n📊 Cycle complet testé avec succès:");
    console.log("   1. ✅ PLANNING → Création + ajout membres");
    console.log("   2. ✅ LOCKED → Verrouillage à minuit");
    console.log("   3. ✅ DEPARTED → Départ à 08h");
    console.log("   4. ✅ RETURNED → Retour après durée");
    console.log("\n🎉 Le système d'expéditions fonctionne correctement !\n");

    // Nettoyer l'expédition de test
    console.log("🧹 Nettoyage de l'expédition de test...");
    await prisma.expeditionMember.deleteMany({ where: { expeditionId: expedition.id } });
    await prisma.expedition.delete({ where: { id: expedition.id } });
    console.log("✅ Expédition de test supprimée\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ❌ ❌  ÉCHEC DU TEST  ❌ ❌ ❌");
    console.error(error);
    process.exit(1);
  }
}

main();

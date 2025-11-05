/**
 * Script de simulation des tâches CRON de minuit (00:00:00)
 * Exécute dans le bon ordre :
 * 1. Hunger Decrease (affecte agony → affecte lock)
 * 2. PM Contagion (affecte dépression → affecte lock)
 * 3. Expedition Lock (verrouille les expéditions PLANNING)
 * 4. Daily PA Update (régénère PA, déduction expéditions LOCKED + DEPARTED, directions)
 */

// Register tsconfig paths for module resolution
import "tsconfig-paths/register";

import { PrismaClient } from "@prisma/client";
import { container } from "../infrastructure/container";
import { CharacterQueries } from "../infrastructure/database/query-builders";
import { applyAgonyRules } from "../util/agony";
import { notifyAgonyEntered } from "../util/agony-notification";

const prisma = new PrismaClient();

// ====================================================================
// STEP 1: HUNGER DECREASE
// ====================================================================
async function hungerDecrease() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: HUNGER DECREASE");
  console.log("=".repeat(70));

  const characters = await prisma.character.findMany({
    where: { isDead: false },
    include: {
      user: true,
      town: { include: { guild: true } },
      job: true,
    },
  });

  console.log(`${characters.length} personnages éligibles à l'augmentation de faim`);

  let updatedCount = 0;
  let healedCount = 0;
  const deaths = [];

  for (const character of characters) {
    const updateData: any = {};

    // Heal HP if hungerLevel = 4 (Satiété) BEFORE decreasing hunger
    let newHp = character.hp;
    if (character.hungerLevel === 4 && character.hp < 5) {
      newHp = Math.min(5, character.hp + 1);
      updateData.hp = newHp;
      healedCount++;
    }

    // Decrease hunger level
    const newHunger = Math.max(0, character.hungerLevel - 1);
    updateData.hungerLevel = newHunger;

    // Apply agony rules
    const agonyUpdate = applyAgonyRules(
      newHp,
      character.hungerLevel,
      character.agonySince,
      newHp !== character.hp ? newHp : undefined,
      newHunger
    );

    if (agonyUpdate.hp !== undefined) updateData.hp = agonyUpdate.hp;
    if (agonyUpdate.hungerLevel !== undefined) updateData.hungerLevel = agonyUpdate.hungerLevel;
    if (agonyUpdate.agonySince !== undefined) updateData.agonySince = agonyUpdate.agonySince;

    await prisma.character.update({
      where: { id: character.id },
      data: updateData,
    });

    updatedCount++;

    if (agonyUpdate.enteredAgony && character.town.guild.discordGuildId) {
      await notifyAgonyEntered(
        character.town.guild.discordGuildId,
        character.name || character.user.username,
        newHunger === 0 ? "hunger" : "other"
      );
    }

    if (newHunger === 0) {
      deaths.push({
        name: character.name || character.user.username,
        guild: character.town.guild.name,
      });
    }
  }

  console.log(`✅ Augmentation de la faim terminée. ${updatedCount} personnages mis à jour.`);
  console.log(`   - ${healedCount} personnages soignés (Satiété)`);
  if (deaths.length > 0) {
    console.log(`   💀 ${deaths.length} personnages en agonie (hunger=0)`);
  }
}

// ====================================================================
// STEP 2: PM CONTAGION
// ====================================================================
async function pmContagion() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: PM CONTAGION");
  console.log("=".repeat(70));

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
    const departedExpedition = depressedChar.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    let potentialVictims: any[] = [];

    if (departedExpedition) {
      const expeditionMembers = await prisma.expeditionMember.findMany({
        where: { expeditionId: departedExpedition.expeditionId },
        include: { character: true },
      });

      potentialVictims = expeditionMembers
        .map((em) => em.character)
        .filter((char) => char.id !== depressedChar.id && char.pm > 0 && !char.isDead);
    } else {
      const townCharacters = await prisma.character.findMany({
        where: { townId: depressedChar.townId, isDead: false },
        ...CharacterQueries.withExpeditions(),
      });

      potentialVictims = townCharacters.filter((char) => {
        if (char.id === depressedChar.id) return false;
        if (char.pm === 0) return false;
        const inDepartedExpedition = char.expeditionMembers.some(
          (em) => em.expedition.status === "DEPARTED"
        );
        if (inDepartedExpedition) return false;
        return true;
      });
    }

    if (potentialVictims.length > 0) {
      const randomIndex = Math.floor(Math.random() * potentialVictims.length);
      const victim = potentialVictims[randomIndex];

      await prisma.character.update({
        where: { id: victim.id },
        data: { pm: { decrement: 1 } },
      });

      affectedCount++;
      console.log(`   - ${victim.name} a perdu 1 PM à cause de ${depressedChar.name}`);
    }
  }

  console.log(`✅ Contagion de dépression terminée. ${affectedCount} personnages affectés.`);
}

// ====================================================================
// STEP 4: DAILY PA UPDATE
// ====================================================================
async function dailyPaUpdate() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: DAILY PA UPDATE");
  console.log("=".repeat(70));

  await updateAllCharactersActionPoints();
  await appendDailyDirections();
  await deductExpeditionPA();
}

async function updateAllCharactersActionPoints() {
  console.log("\n--- Mise à jour quotidienne des points d'action ---");

  const characters = await prisma.character.findMany({
    where: { isDead: false },
  });

  console.log(`${characters.length} personnages à traiter`);
  let updatedCount = 0;
  let deathCount = 0;

  for (const character of characters) {
    const now = new Date();
    const updateData: any = {};

    // Reset agonySince if recovered
    if (character.hp > 1 && character.agonySince) {
      updateData.agonySince = null;
    }

    // Check for death (HP = 0)
    if (character.hp === 0) {
      updateData.isDead = true;
      deathCount++;
    }

    // Check agony duration (2 days = death)
    if (character.hp === 1 && character.agonySince) {
      const daysSinceAgony = Math.floor(
        (now.getTime() - character.agonySince.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceAgony >= 2) {
        updateData.isDead = true;
        updateData.hp = 0;
        deathCount++;
      }
    }

    // Reset PA counter daily
    updateData.paUsedToday = 0;
    updateData.lastPaReset = now;

    // Update PA (regenerate daily)
    const lastUpdate = character.lastPaUpdate;
    const lastUpdateDate = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysSinceLastUpdate = Math.floor((currentDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastUpdate >= 1 && character.paTotal < 4 && !updateData.isDead) {
      let pointsToAdd = 2;
      if (character.hungerLevel <= 1) {
        pointsToAdd = 1;
      }
      const maxPointsToAdd = 4 - character.paTotal;
      pointsToAdd = Math.min(pointsToAdd, maxPointsToAdd);

      if (pointsToAdd > 0) {
        updateData.paTotal = { increment: pointsToAdd };
        updateData.lastPaUpdate = now;
        console.log(`   [PA REGEN] ${character.name}: +${pointsToAdd} PA`);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.character.update({
        where: { id: character.id },
        data: updateData,
      });
      updatedCount++;
    }
  }

  console.log(`✅ Mise à jour terminée. ${updatedCount} personnages mis à jour.`);
  console.log(`   - ${deathCount} personnages décédés`);
}

async function appendDailyDirections() {
  console.log("\n--- Ajout des directions quotidiennes ---");

  // Get ALL DEPARTED expeditions (with or without direction set)
  const expeditions = await prisma.expedition.findMany({
    where: {
      status: "DEPARTED",
    },
    select: { id: true, name: true, path: true, currentDayDirection: true },
  });

  for (const exp of expeditions) {
    // If direction set → add to path
    // If direction NOT set → add "UNKNOWN" to path
    const directionToAdd = exp.currentDayDirection || "UNKNOWN";
    const newPath = [...exp.path, directionToAdd];

    await prisma.expedition.update({
      where: { id: exp.id },
      data: {
        path: newPath,
        currentDayDirection: null,
        directionSetBy: null,
        directionSetAt: null,
      },
    });

    if (exp.currentDayDirection) {
      console.log(`   - Appended direction ${exp.currentDayDirection} to ${exp.name}`);
    } else {
      console.log(`   - ⚠️  No direction chosen for ${exp.name}, appended UNKNOWN`);
    }
  }

  console.log(`✅ Appended directions for ${expeditions.length} expedition(s)`);
}

async function deductExpeditionPA() {
  console.log("\n--- Déduction PA expéditions ---");

  const expeditionMembers = await prisma.expeditionMember.findMany({
    where: {
      expedition: {
        status: { in: ["LOCKED", "DEPARTED"] }
      }
    },
    include: {
      character: {
        select: {
          id: true,
          name: true,
          paTotal: true,
          hungerLevel: true,
          isDead: true,
          hp: true,
          pm: true
        }
      },
      expedition: {
        select: {
          id: true,
          name: true,
          status: true,
          townId: true,
          pendingEmergencyReturn: true
        }
      }
    }
  });

  console.log(`${expeditionMembers.length} membres d'expédition à traiter`);

  let deductedCount = 0;
  let catastrophicReturns = 0;

  for (const member of expeditionMembers) {
    const { character, expedition } = member;

    if (expedition.pendingEmergencyReturn) {
      console.log(`   - Expédition ${expedition.name} en attente de retour d'urgence - skip`);
      continue;
    }

    const canAffordExpedition = character.paTotal >= 2;

    if (canAffordExpedition) {
      await prisma.character.update({
        where: { id: character.id },
        data: { paTotal: { decrement: 2 } }
      });
      deductedCount++;
      console.log(`   - ${character.name}: -2 PA (expédition)`);
    } else {
      // Cannot afford 2 PA
      const paidAmount = character.paTotal;

      if (expedition.status === 'LOCKED') {
        // For LOCKED expeditions: Pay what they can, stay in expedition
        // This should never happen in normal conditions (PA regeneration ensures ≥2 PA)
        // But we handle it gracefully for edge cases (tests, manual DB changes)
        await prisma.character.update({
          where: { id: character.id },
          data: { paTotal: 0 }
        });
        console.log(`   - ${character.name}: Paiement partiel (${paidAmount}/2 PA) - reste dans l'expédition LOCKED`);
      } else {
        // For DEPARTED expeditions: Catastrophic return
        await prisma.character.update({
          where: { id: character.id },
          data: { paTotal: 0 }
        });
        await container.expeditionService.removeMemberCatastrophic(expedition.id, character.id);
        catastrophicReturns++;
        console.log(`   - ${character.name}: Retrait catastrophique (PA insuffisant: ${paidAmount}/2 PA payés)`);
      }
    }
  }

  console.log(`✅ Déduction PA expéditions terminée.`);
  console.log(`   - ${deductedCount} membres ont payé 2 PA`);
  console.log(`   - ${catastrophicReturns} retraits catastrophiques`);
}

// ====================================================================
// STEP 3: EXPEDITION LOCK
// ====================================================================
async function expeditionLock() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: EXPEDITION LOCK");
  console.log("=".repeat(70));

  const now = new Date();
  const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const expeditionsToLock = await prisma.expedition.findMany({
    where: {
      status: "PLANNING",
      createdAt: { lt: midnightToday }
    },
    include: {
      members: {
        include: {
          character: {
            select: {
              id: true,
              name: true,
              isDead: true,
              hp: true,
              hungerLevel: true,
              pm: true
            }
          }
        }
      }
    }
  });

  console.log(`${expeditionsToLock.length} expéditions à verrouiller`);

  let lockedCount = 0;
  let membersRemovedCount = 0;

  for (const expedition of expeditionsToLock) {
    // Check and remove unfit members
    for (const member of expedition.members) {
      const { character } = member;
      const shouldRemove =
        character.isDead ||
        character.hp <= 1 ||
        character.hungerLevel <= 1 ||
        character.pm <= 1;

      if (shouldRemove) {
        let reason = "";
        if (character.isDead || character.hp <= 1) reason = "mort/agonie";
        else if (character.hungerLevel <= 1) reason = "affamé/agonie";
        else if (character.pm <= 1) reason = "dépression/déprime";

        await container.expeditionService.removeMemberBeforeDeparture(expedition.id, character.id, reason);
        membersRemovedCount++;
        console.log(`   - ${character.name} retiré de ${expedition.name} (${reason})`);
      }
    }

    // Lock expedition
    await container.expeditionService.lockExpedition(expedition.id);

    if (!expedition.initialDirection || expedition.initialDirection === "UNKNOWN") {
      await prisma.expedition.update({
        where: { id: expedition.id },
        data: { initialDirection: "UNKNOWN" },
      });
    }

    lockedCount++;
    console.log(`   ✅ ${expedition.name} verrouillée`);
  }

  console.log(`✅ ${lockedCount} expéditions verrouillées`);
  console.log(`   - ${membersRemovedCount} membres retirés`);
}

// ====================================================================
// MAIN
// ====================================================================
async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║         SIMULATION DES TÂCHES CRON DE MINUIT (00:00:00)           ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  try {
    await hungerDecrease();
    await pmContagion();
    await expeditionLock();
    await dailyPaUpdate();

    console.log("\n" + "=".repeat(70));
    console.log("✅ TOUTES LES TÂCHES DE MINUIT SONT TERMINÉES");
    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERREUR lors de la simulation:", error);
    process.exit(1);
  }
}

main();

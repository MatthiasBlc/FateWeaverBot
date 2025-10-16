# 🚀 PHASE 2.2 : SYSTÈME DÉPRIME (PM=1) - LIMITE 1PA/JOUR

## 📋 Mission Supernova

**Objectif** : Implémenter un système de compteur PA quotidien pour limiter à 1PA/jour en cas de déprime (PM=1)
**Fichiers cibles** : 4 fichiers (~15 modifications)
**Résultat attendu** : Validation déprime + consommation PA avec compteur + reset quotidien

## ⚠️ CONTEXTE IMPORTANT

Les champs `paUsedToday` et `lastPaReset` sont **DÉJÀ ajoutés** au schéma Prisma et la migration est faite.
Tu n'as PAS besoin de modifier `schema.prisma`.

## 📦 TÂCHES (dans l'ordre)

### Tâche 1 : Enrichir la validation dans character-validators.ts

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/util/character-validators.ts`

**Modification** : Remplacer la fonction `validateCanUsePA` existante par cette version enrichie :

```typescript
import { Character } from "@prisma/client";

/**
 * Valide qu'un personnage peut utiliser des PA
 * @throws Error si le personnage ne peut pas utiliser de PA
 */
export function validateCanUsePA(character: Character, paRequired: number): void {
  // Agonie (HP=1) : ne peut plus utiliser de PA
  if (character.hp <= 1) {
    throw new Error("Personnage en agonie : impossible d'utiliser des PA");
  }

  // Déprime (PM=1) : max 1 PA/jour
  if (character.pm === 1) {
    if (character.paUsedToday + paRequired > 1) {
      throw new Error("Déprime : vous ne pouvez utiliser qu'1 PA par jour");
    }
  }

  // PA insuffisants
  if (character.paTotal < paRequired) {
    throw new Error("Pas assez de points d'action");
  }
}
```

**Tester** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend && npm run build`
**Commit** : `feat: add depression (PM=1) validation to PA usage`

---

### Tâche 2 : Ajouter fonction consumePA

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/util/character-validators.ts`

**Modification** : Ajouter cette fonction APRÈS `validateCanUsePA` :

```typescript
import { PrismaClient } from "@prisma/client";

/**
 * Consomme des PA et incrémente le compteur quotidien
 */
export async function consumePA(
  characterId: string,
  paAmount: number,
  prisma: PrismaClient
): Promise<void> {
  await prisma.character.update({
    where: { id: characterId },
    data: {
      paTotal: { decrement: paAmount },
      paUsedToday: { increment: paAmount }
    }
  });
}
```

**Tester** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend && npm run build`
**Commit** : `feat: add consumePA function for PA tracking`

---

### Tâche 3 : Modifier capability.service.ts - Remplacer tous les decrements

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/capability.service.ts`

**Étape A** : Ajouter l'import en haut du fichier (après les imports existants) :
```typescript
import { consumePA } from "../util/character-validators";
```

**Étape B** : Remplacer TOUTES les occurrences de décrémentation PA dans les méthodes suivantes :

#### Méthode 1 : `executeHarvestCapacity` (ligne ~292-297)

**AVANT** :
```typescript
await this.prisma.$transaction([
  this.prisma.character.update({
    where: { id: characterId },
    data: {
      paTotal: { decrement: capability.costPA * (luckyRoll ? 2 : 1) },
    },
  }),
  // Ajouter les vivres au stock...
```

**APRÈS** :
```typescript
await this.prisma.$transaction([
  consumePA(characterId, capability.costPA * (luckyRoll ? 2 : 1), this.prisma),
  // Ajouter les vivres au stock...
```

#### Méthode 2 : `executeBûcheronner` (ligne ~377-382)

**AVANT** :
```typescript
this.prisma.character.update({
  where: { id: characterId },
  data: {
    paTotal: { decrement: capability.costPA },
  },
}),
```

**APRÈS** :
```typescript
consumePA(characterId, capability.costPA, this.prisma),
```

#### Méthode 3 : `executeMiner` (ligne ~466-471)

**AVANT** :
```typescript
this.prisma.character.update({
  where: { id: characterId },
  data: {
    paTotal: { decrement: capability.costPA },
  },
}),
```

**APRÈS** :
```typescript
consumePA(characterId, capability.costPA, this.prisma),
```

#### Méthode 4 : `executeFish` (ligne ~546-550 ET 569-573)

**Occurence 1 (GRIGRI case)** :
**AVANT** :
```typescript
await this.prisma.character.update({
  where: { id: characterId },
  data: {
    paTotal: { decrement: paSpent },
  },
});
```

**APRÈS** :
```typescript
await consumePA(characterId, paSpent, this.prisma);
```

**Occurence 2 (dans transaction)** :
**AVANT** :
```typescript
await this.prisma.$transaction([
  this.prisma.character.update({
    where: { id: characterId },
    data: {
      paTotal: { decrement: paSpent },
    },
  }),
```

**APRÈS** :
```typescript
await this.prisma.$transaction([
  consumePA(characterId, paSpent, this.prisma),
```

#### Méthode 5 : `executeCraft` (ligne ~742-747)

**AVANT** :
```typescript
// Déduire les PA
await tx.character.update({
  where: { id: characterId },
  data: {
    paTotal: { decrement: paSpent },
  },
});
```

**APRÈS** :
```typescript
// Déduire les PA
await consumePA(characterId, paSpent, tx);
```

#### Méthode 6 : `executeSoigner` mode 'heal' (ligne ~809-812)

**IMPORTANT** : Cette méthode ne décrémente PAS les PA actuellement. Tu dois l'ajouter APRÈS avoir mis à jour le HP de la cible et AVANT le return.

**AJOUTER** :
```typescript
await this.prisma.character.update({
  where: { id: targetCharacterId },
  data: { hp: Math.min(5, target.hp + 1) }
});

// Consommer le PA du soigneur
await consumePA(characterId, 1, this.prisma);

return {
  success: true,
  message: `Vous avez soigné ${target.name} (+1 PV)`,
};
```

#### Méthode 7 : `executeSoigner` mode 'craft' (ligne ~834-851)

**AVANT le return, APRÈS la création du cataplasme, AJOUTER** :
```typescript
await this.prisma.resourceStock.upsert({
  // ... création cataplasme
});

// Consommer les PA
await consumePA(characterId, 2, this.prisma);

return {
  success: true,
  message: "Vous avez préparé un cataplasme",
};
```

#### Méthode 8 : `executeResearch` (ligne ~930-154)

**AVANT le return final, AJOUTER** :
```typescript
// Consommer les PA
await consumePA(characterId, paSpent, this.prisma);

const infoCount = paSpent === 1 ? 1 : 3;

return {
  success: true,
  message: `Recherche lancée (${infoCount} information(s))`,
};
```

#### Méthode 9 : `executeDivertir` (ligne ~1067-1069 ET 1093-1106)

**Occurence 1 (pas de spectacle)** :
**AVANT** :
```typescript
await this.prisma.character.update({
  where: { id: characterId },
  data: { divertCounter: newCounter }
});

return {
```

**APRÈS** :
```typescript
await this.prisma.$transaction([
  this.prisma.character.update({
    where: { id: characterId },
    data: { divertCounter: newCounter }
  }),
  consumePA(characterId, capability.costPA, this.prisma)
]);

return {
```

**Occurence 2 (spectacle ready)** :
**AVANT** :
```typescript
await this.prisma.$transaction(async (tx) => {
  // Reset counter
  await tx.character.update({
    where: { id: characterId },
    data: { divertCounter: 0 }
  });

  // +1 PM to all characters...
```

**APRÈS** :
```typescript
await this.prisma.$transaction(async (tx) => {
  // Reset counter
  await tx.character.update({
    where: { id: characterId },
    data: { divertCounter: 0 }
  });

  // Consommer les PA
  await consumePA(characterId, capability.costPA, tx);

  // +1 PM to all characters...
```

**Tester** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend && npm run build`
**Commit** : `feat: replace all PA decrements with consumePA in capability.service`

---

### Tâche 4 : Ajouter reset quotidien dans daily-pa.cron.ts

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/cron/daily-pa.cron.ts`

**Modification** : Dans la boucle `for (const character of characters)`, APRÈS le STEP 2.6 et AVANT le STEP 3, ajoute :

```typescript
// STEP 2.6: Reset agonySince if character has recovered from agony
if (character.hp > 1 && character.agonySince) {
  updateData.agonySince = null;
}

// STEP 2.7: Reset PA usage counter (pour déprime)
updateData.paUsedToday = 0;
updateData.lastPaReset = now;

// STEP 3: Update PA (only if alive and time has passed)
```

**Tester** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend && npm run build`
**Commit** : `feat: add daily PA usage counter reset for depression system`

---

### Tâche 5 : Modifier chantier.service.ts

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/chantier.service.ts`

**Étape A** : Ajouter l'import :
```typescript
import { consumePA } from "../util/character-validators";
```

**Étape B** : Trouver la méthode `workOnChantier` et remplacer le decrement PA :

**AVANT** :
```typescript
await prisma.character.update({
  where: { id: characterId },
  data: {
    paTotal: { decrement: paToInvest },
  },
});
```

**APRÈS** :
```typescript
await consumePA(characterId, paToInvest, prisma);
```

**Tester** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend && npm run build`
**Commit** : `feat: use consumePA in chantier.service`

---

## 📊 RAPPORT FINAL OBLIGATOIRE

Crée un fichier : `docs/supernova-reports/supernova-report-deprime-limit-pa-20251012.md`

**Structure EXACTE** :

```markdown
# 📊 RÉSUMÉ EXÉCUTIF (≤300 tokens)

**Statut** : ✅ Succès complet | ⚠️ Succès partiel | ❌ Échec
**Tâches complétées** : X/5
**Builds** : ✅ Backend OK (ou ❌ si erreurs)
**Commits** : X commits créés
**Problèmes bloquants** : Aucun | [Liste courte]

**Résumé** : [2-3 phrases décrivant ce qui a été fait]

---

# 📋 RAPPORT DÉTAILLÉ

## 📁 Fichiers Modifiés
- `/path/file1.ts` (+X lignes, -Y lignes)
[...]

## 💾 Commits Créés
1. `hash` - message
[...]

## ✅ Builds Réussis
- ✅ Backend : npm run build (0 errors)

## 🔧 Modifications Effectuées
[Liste détaillée par fichier]

## ⚠️ Problèmes Non Résolus
[Si applicable]

## 📈 Métriques
- Occurrences de `paTotal: { decrement:` remplacées : X
- Méthodes modifiées : X
- Lignes ajoutées : +XXX
- Lignes supprimées : -XXX
```

## 🎯 OBJECTIFS DE RÉUSSITE

- ✅ Validation déprime ajoutée à `validateCanUsePA`
- ✅ Fonction `consumePA` créée
- ✅ Tous les `paTotal: { decrement:` remplacés par `consumePA`
- ✅ Reset quotidien ajouté dans `daily-pa.cron.ts`
- ✅ Build backend passe sans erreur

## 🚀 COMMENCE

Lis attentivement chaque tâche et exécute-les dans l'ordre. N'oublie pas de tester après CHAQUE modification !

# Migration MENUISER → TRAVAILLER_LE_BOIS

## 📋 Contexte

**État actuel (2025-11-05) :**
- Enum en base : `CraftType.MENUISER`
- Affichage UI : "Travailler le bois"
- Tous les alias "menuiser" ont été nettoyés du code (sauf seed data)

**Historique :**
1. Migration initiale (20251014210313) : Enum créé avec `TRAVAILLER_LE_BOIS`
2. Migration suivante (20251016114238) : Renommé en `MENUISER`
3. Nettoyage actuel (2025-11-05) : Aliases "menuiser" retirés du code

---

## 🎯 Objectif de cette migration future

Renommer l'enum PostgreSQL de `MENUISER` → `TRAVAILLER_LE_BOIS` pour avoir une cohérence totale entre :
- La base de données (enum `TRAVAILLER_LE_BOIS`)
- Le code TypeScript (`CraftType.TRAVAILLER_LE_BOIS`)
- L'interface utilisateur ("Travailler le bois")

---

## ⚠️ RISQUES CRITIQUES

### 1. Données en production
- **Impact :** Toutes les lignes avec `craft_type = 'MENUISER'` dans la table `project_craft_types` doivent être converties
- **Risque :** Perte de données si migration mal exécutée
- **Downtime :** Transaction longue qui bloque la table pendant la migration
- **Rollback :** Difficile, nécessite une contre-migration

### 2. Code TypeScript
- **Impact :** TOUS les usages de `CraftType.MENUISER` deviennent invalides après `prisma generate`
- **Fichiers à modifier (5) :**
  - `bot/src/features/projects/projects.utils.ts`
  - `bot/src/features/projects/project-creation.ts`
  - `bot/src/features/admin/projects-admin/project-add/step-1-init.ts`
  - `bot/src/features/admin/projects-admin/project-add/step-2-types.ts`
  - `bot/src/features/admin/projects-admin/project-edit.ts`

### 3. Limitation PostgreSQL
- PostgreSQL **NE PERMET PAS** `ALTER TYPE ... RENAME VALUE`
- Nécessite de créer un nouvel enum, migrer les données, supprimer l'ancien (opération lourde)

---

## 📝 PLAN DE MIGRATION COMPLET

### ⏱️ Timing recommandé
- ✅ Maintenance planifiée (fenêtre de 1-2h)
- ✅ Backup de la base de données avant migration
- ✅ Environnement de staging testé d'abord
- ❌ JAMAIS en production avec joueurs actifs

---

### PHASE 1 : Préparation du code (AVANT migration DB)

#### 1.1 - Créer des aliases temporaires pour supporter les DEUX valeurs

**Fichier : `bot/src/features/projects/projects.utils.ts`**
```typescript
// Ajouter un type temporaire qui accepte les deux valeurs
export type CraftEnum = "TISSER" | "FORGER" | "MENUISER" | "TRAVAILLER_LE_BOIS";

// Mettre à jour le mapping pour accepter les deux
const craftDisplayMap: Record<string, CraftDisplayName> = {
  TISSER: "Tisser",
  FORGER: "Forger",
  MENUISER: "Travailler le bois",          // ancien (temporaire)
  TRAVAILLER_LE_BOIS: "Travailler le bois", // nouveau
};

const craftAliasToEnumMap: Record<string, string> = {
  tisser: "TISSER",
  forger: "FORGER",
  "travailler le bois": "TRAVAILLER_LE_BOIS",     // pointera vers le nouveau
  "travailler_le_bois": "TRAVAILLER_LE_BOIS",
  "travailler-le-bois": "TRAVAILLER_LE_BOIS",
  "travail du bois": "TRAVAILLER_LE_BOIS",
  bois: "TRAVAILLER_LE_BOIS",
  menuiser: "MENUISER",  // temporaire : garder pour rétrocompatibilité pendant migration
};
```

**Fichier : `backend/src/controllers/projects.ts`**
```typescript
// Import temporaire pour typage
import { CraftType } from "@prisma/client";

const craftAliasMap: Record<string, string> = {
  tisser: "TISSER",
  forger: "FORGER",
  "travailler le bois": "TRAVAILLER_LE_BOIS",
  travailler_le_bois: "TRAVAILLER_LE_BOIS",
  "travailler-le-bois": "TRAVAILLER_LE_BOIS",
  "travail du bois": "TRAVAILLER_LE_BOIS",
  bois: "TRAVAILLER_LE_BOIS",
  menuiser: "MENUISER",  // temporaire : rétrocompat
};
```

#### 1.2 - Commiter et déployer cette phase
```bash
git add .
git commit -m "Prepare: Add TRAVAILLER_LE_BOIS aliases for migration"
# Déployer en prod AVANT la migration DB
```

---

### PHASE 2 : Migration de la base de données

#### 2.1 - Modifier le schema Prisma

**Fichier : `backend/prisma/schema.prisma`**
```prisma
enum CraftType {
  TISSER
  FORGER
  TRAVAILLER_LE_BOIS  // renommé de MENUISER
}
```

#### 2.2 - Générer la migration Prisma

```bash
cd /home/bouloc/Repo/FateWeaverBot/backend
npx prisma migrate dev --name rename_craft_type_menuiser_to_travailler_le_bois
```

**Prisma va générer une migration SQL similaire à :**
```sql
-- AlterEnum
BEGIN;
CREATE TYPE "CraftType_new" AS ENUM ('TISSER', 'FORGER', 'TRAVAILLER_LE_BOIS');

-- Conversion des données existantes
ALTER TABLE "project_craft_types"
  ALTER COLUMN "craft_type" TYPE "CraftType_new"
  USING (
    CASE
      WHEN "craft_type"::text = 'MENUISER' THEN 'TRAVAILLER_LE_BOIS'
      ELSE "craft_type"::text
    END::"CraftType_new"
  );

ALTER TYPE "CraftType" RENAME TO "CraftType_old";
ALTER TYPE "CraftType_new" RENAME TO "CraftType";
DROP TYPE "CraftType_old";
COMMIT;
```

#### 2.3 - Tester en DEV d'abord !

```bash
# En dev, vérifier que la migration passe
npx prisma migrate deploy

# Vérifier les données
psql $DATABASE_URL -c "SELECT craft_type, COUNT(*) FROM project_craft_types GROUP BY craft_type;"
# Doit afficher: TRAVAILLER_LE_BOIS | X (et plus de MENUISER)
```

#### 2.4 - Backup production

```bash
# AVANT d'appliquer en prod, backup complet
pg_dump $PROD_DATABASE_URL > backup_before_craft_type_migration_$(date +%Y%m%d_%H%M%S).sql
```

#### 2.5 - Appliquer en production (fenêtre de maintenance)

```bash
# En PROD
npx prisma migrate deploy

# Vérifier immédiatement
psql $PROD_DATABASE_URL -c "SELECT craft_type, COUNT(*) FROM project_craft_types GROUP BY craft_type;"
```

---

### PHASE 3 : Nettoyage du code (APRÈS migration DB réussie)

#### 3.1 - Regénérer le client Prisma

```bash
npx prisma generate
```

Le type TypeScript sera maintenant :
```typescript
enum CraftType {
  TISSER = "TISSER",
  FORGER = "FORGER",
  TRAVAILLER_LE_BOIS = "TRAVAILLER_LE_BOIS"  // plus de MENUISER
}
```

#### 3.2 - Remplacer tous les CraftType.MENUISER

**Fichier : `bot/src/features/projects/projects.utils.ts`**
```typescript
// Supprimer MENUISER du type
export type CraftEnum = "TISSER" | "FORGER" | "TRAVAILLER_LE_BOIS";

// Supprimer du display map
const craftDisplayMap: Record<CraftEnum, CraftDisplayName> = {
  TISSER: "Tisser",
  FORGER: "Forger",
  TRAVAILLER_LE_BOIS: "Travailler le bois",
};

// Supprimer l'alias temporaire "menuiser"
const craftAliasToEnumMap: Record<string, CraftEnum> = {
  tisser: "TISSER",
  forger: "FORGER",
  "travailler le bois": "TRAVAILLER_LE_BOIS",
  "travailler_le_bois": "TRAVAILLER_LE_BOIS",
  "travailler-le-bois": "TRAVAILLER_LE_BOIS",
  "travail du bois": "TRAVAILLER_LE_BOIS",
  bois: "TRAVAILLER_LE_BOIS",
  // menuiser: supprimé
};

// Mettre à jour getCraftTypeEmoji
export function getCraftTypeEmoji(craftType: string): string {
  switch (craftType) {
    case "TISSER":
      return CAPABILITIES.WEAVING;
    case "FORGER":
      return CAPABILITIES.FORGING;
    case "TRAVAILLER_LE_BOIS":  // changé de MENUISER
      return CAPABILITIES.WOODWORKING;
    default:
      return PROJECT.ICON;
  }
}
```

**Fichier : `bot/src/features/projects/project-creation.ts`**
```typescript
// Ligne ~182
{ label: "Travailler le bois", value: "TRAVAILLER_LE_BOIS", emoji: CAPABILITIES.WOODWORKING },
```

**Fichier : `bot/src/features/admin/projects-admin/project-add/step-1-init.ts`**
```typescript
// Ligne ~123
{ label: "Travailler le bois", value: "TRAVAILLER_LE_BOIS", emoji: "🪚" },
```

**Fichier : `bot/src/features/admin/projects-admin/project-add/step-2-types.ts`**
```typescript
// Ligne ~111
{ label: "Travailler le bois", value: "TRAVAILLER_LE_BOIS", emoji: "🪚" },
```

**Fichier : `bot/src/features/admin/projects-admin/project-edit.ts`**
```typescript
// Ligne ~251
const validCraftTypes = ["TISSER", "FORGER", "TRAVAILLER_LE_BOIS"];
```

**Fichier : `backend/src/controllers/projects.ts`**
```typescript
const craftAliasMap: Record<string, CraftType> = {
  tisser: CraftType.TISSER,
  forger: CraftType.FORGER,
  "travailler le bois": CraftType.TRAVAILLER_LE_BOIS,
  travailler_le_bois: CraftType.TRAVAILLER_LE_BOIS,
  "travailler-le-bois": CraftType.TRAVAILLER_LE_BOIS,
  "travail du bois": CraftType.TRAVAILLER_LE_BOIS,
  bois: CraftType.TRAVAILLER_LE_BOIS,
  // menuiser: supprimé
};
```

#### 3.3 - Tester la compilation

```bash
# Bot
cd /home/bouloc/Repo/FateWeaverBot/bot
npm run build

# Backend
cd /home/bouloc/Repo/FateWeaverBot/backend
npm run build  # ou équivalent
```

#### 3.4 - Commiter et déployer

```bash
git add .
git commit -m "Migration: Rename CraftType.MENUISER to TRAVAILLER_LE_BOIS"
# Déployer en prod
```

---

### PHASE 4 : Vérification post-migration

#### 4.1 - Tests fonctionnels

- [ ] Créer un nouveau projet "Travailler le bois" via Discord
- [ ] Lister les projets par craft type
- [ ] Contribuer à un projet existant
- [ ] Vérifier l'affichage dans les embeds Discord

#### 4.2 - Vérifier les logs

```bash
docker compose logs -f discord-botdev | grep -i "craft"
docker compose logs -f backenddev | grep -i "craft"
```

#### 4.3 - Requête SQL de vérification

```sql
-- Vérifier qu'il n'y a plus de MENUISER
SELECT craft_type, COUNT(*)
FROM project_craft_types
GROUP BY craft_type;

-- Doit retourner uniquement : TISSER, FORGER, TRAVAILLER_LE_BOIS
```

---

## 🔄 PLAN DE ROLLBACK (en cas de problème)

### Si la migration DB échoue

```bash
# Restaurer le backup
psql $PROD_DATABASE_URL < backup_before_craft_type_migration_YYYYMMDD_HHMMSS.sql
```

### Si le code déployé cause des erreurs

1. Revert du commit de nettoyage (Phase 3)
```bash
git revert HEAD
git push
```

2. Garder l'état "PHASE 1" (code qui supporte les deux valeurs)

### Contre-migration (si nécessaire)

Créer une migration manuelle pour revenir à `MENUISER` :

```sql
-- migration_rollback_menuiser.sql
BEGIN;
CREATE TYPE "CraftType_new" AS ENUM ('TISSER', 'FORGER', 'MENUISER');

ALTER TABLE "project_craft_types"
  ALTER COLUMN "craft_type" TYPE "CraftType_new"
  USING (
    CASE
      WHEN "craft_type"::text = 'TRAVAILLER_LE_BOIS' THEN 'MENUISER'
      ELSE "craft_type"::text
    END::"CraftType_new"
  );

ALTER TYPE "CraftType" RENAME TO "CraftType_old";
ALTER TYPE "CraftType_new" RENAME TO "CraftType";
DROP TYPE "CraftType_old";
COMMIT;
```

---

## ✅ CHECKLIST AVANT MIGRATION

- [ ] Backup complet de la base de données
- [ ] Migration testée en environnement de staging
- [ ] Fenêtre de maintenance planifiée (1-2h)
- [ ] Aucun joueur actif pendant la migration
- [ ] Tous les fichiers de code identifiés et prêts à être modifiés
- [ ] Plan de rollback documenté et testé
- [ ] Équipe disponible pour monitoring post-déploiement

---

## 🎯 QUAND FAIRE CETTE MIGRATION ?

### ✅ LE FAIRE si :
- Base de données vide ou en early dev
- Aucun joueur actif / pas encore en production
- Vous voulez une cohérence totale code/DB

### ❌ NE PAS LE FAIRE si :
- Projets actifs en production avec `craft_type = 'MENUISER'`
- Jeu en cours avec joueurs actifs
- Pas de fenêtre de maintenance disponible
- Pas de backup récent

### 🏆 ALTERNATIVE RECOMMANDÉE (état actuel)

**GARDER `MENUISER` en base, afficher "Travailler le bois" en UI**

**Avantages :**
- ✅ Zéro risque de régression
- ✅ Aucun downtime
- ✅ UX correcte partout
- ✅ Pattern acceptable (enum interne ≠ display name)

**Inconvénient :**
- ⚠️ Discordance interne (cosmétique uniquement)

---

## 📌 Notes importantes

1. **PostgreSQL enum limitations :** Pas de rename direct, nécessite recréation complète
2. **Downtime estimé :** 5-15 minutes selon la taille de la table `project_craft_types`
3. **Impact utilisateur :** Aucun si bien exécuté (valeurs mappées automatiquement)
4. **Coût/bénéfice :** Migration lourde pour un gain uniquement cosmétique

---

**Document créé le :** 2025-11-05
**État actuel du projet :** Enum DB = `MENUISER`, Display = "Travailler le bois"
**Décision :** Migration reportée, état actuel satisfaisant

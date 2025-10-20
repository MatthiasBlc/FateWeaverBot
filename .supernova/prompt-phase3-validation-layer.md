# Phase 3: Validation Layer avec Zod

**Date**: 2025-10-20
**Objectif**: Implémenter la validation Zod pour tous les endpoints API du backend

---

## Contexte

Nous sommes en Phase 3 du refactoring backend. Les phases 0, 1 et 2 sont complètes :
- Phase 0 : Setup & Tooling ✅
- Phase 1 : Query Builders ✅
- Phase 2 : Extract Utilities ✅

Cette phase va ajouter une couche de validation robuste avec Zod pour sécuriser tous les endpoints API.

---

## Objectifs de la Phase 3

1. Créer un middleware de validation générique utilisant Zod
2. Créer des schémas Zod pour TOUS les endpoints existants
3. Appliquer la validation à toutes les routes
4. Vérifier que la compilation passe
5. Tester manuellement quelques validations critiques

---

## Architecture Cible

```
backend/src/
├── api/
│   ├── middleware/
│   │   └── validation.middleware.ts    (nouveau)
│   └── validators/
│       ├── character.schema.ts         (nouveau)
│       ├── expedition.schema.ts        (nouveau)
│       ├── resource.schema.ts          (nouveau)
│       ├── project.schema.ts           (nouveau)
│       ├── chantier.schema.ts          (nouveau)
│       ├── capability.schema.ts        (nouveau)
│       ├── guild.schema.ts             (nouveau)
│       ├── job.schema.ts               (nouveau)
│       ├── object.schema.ts            (nouveau)
│       ├── role.schema.ts              (nouveau)
│       ├── skill.schema.ts             (nouveau)
│       ├── town.schema.ts              (nouveau)
│       ├── user.schema.ts              (nouveau)
│       ├── season.schema.ts            (nouveau)
│       └── action-point.schema.ts      (nouveau)
└── routes/
    ├── characters.ts                   (à modifier)
    ├── expedition.ts                   (à modifier)
    ├── resources.ts                    (à modifier)
    ├── projects.ts                     (à modifier)
    ├── chantier.ts                     (à modifier)
    ├── capabilities.ts                 (à modifier)
    ├── guilds.ts                       (à modifier)
    ├── jobs.ts                         (à modifier)
    ├── objects.ts                      (à modifier)
    ├── roles.ts                        (à modifier)
    ├── skills.ts                       (à modifier)
    ├── towns.ts                        (à modifier)
    ├── users.ts                        (à modifier)
    ├── seasons.ts                      (à modifier)
    └── action-point.routes.ts          (à modifier)
```

---

## Tâches Détaillées

### Tâche 1: Créer le Middleware de Validation

**Fichier**: `backend/src/api/middleware/validation.middleware.ts`

Créer un middleware générique qui :
- Accepte un schéma Zod
- Parse `req.body`, `req.params`, et `req.query`
- Retourne une erreur 400 avec détails si la validation échoue
- Passe au prochain middleware si la validation réussit

**Template à suivre** (dans docs/backend-refactoring/04-IMPLEMENTATION-PLAN.md lignes 430-455)

---

### Tâche 2: Analyser TOUS les Fichiers de Routes

Pour CHAQUE fichier de route, identifier :
1. **Tous les endpoints** (GET, POST, PUT, PATCH, DELETE)
2. **Les paramètres attendus** (params, query, body)
3. **Les types attendus** (string, number, uuid, etc.)
4. **Les contraintes** (min, max, optional, etc.)

**Fichiers à analyser** (15 fichiers) :
- `backend/src/routes/characters.ts`
- `backend/src/routes/expedition.ts`
- `backend/src/routes/resources.ts`
- `backend/src/routes/projects.ts`
- `backend/src/routes/chantier.ts`
- `backend/src/routes/capabilities.ts`
- `backend/src/routes/guilds.ts`
- `backend/src/routes/jobs.ts`
- `backend/src/routes/objects.ts`
- `backend/src/routes/roles.ts`
- `backend/src/routes/skills.ts`
- `backend/src/routes/towns.ts`
- `backend/src/routes/users.ts`
- `backend/src/routes/seasons.ts`
- `backend/src/routes/action-point.routes.ts`

**IMPORTANT**: Pour découvrir les types attendus, il faut aussi regarder les controllers/services correspondants.

---

### Tâche 3: Créer les Schémas Zod

Pour **CHAQUE** fichier de route, créer un fichier `*.schema.ts` correspondant avec :
- Un schéma Zod pour CHAQUE endpoint qui accepte des paramètres
- Noms de schémas descriptifs (ex: `CreateCharacterSchema`, `GetActiveCharacterSchema`)
- Validation stricte (types, longueurs, formats)

**Priorité de création** :
1. **character.schema.ts** (le plus critique, ~10-15 endpoints)
2. **expedition.schema.ts** (~8 endpoints)
3. **resource.schema.ts** (~6 endpoints)
4. **project.schema.ts** (~5 endpoints)
5. **chantier.schema.ts** (~5 endpoints)
6. Les 10 autres fichiers de schémas (plus simples)

**Template de schéma** :
```typescript
import { z } from "zod";

// GET /characters/:discordId/:townId
export const GetActiveCharacterSchema = z.object({
  params: z.object({
    discordId: z.string().min(1),
    townId: z.string().uuid()
  })
});

// POST /characters
export const CreateCharacterSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    townId: z.string().uuid(),
    name: z.string().min(1).max(50),
    jobId: z.number().int().positive()
  })
});

// PATCH /characters/:id/stats
export const UpdateCharacterStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    hp: z.number().int().min(0).max(5).optional(),
    pm: z.number().int().min(0).max(5).optional(),
    hungerLevel: z.number().int().min(0).max(4).optional()
  })
});
```

---

### Tâche 4: Appliquer la Validation aux Routes

Pour **CHAQUE** endpoint dans **CHAQUE** fichier de route :
1. Importer `validate` middleware
2. Importer les schémas nécessaires
3. Ajouter `validate(Schema)` entre la route et le controller

**Exemple** :
```typescript
// Avant
router.get("/:discordId/:townId", CharacterController.getActiveCharacterByDiscordId);

// Après
import { validate } from "../api/middleware/validation.middleware";
import { GetActiveCharacterSchema } from "../api/validators/character.schema";

router.get(
  "/:discordId/:townId",
  validate(GetActiveCharacterSchema),
  CharacterController.getActiveCharacterByDiscordId
);
```

**Fichiers à modifier** : Tous les 15 fichiers de routes listés ci-dessus.

---

### Tâche 5: Vérification et Tests

1. **TypeCheck** : `npm run typecheck` doit passer
2. **Build** : `npm run build` doit réussir
3. **Tests manuels** :
   - Tester 3-5 endpoints critiques (character, expedition, resource)
   - Envoyer des requêtes invalides
   - Vérifier que des erreurs 400 avec détails sont retournées

---

## Stratégie d'Exécution

**Ordre d'exécution recommandé** :

1. Créer `validation.middleware.ts` (5 min)
2. Analyser TOUS les fichiers de routes en parallèle (agents) (20 min)
3. Créer TOUS les fichiers de schémas en parallèle (agents) (60 min)
4. Appliquer validation aux routes en séquence par priorité :
   - characters.ts
   - expedition.ts
   - resources.ts
   - projects.ts
   - chantier.ts
   - Les 10 autres fichiers
5. Vérifier typecheck après chaque groupe de fichiers
6. Tests manuels finaux

**Durée estimée totale** : 6-8 heures

---

## Points d'Attention

1. **UUIDs** : Utiliser `z.string().uuid()` pour les IDs Prisma
2. **Discord IDs** : Utiliser `z.string().min(1)` (pas uuid, c'est un snowflake)
3. **Nombres** : Vérifier si `number()` ou `string()` dans req.params (Express parse tout en string)
4. **Optional vs Required** : Regarder le code des controllers pour savoir quoi rendre optional
5. **Arrays** : Utiliser `z.array(z.string())` pour les tableaux
6. **Enums** : Si des valeurs fixes existent, utiliser `z.enum(["value1", "value2"])`

---

## Livrables

À la fin de cette phase, nous devons avoir :

1. ✅ 1 middleware de validation créé
2. ✅ 15 fichiers de schémas Zod créés
3. ✅ 15 fichiers de routes modifiés avec validation
4. ✅ TypeCheck qui passe
5. ✅ Build qui réussit
6. ✅ Tests manuels validant 3-5 endpoints critiques
7. ✅ Rapport `.supernova/report-phase3-validation-layer.md`
8. ✅ `docs/backend-refactoring/05-PROGRESS-TRACKER.md` mis à jour

---

## Commandes Utiles

```bash
# Vérifier la compilation
cd /home/bouloc/Repo/FateWeaverBot/backend
npm run typecheck

# Construire
npm run build

# Voir la structure des routes
ls -la src/routes/

# Compter les endpoints dans un fichier de routes
grep -E "router\.(get|post|put|patch|delete)" src/routes/characters.ts | wc -l
```

---

## Format du Rapport Final

Le rapport dans `.supernova/report-phase3-validation-layer.md` doit contenir :

### Section 1 : Résumé Exécutif (≤300 tokens)
- Nombre de schémas créés
- Nombre de routes modifiées
- Nombre d'endpoints validés
- Problèmes rencontrés
- Temps total
- Statut final (TypeCheck, Build, Tests)

### Section 2 : Détails Techniques
- Liste complète des fichiers créés
- Liste complète des fichiers modifiés
- Exemples de schémas créés
- Commits effectués

### Section 3 : Métriques
- Endpoints par fichier de route
- Schémas créés par fichier
- Lignes de code ajoutées

### Section 4 : Prochaines Étapes
- Phase 4 : Repository Layer

---

**IMPORTANT** : Crée ce rapport AUTOMATIQUEMENT à la fin de l'exécution, avec le résumé de ≤300 tokens en première section.

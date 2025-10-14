# 🚀 REFACTORING EMOJIS - Centralisation vers emojis.ts

## 📋 Mission Supernova

**Objectif** : Remplacer tous les emojis hardcodés dans le code et la DB par des références au fichier centralisé `bot/src/constants/emojis.ts`

**Fichiers cibles** :
- 1 fichier de seed (backend/prisma/seed.ts)
- ~15-20 fichiers TypeScript dans le bot (à identifier lors de l'audit)

**Résultat attendu** :
- ✅ Tous les emojis de resourceTypes utilisent les références emojis.ts
- ✅ Tous les emojis hardcodés du bot remplacés par imports depuis emojis.ts
- ✅ Build backend OK
- ✅ Build bot OK
- ✅ Commits créés pour chaque modification

---

## ⚠️ RÈGLES CRITIQUES - IMPÉRATIF

### 🚫 INTERDICTIONS ABSOLUES
1. **NE JAMAIS supprimer un fichier** sans avoir essayé au moins 3 corrections différentes
2. **NE JAMAIS considérer un fichier "corrompu"** - Corriger les erreurs TypeScript, pas supprimer
3. **NE JAMAIS tourner en boucle** - Si même erreur après 2 tentatives :
   - STOP immédiatement
   - Documente l'erreur dans le rapport
   - Passe à la tâche suivante
4. **NE JAMAIS committer sans build** - Build DOIT passer avant commit
5. **NE JAMAIS modifier les valeurs d'emojis dans emojis.ts** - Seulement référencer ce fichier

### ✅ WORKFLOW STRICT PAR FICHIER

```
Pour CHAQUE fichier modifié :
1. Modifier le fichier
2. cd /chemin/absolu && npm run build
3. Si erreur :
   a. Lire l'erreur TypeScript complète
   b. Corriger DANS LE MÊME FICHIER (pas de suppression)
   c. Re-build
   d. Si même erreur → Tenter correction différente (max 2 fois)
   e. Si toujours erreur → STOP, documenter, passer au suivant
4. Si build OK :
   a. git add .
   b. git commit -m "feat(emoji): description précise"
   c. Passer au fichier suivant
```

### 🔍 GESTION ERREURS TYPESCRIPT

**Types d'erreurs et corrections :**
- `Unexpected token` → Vérifier accolades/parenthèses/virgules
- `Cannot find name` → Ajouter import ou déclarer la variable
- `Type X is not assignable to Y` → Ajuster le type ou le cast
- `X is declared but never used` → Utiliser la variable ou supprimer la déclaration
- `Missing closing brace` → Compter les accolades, ajouter la manquante

**SI BLOQUÉ après 2 tentatives :**
1. Laisser le fichier dans son état actuel
2. Documenter : "❌ Fichier X : Erreur Y non résolue après 2 tentatives"
3. Passer à la tâche suivante
4. **NE PAS** supprimer le fichier

---

## 🎯 COMMANDES EXACTES

- **Build backend** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend && npm run build`
- **Build bot** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build`
- **Commit** : `git add . && git commit -m "message"`

---

## 📦 TÂCHES (dans l'ordre)

### 🎯 Phase 1 : Audit des emojis hardcodés

**Fichier de référence** : `bot/src/constants/emojis.ts`

**Action** : Identifier TOUS les fichiers contenant des emojis hardcodés :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot
grep -r "🏹\|🌿\|🎣\|🪓\|⛏️\|🧵\|🔨\|🪚\|🫕\|⚕️\|🔎\|🗺️\|🌦️\|🎭\|💪\|📦\|🌾\|🥞\|🌲\|⚙️\|🪵\|🍞\|🍴\|🩹\|❤️\|🖤\|💜\|⚡\|😰\|😫\|😕\|😊\|💀\|🏘️\|🏕️\|📝\|🔒\|🚶‍♀️‍➡️\|🧭" --include="*.ts" --include="*.tsx" bot/src/ backend/
```

Créer une liste complète de tous les fichiers trouvés.

---

### Tâche 1 : Refactor seed.ts - ResourceTypes

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/prisma/seed.ts`

**Situation actuelle** :
Les emojis de resourceTypes sont hardcodés :
```typescript
const resourceTypes = [
  { name: "Vivres", emoji: "🍞", category: "base", description: "..." },
  { name: "Bois", emoji: "🌲", category: "base", description: "..." },
  // etc.
];
```

**Modifications** :
1. Ajouter l'import en haut du fichier :
   ```typescript
   import { RESOURCES } from '../../bot/src/constants/emojis';
   ```

2. Remplacer les emojis hardcodés par les références :
   ```typescript
   const resourceTypes = [
     { name: "Vivres", emoji: RESOURCES.FOOD, category: "base", description: "..." },
     { name: "Bois", emoji: RESOURCES.WOOD, category: "base", description: "..." },
     { name: "Minerai", emoji: RESOURCES.MINERAL, category: "base", description: "..." },
     { name: "Métal", emoji: RESOURCES.METAL, category: "base", description: "..." },
     { name: "Tissu", emoji: RESOURCES.FABRIC, category: "transformé", description: "..." },
     { name: "Planches", emoji: RESOURCES.PLANKS, category: "transformé", description: "..." },
     { name: "Nourriture", emoji: RESOURCES.PREPARED_FOOD, category: "transformé", description: "..." },
     { name: "Cataplasme", emoji: RESOURCES.CATAPLASM, category: "science", description: "..." },
   ];
   ```

**Tester** : `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend && npm run build`

**Commit** : `git add . && git commit -m "feat(emoji): refactor seed.ts to use emojis.ts references for resourceTypes"`

---

### Tâche 2 : Audit et refactor des fichiers bot

**Action** : Pour chaque fichier identifié lors de la Phase 1, appliquer le pattern suivant :

**Pattern de transformation** :

**AVANT** :
```typescript
const someVariable = "🏹 Chasse";
```

**APRÈS** :
```typescript
import { CAPABILITIES } from '../constants/emojis';

const someVariable = `${CAPABILITIES.HUNT} Chasse`;
```

**Règles de mapping** :
- `🏹` → `CAPABILITIES.HUNT`
- `🌿` → `CAPABILITIES.GATHER`
- `🎣` → `CAPABILITIES.FISH`
- `🪓` → `CAPABILITIES.CHOPPING`
- `⛏️` → `CAPABILITIES.MINING`
- `🧵` → `CAPABILITIES.WEAVING`
- `🔨` → `CAPABILITIES.FORGING`
- `🪚` → `CAPABILITIES.WOODWORKING`
- `🫕` → `CAPABILITIES.COOKING`
- `⚕️` → `CAPABILITIES.HEALING`
- `🔎` → `CAPABILITIES.RESEARCHING`
- `🗺️` → `CAPABILITIES.CARTOGRAPHING`
- `🌦️` → `CAPABILITIES.AUGURING`
- `🎭` → `CAPABILITIES.ENTERTAIN`
- `💪` → `CAPABILITIES.GENERIC`
- `📦` → `RESOURCES.GENERIC`
- `🌾` → `RESOURCES.FOOD`
- `🥞` → `RESOURCES.PREPARED_FOOD`
- `🌲` → `RESOURCES.WOOD`
- `⚙️` → `RESOURCES.METAL`
- `🧵` → `RESOURCES.FABRIC`
- `🪵` → `RESOURCES.PLANKS`
- `🍞` → `RESOURCES_EXTENDED.BREAD`
- `🍴` → `RESOURCES_EXTENDED.FORK_KNIFE`
- `🩹` → `RESOURCES_EXTENDED.BANDAGE`
- `❤️` → `CHARACTER.HP_FULL`
- `🖤` → `CHARACTER.HP_EMPTY` ou `CHARACTER.MP_EMPTY`
- `💜` → `CHARACTER.MP_FULL`
- `⚡` → `CHARACTER.PA`
- `😰` → `HUNGER.AGONY`
- `😫` → `HUNGER.STARVATION`
- `😕` → `HUNGER.HUNGRY`
- `😊` → `HUNGER.FED`
- `💀` → `HUNGER.DEAD`
- `🏘️` → `LOCATION.TOWN` ou `LOCATION.CITY`
- `🏕️` → `LOCATION.EXPEDITION` ou `EXPEDITION.CAMP`
- `📝` → `EXPEDITION.PLANNING`
- `🔒` → `EXPEDITION.LOCKED`
- `🚶‍♀️‍➡️` → `EXPEDITION.DEPARTED`
- `🧭` → `EXPEDITION.ICON`

**Pour chaque fichier modifié** :
1. Ajouter les imports nécessaires (seulement ceux utilisés)
2. Remplacer les emojis hardcodés
3. Build
4. Si OK → Commit avec message : `feat(emoji): refactor [filename] to use emojis.ts`

---

## 📊 RAPPORT FINAL OBLIGATOIRE

Tu DOIS créer un fichier de rapport avec cette structure EXACTE :

**Emplacement** : `docs/supernova-reports/supernova-report-emoji-refactor-20251014.md`

**Structure du fichier** :

```markdown
# 📊 RÉSUMÉ EXÉCUTIF (≤300 tokens)

**Statut** : ✅ Succès complet | ⚠️ Succès partiel | ❌ Échec
**Fichiers modifiés** : X
**Builds** : ✅ Backend OK | ✅ Bot OK (ou ❌ si erreurs)
**Commits** : X commits créés
**Problèmes bloquants** : Aucun | [Liste courte]

**Résumé** : [2-3 phrases décrivant ce qui a été fait et résultat global]

**Mapping d'emojis** : X emojis remplacés par références emojis.ts

---

# 📋 RAPPORT DÉTAILLÉ

## 📁 Fichiers Modifiés
[Liste complète avec lignes ajoutées/supprimées]

## 💾 Commits Créés
[Liste avec hashes et messages]

## ✅ Builds Réussis
[Détails des builds]

## 🔧 Mapping d'Emojis Appliqué
[Liste des remplacements effectués avec détails]

## ⚠️ Problèmes Non Résolus
[Si applicable]

## 📈 Métriques
[Temps, lignes, taux de succès]
```

**RÈGLE CRITIQUE** : Le RÉSUMÉ EXÉCUTIF doit tenir en 300 tokens MAX (Claude le lira toujours, le reste seulement si nécessaire)

---

## ✅ PROCÉDURE

1. **Phase 1 : Audit**
   - Identifier tous les fichiers avec emojis hardcodés
   - Créer liste complète

2. **Phase 2 : Refactor seed.ts**
   - Modifier seed.ts
   - Build backend
   - Commit si OK

3. **Phase 3 : Refactor fichiers bot**
   - Pour chaque fichier identifié :
     - Ajouter imports emojis.ts
     - Remplacer emojis hardcodés
     - Build bot
     - Commit si OK

4. **Phase 4 : Rapport**
   - Créer fichier de rapport complet
   - Vérifier résumé ≤300 tokens

---

## 🎯 OBJECTIFS DE RÉUSSITE

- ✅ Tous les emojis de resourceTypes dans seed.ts utilisent RESOURCES.*
- ✅ Tous les emojis hardcodés du bot remplacés par imports emojis.ts
- ✅ Build backend passe (0 errors)
- ✅ Build bot passe (0 errors)
- ✅ Au moins 1 commit par fichier modifié
- ✅ Rapport créé avec résumé ≤300 tokens

---

## 🚨 SI PROBLÈME

**Si import circulaire ou erreur de module :**
1. Vérifier le chemin relatif de l'import
2. Essayer import absolu si disponible
3. Si toujours erreur après 2 tentatives → Documenter et passer au suivant

**Si emoji non trouvé dans emojis.ts :**
1. Vérifier le fichier emojis.ts pour trouver l'équivalent
2. Si vraiment pas de correspondance → Laisser l'emoji hardcodé et documenter
3. Noter dans le rapport : "Emoji X non disponible dans emojis.ts"

---

## 🚀 COMMENCE

1. Commence par l'audit complet (Phase 1)
2. Note tous les fichiers trouvés
3. Modifie seed.ts en premier (Phase 2)
4. Puis traite les fichiers bot un par un (Phase 3)
5. Crée le rapport final (Phase 4)
6. **N'oublie pas** : Résumé ≤300 tokens pour Claude Code !

Bonne chance ! 🎯

# 🚀 SUPERNOVA - Phase 2: Migration Emojis Centralisés

## 📋 Mission Supernova

**Objectif** : Migrer les emojis hardcodés vers la config centralisée
**Fichiers cibles** : 3 fichiers prioritaires (text-formatters.ts, users.handlers.ts, chantiers.handlers.ts)
**Résultat attendu** : Import des constantes, emojis remplacés, builds réussis

---

## ⚠️ RÈGLES CRITIQUES

1. **Commandes** : Toujours utiliser les chemins absolus
   - Working directory: `/home/thorynest/Perso/2-Projects/FateWeaverBot`
   - Bot directory: `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot`

2. **Ordre** : Traiter les fichiers dans l'ordre (du plus simple au plus complexe)

3. **Pattern de remplacement** :
   - Ajouter import en haut : `import { CHARACTER, HUNGER, STATUS, ACTIONS, CAPABILITIES, CHANTIER } from "../../constants/emojis.js";`
   - Remplacer emojis hardcodés par constantes
   - Exemple : `"❤️"` → `CHARACTER.HP_FULL`

4. **Tests** : `npm run build` après CHAQUE fichier

5. **Commits** : Commit après chaque fichier migré

---

## 📦 TÂCHES (dans l'ordre)

### ✅ Tâche 1 : Migrer text-formatters.ts

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/utils/text-formatters.ts`

**Étape 1** : Ajouter import en ligne 1
```typescript
import { CHARACTER, HUNGER, RESOURCES } from "../constants/emojis.js";
import type { Character } from "../types/entities";
```

**Étape 2** : Remplacements (ordre exact des lignes)

| Ligne | Avant | Après |
|-------|-------|-------|
| 8 | `❤️ **PV:**` | `${CHARACTER.HP_FULL} **PV:**` |
| 9 | `⚡ **PM:**` | `${CHARACTER.PA} **PM:**` |
| 10 | `🎯 **PA:**` | `${CHARACTER.PA_ALT} **PA:**` |
| 14 | `🍖 **Faim:**` | `${HUNGER.ICON} **Faim:**` |
| 26 | `return "💀 Mort de faim";` | `return \`${HUNGER.DEAD} Mort de faim\`;` |
| 28 | `return "😰 Agonisant";` | `return \`${HUNGER.AGONY} Agonisant\`;` |
| 30 | `return "😟 Affamé";` | `return \`${HUNGER.STARVING} Affamé\`;` |
| 32 | `return "😐 Faim";` | `return \`${HUNGER.HUNGRY} Faim\`;` |
| 34 | `return "😊 Rassasié";` | `return \`${HUNGER.FED} Rassasié\`;` |
| 36 | `return "❓ Inconnu";` | `return \`${HUNGER.UNKNOWN} Inconnu\`;` |
| 49 | `${r.emoji \|\| "📦"}` | `${r.emoji \|\| RESOURCES.GENERIC}` |

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Migrate text-formatters.ts to centralized emojis

- Import CHARACTER, HUNGER, RESOURCES constants
- Replace 11 hardcoded emojis with constants
- Improve maintainability and consistency"
```

---

### ✅ Tâche 2 : Migrer users.handlers.ts (partie 1/2 - Status et erreurs)

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/users/users.handlers.ts`

**Étape 1** : Ajouter import (après les imports existants, avant le premier import local)
```typescript
import { CHARACTER, HUNGER, STATUS, CAPABILITIES, RESOURCES } from "../../constants/emojis.js";
```

**Étape 2** : Remplacements des emojis STATUS et erreurs

| Ligne | Avant | Après |
|-------|-------|-------|
| 37 | `"❌ Impossible de trouver` | `\`${STATUS.ERROR} Impossible de trouver` |
| 197 | `"❌ Vous devez d'abord` | `\`${STATUS.ERROR} Vous devez d'abord` |
| 204 | `"⚠️ Votre personnage` | `\`${STATUS.WARNING} Votre personnage` |
| 220 | `"❌ Impossible de déterminer` | `\`${STATUS.ERROR} Impossible de déterminer` |
| 232 | `"❌ Une erreur est survenue` | `\`${STATUS.ERROR} Une erreur est survenue` |
| 241 | `` `📋 Profil de `` | `` `${CHARACTER.PROFILE} Profil de `` |
| 269 | `name: "⚠️ **ATTENTION**"` | `name: \`${STATUS.WARNING} **ATTENTION**\`` |

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Migrate users.handlers.ts emojis (1/3) - Status and errors

- Import emoji constants
- Replace STATUS emojis (ERROR, WARNING)
- Replace CHARACTER.PROFILE emoji"
```

---

### ✅ Tâche 3 : Migrer users.handlers.ts (partie 2/3 - Stats et boutons)

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/users/users.handlers.ts`

**Remplacements stats et boutons**

| Ligne | Avant | Après |
|-------|-------|-------|
| 300 | `createHeartDisplay(data.character.pm, 5, '💜', '🖤')` | `createHeartDisplay(data.character.pm, 5, CHARACTER.MP_FULL, CHARACTER.HP_EMPTY)` |
| 318 | `name: "🔮 **CAPACITÉS`  | `name: \`${CAPABILITIES.GENERIC} **CAPACITÉS` |
| 353 | `.setLabel("Manger 🍞 (1)")` | `.setLabel(\`Manger ${RESOURCES.FOOD} (1)\`)` |
| 360 | `.setLabel("Manger 🍽️ (1)")` | `.setLabel(\`Manger ${RESOURCES.PREPARED_FOOD} (1)\`)` |
| 447 | `filledEmoji = '❤️', emptyEmoji = '🖤'` | `filledEmoji = CHARACTER.HP_FULL, emptyEmoji = CHARACTER.HP_EMPTY` |
| 464 | `const hearts = ['❤️‍🩹'];` | `const hearts = [CHARACTER.HP_BANDAGED];` |
| 468 | `hearts.push('🖤');` | `hearts.push(CHARACTER.HP_EMPTY);` |

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Migrate users.handlers.ts emojis (2/3) - Stats and buttons

- Replace CHARACTER emojis (HP, MP, hearts)
- Replace RESOURCES emojis (food buttons)
- Replace CAPABILITIES.GENERIC emoji"
```

---

### ✅ Tâche 4 : Migrer users.handlers.ts (partie 3/3 - Faim et capacités)

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/users/users.handlers.ts`

**Remplacements fonction getHungerEmoji**

| Ligne | Avant | Après |
|-------|-------|-------|
| 392 | `return "💀";` | `return HUNGER.DEAD;` |
| 394 | `return "😰";` | `return HUNGER.AGONY;` |
| 396 | `return "😕";` | `return HUNGER.STARVING;` |
| 398 | `return "🤤";` | `return HUNGER.HUNGRY;` |
| 400 | `return "😊";` | `return HUNGER.FED;` |
| 402 | `return "❓";` | `return HUNGER.UNKNOWN;` |

**Remplacements erreurs et succès**

| Ligne | Avant | Après |
|-------|-------|-------|
| 503 | `"❌ Vous ne pouvez` | `\`${STATUS.ERROR} Vous ne pouvez` |
| 516 | `"❌ Capacité non` | `\`${STATUS.ERROR} Capacité non` |
| 525 | `"❌ Personnage non` | `\`${STATUS.ERROR} Personnage non` |
| 537 | `"❌ Vous ne pouvez` | `\`${STATUS.ERROR} Vous ne pouvez` |
| 543 | `"❌ Vous ne pouvez pas` | `\`${STATUS.ERROR} Vous ne pouvez pas` |
| 550 | `` `❌ Vous n'avez`` | `` `${STATUS.ERROR} Vous n'avez`` |
| 573 | `` `✅ **`` | `` `${STATUS.SUCCESS} **`` |
| 593 | `` `❌ ${errorMessage}`` | `` `${STATUS.ERROR} ${errorMessage}`` |

**Remplacements getCapabilityEmoji**

| Ligne | Avant | Après |
|-------|-------|-------|
| 607 | `case 'chasser': return '🏹';` | `case 'chasser': return CAPABILITIES.HUNT;` |
| 608 | `case 'cueillir': return '🌿';` | `case 'cueillir': return CAPABILITIES.GATHER;` |
| 609 | `case 'pêcher': return '🎣';` | `case 'pêcher': return CAPABILITIES.FISH;` |
| 610 | `case 'divertir': return '🎭';` | `case 'divertir': return CAPABILITIES.ENTERTAIN;` |
| 611 | `default: return '🔮';` | `default: return CAPABILITIES.GENERIC;` |

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Migrate users.handlers.ts emojis (3/3) - Hunger and capabilities

- Replace all HUNGER emojis in getHungerEmoji()
- Replace all CAPABILITIES emojis
- Replace remaining STATUS emojis
- Complete migration of users.handlers.ts"
```

---

### ✅ Tâche 5 : Migrer chantiers.handlers.ts

**Fichier** : `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/chantiers/chantiers.handlers.ts`

**Étape 1** : Ajouter import
```typescript
import { CHANTIER, STATUS, ACTIONS } from "../../constants/emojis.js";
```

**Étape 2** : Chercher et remplacer tous les emojis hardcodés

**Emojis à remplacer (scan du fichier)** :
- `🏗️` → `CHANTIER.ICON`
- `❌` → `STATUS.ERROR`
- `✅` → `STATUS.SUCCESS`
- `📊` → `STATUS.STATS`
- `💀` → `HUNGER.DEAD` (si présent)
- `🎉` → `CHANTIER.CELEBRATION`
- `📋` → Vérifier contexte (peut-être `RESOURCES.LIST` ou `CHARACTER.PROFILE`)

**⚠️ IMPORTANT** : Scan le fichier ligne par ligne et remplace TOUS les emojis hardcodés

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Migrate chantiers.handlers.ts to centralized emojis

- Import CHANTIER, STATUS, ACTIONS constants
- Replace all hardcoded emojis with constants
- Complete Phase 2 emoji migration"
```

---

## 📊 RAPPORT FINAL

À la fin, fournis un rapport avec :

### Métriques
- ✅ Fichiers migrés : 3 (text-formatters, users.handlers, chantiers.handlers)
- ✅ Imports ajoutés : [nombre]
- ✅ Emojis remplacés : [nombre total]
- ✅ Builds réussis : [nombre]
- ✅ Commits créés : [nombre]

### Détails par fichier
**text-formatters.ts** :
- Emojis remplacés : 11
- Status : ✅ SUCCÈS / ❌ ÉCHEC

**users.handlers.ts** :
- Emojis remplacés : [nombre]
- Status : ✅ SUCCÈS / ❌ ÉCHEC

**chantiers.handlers.ts** :
- Emojis remplacés : [nombre]
- Status : ✅ SUCCÈS / ❌ ÉCHEC

### Statut Final
- ✅ Build final : SUCCÈS / ÉCHEC
- ✅ Aucune erreur TypeScript
- ✅ Tous les emojis centralisés

### Problèmes rencontrés
- [Liste des problèmes éventuels]

### Bénéfices
- ✅ Single source of truth pour les emojis
- ✅ Changement global possible en 1 fichier
- ✅ Meilleure maintenabilité
- ✅ Autocomplete TypeScript sur les emojis

---

**Créé le** : 2025-10-08
**Objectif** : Centraliser les emojis dans les fichiers prioritaires
**Économie** : ~3000 tokens vs exécution manuelle

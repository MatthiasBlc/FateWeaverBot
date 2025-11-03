# SUPERNOVA TASK: Centralisation Emojis - Fichiers Features

**Date**: 2025-11-03
**Type**: Refactorisation automatisée
**Priorité**: Moyenne
**Durée estimée**: 1-2h

---

## 🎯 Objectif

Centraliser **TOUS** les emojis hardcodés restants dans les 46 fichiers features en les remplaçant par des imports depuis `/shared/constants/emojis.ts`.

---

## 📋 Liste des Fichiers à Traiter (46 fichiers)

### Admin Features (14 fichiers)
- `/bot/src/features/admin/character-admin.handlers.ts`
- `/bot/src/features/admin/character-admin/character-objects.ts`
- `/bot/src/features/admin/character-admin/character-skills.ts`
- `/bot/src/features/admin/character-admin/character-stats.ts`
- `/bot/src/features/admin/character-admin/character-capabilities.ts`
- `/bot/src/features/admin/character-admin/character-select.ts`
- `/bot/src/features/admin/projects-admin/project-add.ts`
- `/bot/src/features/admin/projects-admin/project-delete.ts`
- `/bot/src/features/admin/projects-admin/project-display.ts`
- `/bot/src/features/admin/projects-admin/project-edit.ts`
- `/bot/src/features/admin/stock-admin/stock-add.ts`
- `/bot/src/features/admin/stock-admin/stock-display.ts`
- `/bot/src/features/admin/stock-admin/stock-remove.ts`
- `/bot/src/features/admin/expedition-admin.handlers.ts`
- `/bot/src/features/admin/expedition-admin-resource-handlers.ts`
- `/bot/src/features/admin/emoji-admin.handlers.ts`
- `/bot/src/features/admin/element-skill-admin.handlers.ts`
- `/bot/src/features/admin/element-resource-admin.handlers.ts`
- `/bot/src/features/admin/element-object-admin.handlers.ts`
- `/bot/src/features/admin/element-capability-admin.handlers.ts`
- `/bot/src/features/admin/new-element-admin.handlers.ts`

### Expedition Features (8 fichiers)
- `/bot/src/features/expeditions/handlers/expedition-display.ts`
- `/bot/src/features/expeditions/handlers/expedition-emergency.ts`
- `/bot/src/features/expeditions/handlers/expedition-create-resources.ts`
- `/bot/src/features/expeditions/handlers/expedition-create.ts`
- `/bot/src/features/expeditions/handlers/expedition-leave.ts`
- `/bot/src/features/expeditions/handlers/expedition-join.ts`
- `/bot/src/features/expeditions/handlers/expedition-resource-management.ts`
- `/bot/src/features/expeditions/handlers/expedition-transfer.ts`

### User Features (10 fichiers)
- `/bot/src/features/users/users.handlers.ts`
- `/bot/src/features/users/give-object.handlers.ts`
- `/bot/src/features/users/auspice.handlers.ts`
- `/bot/src/features/users/cartography.handlers.ts`
- `/bot/src/features/users/researching.handlers.ts`
- `/bot/src/features/users/cooking.handlers.ts`
- `/bot/src/features/users/healing.handlers.ts`
- `/bot/src/features/users/fishing.handlers.ts`

### Project Features (4 fichiers)
- `/bot/src/features/projects/projects.handlers.ts`
- `/bot/src/features/projects/project-creation.ts`

### Chantier Features (2 fichiers)
- `/bot/src/features/chantiers/chantiers.handlers.ts`
- `/bot/src/features/chantiers/chantier-creation.ts`

### Stock Features (1 fichier)
- `/bot/src/features/stock/stock.handlers.ts`

### Help Features (1 fichier)
- `/bot/src/features/help/help.handlers.ts`

### Hunger Features (2 fichiers)
- `/bot/src/features/hunger/hunger.handlers.ts`
- `/bot/src/features/hunger/eat-more.handlers.ts`

### Config Features (1 fichier)
- `/bot/src/features/config/config.handlers.ts`

### Utils (3 fichiers)
- `/bot/src/utils/channels.ts`
- `/bot/src/utils/embeds.ts`
- `/bot/src/utils/character-validation.ts`
- `/bot/src/utils/discord-components.ts`
- `/bot/src/utils/roles.ts`
- `/bot/src/utils/admin.ts`

---

## ✅ Exemples de Patterns à Remplacer

### Pattern 1: Emojis en dur dans les strings
```typescript
// AVANT
content: "❌ Erreur lors de l'opération"
logger.info("✅ Opération réussie")

// APRÈS
import { STATUS } from "../../constants/emojis.js";
content: `${STATUS.ERROR} Erreur lors de l'opération`
logger.info(`${STATUS.SUCCESS} Opération réussie`)
```

### Pattern 2: Emojis dans les embeds
```typescript
// AVANT
embed: {
  title: "🎉 Félicitations !",
  description: "⚠️ Attention"
}

// APRÈS
import { CHANTIER, SYSTEM } from "../../constants/emojis.js";
embed: {
  title: `${CHANTIER.CELEBRATION} Félicitations !`,
  description: `${SYSTEM.WARNING} Attention`
}
```

### Pattern 3: Emojis dans les logs
```typescript
// AVANT
logger.info("🔍 Recherche en cours...")

// APRÈS
import { SYSTEM } from "../../constants/emojis.js";
logger.info(`${SYSTEM.SEARCH} Recherche en cours...`)
```

---

## 📚 Constantes Disponibles

Référence : `/shared/constants/emojis.ts`

### STATUS
- `STATUS.SUCCESS` → ✅
- `STATUS.ERROR` → ❌
- `STATUS.WARNING` → ⚠️
- `STATUS.INFO` → ℹ️
- `STATUS.STATS` → 📊

### SYSTEM
- `SYSTEM.WARNING` → ⚠️
- `SYSTEM.SPARKLES` → ✨
- `SYSTEM.FORWARD` → ⏩
- `SYSTEM.SEARCH` → 🔍
- `SYSTEM.INBOX` → 📥
- `SYSTEM.PLUS` → ➕
- `SYSTEM.REFRESH` → 🔄
- `SYSTEM.TRASH` → 🗑️
- `SYSTEM.CHART` → 📊
- `SYSTEM.ROCKET` → 🚀
- `SYSTEM.BULB` → 💡

### CHARACTER
- `CHARACTER.HP_FULL` → ❤️
- `CHARACTER.MP_FULL` → 💜
- `CHARACTER.PA` → ⚡
- `CHARACTER.PROFILE` → 📋

### HUNGER
- `HUNGER.DEAD` → 💀
- `HUNGER.STARVATION` → 😫
- `HUNGER.FED` → 😊
- `HUNGER.ICON` → 🍞

### CHANTIER
- `CHANTIER.PLAN` → 📝
- `CHANTIER.IN_PROGRESS` → 🚧
- `CHANTIER.COMPLETED` → ✅
- `CHANTIER.ICON` → 🛖
- `CHANTIER.CELEBRATION` → 🎉

### PROJECT
- `PROJECT.ACTIVE` → 🔧
- `PROJECT.COMPLETED` → ✅
- `PROJECT.ICON` → 🛠️
- `PROJECT.CELEBRATION` → 🎉

### EXPEDITION
- `EXPEDITION.PLANNING` → 📝
- `EXPEDITION.ICON` → 🧭
- `EXPEDITION.DURATION` → ⌛
- `EXPEDITION.LOCATION` → 📍

### CAPABILITIES
- `CAPABILITIES.HUNT` → 🏹
- `CAPABILITIES.GATHER` → 🌿
- `CAPABILITIES.FISH` → 🎣
- `CAPABILITIES.CHOPPING` → 🪓
- `CAPABILITIES.MINING` → ⛏️
- `CAPABILITIES.WEAVING` → 🧵
- `CAPABILITIES.FORGING` → 🔨
- `CAPABILITIES.WOODWORKING` → 🪚
- `CAPABILITIES.COOKING` → 🫕
- `CAPABILITIES.HEALING` → ⚕️
- `CAPABILITIES.RESEARCHING` → 🔎
- `CAPABILITIES.CARTOGRAPHING` → 🗺️
- `CAPABILITIES.AUGURING` → 🌦️

### RESOURCES
- `RESOURCES.GENERIC` → 📦
- `RESOURCES.FOOD` → 🌾
- `RESOURCES.WOOD` → 🪵
- `RESOURCES.MINERAL` → ⚙️
- `RESOURCES_EXTENDED.FORK_KNIFE` → 🍴

### ACTIONS
- `ACTIONS.ADD` → ➕
- `ACTIONS.REMOVE` → ➖

---

## 🔧 Instructions d'Exécution

### Étape 1: Analyse
Pour chaque fichier:
1. Utiliser grep pour trouver tous les emojis hardcodés
2. Identifier le contexte d'usage (error, success, info, etc.)
3. Mapper à la constante appropriée

### Étape 2: Modification
1. **Ajouter l'import** en haut du fichier si absent:
   ```typescript
   import { STATUS, SYSTEM, CHARACTER } from "../../constants/emojis.js";
   // Ajuster le chemin relatif selon la profondeur du fichier
   ```

2. **Remplacer tous les emojis** par interpolation:
   - Changer `"emoji texte"` en backticks: `` `${CONST.EMOJI} texte` ``
   - Utiliser `replace_all: true` dans l'outil Edit

3. **Vérifier les chemins d'import**:
   - `/bot/src/features/admin/*.ts` → `../../constants/emojis.js`
   - `/bot/src/features/users/*.ts` → `../../constants/emojis.js`
   - `/bot/src/utils/*.ts` → `../constants/emojis.js`

### Étape 3: Validation
Après chaque lot de 5-10 fichiers:
1. Exécuter `npm run build` depuis `/bot`
2. Vérifier qu'il n'y a pas d'erreurs TypeScript
3. Continuer avec le lot suivant

---

## 🎯 Critères de Succès

### Obligatoires
- [ ] **0 emojis hardcodés** dans les 46 fichiers (vérifier avec grep)
- [ ] **Build TypeScript passe** sans erreurs
- [ ] **Tous les imports** utilisent les chemins relatifs corrects

### Nice-to-have
- [ ] Grouper les imports par catégorie (STATUS, SYSTEM, etc.)
- [ ] Supprimer les imports inutilisés

---

## 📊 Métriques Attendues

- **Fichiers traités**: 46/46
- **Emojis centralisés**: ~200-300 occurrences
- **Token savings**: ~300-400 tokens
- **Durée d'exécution**: 1-2h

---

## ⚠️ Points d'Attention

1. **Ne PAS toucher**:
   - Les emojis dans les commentaires (optionnel de les nettoyer)
   - Les emojis dans les tests (si présents)

2. **Chemins relatifs**:
   - Vérifier la profondeur du fichier pour ajuster `../../` vs `../`
   - Toujours utiliser `.js` à la fin (pas `.ts`)

3. **Build cassé?**:
   - Vérifier les imports manquants
   - Vérifier les backticks vs quotes
   - Vérifier les constantes qui n'existent pas

---

## 📝 Format du Rapport

À la fin de la tâche, créer `/docs/RefactorisationBot/report-supernova-emoji-features.md` avec:

### Section 1: Résumé Exécutif (≤300 tokens)

```markdown
# Rapport Supernova - Centralisation Emojis Features

**Statut**: ✅ Complété / ⚠️ Partiel / ❌ Échec
**Date**: 2025-11-03

## Résumé
- **Fichiers traités**: X/46
- **Emojis centralisés**: X occurrences
- **Build status**: ✅/❌
- **Token savings**: ~X tokens

## Problèmes rencontrés
[Liste des problèmes majeurs, si applicable]

## Fichiers non traités
[Liste avec raison, si applicable]
```

### Section 2: Détails (optionnel)
- Liste complète des fichiers modifiés
- Statistiques par catégorie (admin, users, expeditions, etc.)
- Erreurs de build résolues

---

## 🚀 Mini-Prompt pour Exécution

```
Lis .supernova/prompt-emoji-centralization-features.md et exécute la tâche.
Crée le rapport final dans /docs/RefactorisationBot/report-supernova-emoji-features.md
avec un résumé ≤300 tokens en première section.
```

---

**Créé par**: Claude Code (Session 2025-11-03)
**Basé sur**: `/docs/RefactorisationBot/action-items.md` Phase 1.1

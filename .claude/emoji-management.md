# 🎨 Système de gestion des emojis

## 📍 Localisation

**Fichier central** : `shared/constants/emojis.ts`

Tous les emojis utilisés dans le projet (bot + backend) **DOIVENT** être centralisés dans ce fichier unique.

---

## 🔒 Règles strictes

### 1. Centralisation obligatoire
- ❌ **INTERDIT** : Emojis hardcodés directement dans le code (`"🎉"`, `"✅"`, etc.)
- ✅ **OBLIGATOIRE** : Import depuis `@shared/constants/emojis`

```typescript
// ❌ INTERDIT
const message = "🎉 Félicitations !";

// ✅ CORRECT
import { CHANTIER } from "@shared/constants/emojis";
const message = `${CHANTIER.CELEBRATION} Félicitations !`;
```

### 2. Documentation obligatoire de TOUS les emojis

Chaque emoji dans `shared/constants/emojis.ts` **DOIT** avoir un commentaire précisant :
- ✅ **Où il est utilisé** (nom du fichier + contexte)
- ❌ **S'il est inutilisé** (commenté avec raison)

#### Format pour emojis actifs :
```typescript
export const CHANTIER = {
  CELEBRATION: "🎉", // Used in chantiers.handlers.ts for completion celebration
  ICON: "🛖", // Used for chantier section header
} as const;
```

#### Format pour emojis inutilisés :
```typescript
export const SEASON = {
  // SUMMER: "☀️", // UNUSED - reserved for future feature
  // WINTER: "❄️", // UNUSED - deprecated
} as const;
```

### 3. Vérification avant modifications

Avant de modifier `shared/constants/emojis.ts` :
1. **Rechercher l'usage** : Utiliser grep/Task tool pour trouver où l'emoji est utilisé
2. **Documenter** : Ajouter/mettre à jour le commentaire avec le contexte exact
3. **Tester** : Toujours compiler après modification (`npm run build`)

---

## 🏗️ Structure du fichier

Le fichier est organisé par **groupes fonctionnels** :

```typescript
// UI Elements - Navigation et interface
export const UI = { ... } as const;

// System & Admin - Système et administration
export const SYSTEM = { ... } as const;

// Status & Feedback - Statuts et retours utilisateur
export const STATUS = { ... } as const;

// Character Stats - Statistiques de personnage
export const CHARACTER = { ... } as const;

// Hunger Levels - Niveaux de faim
export const HUNGER = { ... } as const;

// Actions - Actions utilisateur
export const ACTIONS = { ... } as const;

// Capabilities - Compétences/capacités
export const CAPABILITIES = { ... } as const;

// Expeditions - Système d'expéditions
export const EXPEDITION = { ... } as const;

// Chantiers - Système de chantiers
export const CHANTIER = { ... } as const;

// Projects (Artisanat) - Système de projets
export const PROJECT = { ... } as const;

// Locations - Localisations
export const LOCATION = { ... } as const;

// Resources - Ressources
export const RESOURCES = { ... } as const;

// Config & UI - Configuration interface
export const CONFIG = { ... } as const;

// Directions (for expeditions) - Directions cardinales
export const DIRECTION = { ... } as const;
```

---

## 🔄 Workflow pour ajouter un nouvel emoji

### Étape 1 : Identifier le besoin
```bash
# Rechercher si l'emoji existe déjà
grep -r "🎯" shared/constants/emojis.ts
```

### Étape 2 : Ajouter au fichier central
```typescript
export const SYSTEM = {
  TARGET: "🎯", // Used in new-feature.ts for targeting system
  // ... autres emojis
} as const;
```

### Étape 3 : Importer et utiliser
```typescript
import { SYSTEM } from "@shared/constants/emojis";

function displayTarget() {
  console.log(`${SYSTEM.TARGET} Cible acquise !`);
}
```

### Étape 4 : Vérifier la compilation
```bash
cd bot && npm run build
cd ../backend && npx tsc --noEmit
```

---

## 🧹 Maintenance du fichier

### Identifier les emojis inutilisés

Pour trouver les emojis qui ne sont plus utilisés :

1. **Rechercher l'usage dans le codebase** :
```bash
# Exemple pour CHARACTER.PERSON
grep -r "CHARACTER.PERSON" bot/src/ backend/src/
```

2. **Si aucun résultat** : Commenter l'emoji avec raison
```typescript
// PERSON: "👤", // UNUSED - feature removed in v2.0
```

3. **Créer une liste de nettoyage** : Regrouper les emojis commentés pour décision future

### Auditer les emojis hardcodés

Recherche régulière des emojis hardcodés dans le code :
```bash
# Rechercher des emojis dans les fichiers TypeScript
# (nécessite un outil comme Task agent avec pattern matching)
```

---

## 📊 Statistiques actuelles

**Dernière mise à jour** : 2025-10-20

- **Total d'emojis définis** : ~180
- **Emojis actifs** : ~85 (47%)
- **Emojis commentés** : ~95 (53%)

**Groupes complètement inutilisés** (candidats à suppression) :
- UI (6 emojis)
- ADMIN (5 emojis)
- SEASON (3 emojis)

---

## ⚠️ Erreurs courantes à éviter

### ❌ Emoji hardcodé
```typescript
// MAUVAIS
embed.setTitle("🎉 Félicitations !");
```

### ✅ Emoji centralisé
```typescript
// BON
import { PROJECT } from "@shared/constants/emojis";
embed.setTitle(`${PROJECT.CELEBRATION} Félicitations !`);
```

### ❌ Emoji non documenté
```typescript
// MAUVAIS
export const PROJECT = {
  CELEBRATION: "🎉",
} as const;
```

### ✅ Emoji documenté
```typescript
// BON
export const PROJECT = {
  CELEBRATION: "🎉", // Used in projects.handlers.ts for completion celebration
} as const;
```

---

## 🎯 Objectifs

1. **100% de centralisation** : Aucun emoji hardcodé dans le code
2. **100% de documentation** : Chaque emoji a un commentaire explicatif
3. **Maintenance régulière** : Nettoyage trimestriel des emojis inutilisés

---

## 📚 Références

- Fichier central : `shared/constants/emojis.ts`
- Documentation projet : `CLAUDE.md`
- Historique refactoring : Session 2025-10-20

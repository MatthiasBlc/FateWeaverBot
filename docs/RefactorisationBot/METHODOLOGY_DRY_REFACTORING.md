# Méthodologie de Refactorisation Propre (DRY)

**Date de création**: 2025-11-03
**Adoptée à partir de**: `projects.handlers.ts` (Phase 4.4)

---

## Principe

Cette méthodologie garantit une refactorisation **professionnelle** qui respecte les principes fondamentaux du clean code :
- **DRY (Don't Repeat Yourself)**: Zéro duplication de code
- **SRP (Single Responsibility Principle)**: Chaque module a une seule responsabilité
- **Maintenabilité**: Code modulaire et facile à comprendre

---

## Les 5 Étapes

### 1. Analyse

**Objectif**: Comprendre le fichier monolithique à refactoriser

**Actions**:
- Lire le fichier complet
- Identifier les **fonctions helper** dupliquées ou réutilisables
- Identifier les **interfaces/types** communs
- Identifier les **responsabilités métier** distinctes (handlers)

**Exemple (projects.handlers.ts)**:
```typescript
// Helpers identifiés (dupliqués 5x dans le fichier original):
- normalizeCapabilities()
- getProjectOutputText()
- formatRewardMessage()

// Interfaces communes (dupliquées 5x):
- Town
- ActiveCharacter
- Capability

// Handlers distincts (5 responsabilités):
- handleProjectsCommand (affichage liste)
- handleParticipateButton (participation projets)
- handleBlueprintParticipateButton (participation blueprints)
- handleInvestModalSubmit (soumission modal)
- handleViewProjectsFromProfile (vue depuis profil)
```

---

### 2. Extraction DRY

**Objectif**: Créer les fichiers de code partagé (zéro duplication)

**Actions**:
1. Créer `*-common.ts` pour les **interfaces et types** partagés
2. Créer `*-helpers.ts` pour les **fonctions utilitaires** réutilisables

**Structure**:
```
handlers/
├── projects-common.ts      # Interfaces: Town, ActiveCharacter, Capability
├── projects-helpers.ts     # Helpers: normalize, format, calculate
```

**Exemple (projects-common.ts)**:
```typescript
/**
 * Types et interfaces communes pour le module projects
 */

export interface Town {
  id: string;
  name: string;
}

export interface ActiveCharacter {
  id: string;
  paTotal: number;
  name: string;
  townId: string;
  isDead?: boolean;
}
```

**Exemple (projects-helpers.ts)**:
```typescript
/**
 * Fonctions utilitaires réutilisables pour le module projects
 */

import type { Project } from "../projects.types.js";
import type { Capability } from "./projects-common.js";

export function normalizeCapabilities(raw: any[]): Capability[] {
  // Implémentation UNE SEULE FOIS
}

export function getProjectOutputText(project: Project): string {
  // Implémentation UNE SEULE FOIS
}
```

---

### 3. Division Métier

**Objectif**: Créer des handlers spécialisés qui IMPORTENT les helpers

**Actions**:
1. Créer un fichier par responsabilité métier
2. Chaque handler importe depuis `*-common.ts` et `*-helpers.ts`
3. Chaque handler contient UNIQUEMENT sa logique métier spécifique

**Structure**:
```
handlers/
├── projects-common.ts           # Partagé
├── projects-helpers.ts          # Partagé
├── projects-display.ts          # Handler 1: Affichage
├── projects-participate.ts      # Handler 2: Participation projets
├── projects-blueprint.ts        # Handler 3: Participation blueprints
├── projects-invest.ts           # Handler 4: Soumission modal
├── projects-view.ts             # Handler 5: Vue profil
└── index.ts                     # Barrel exports
```

**Exemple (projects-display.ts)**:
```typescript
/**
 * Handler pour l'affichage de la liste des projets artisanaux
 */

import { /* Discord imports */ } from "discord.js";
import { apiService } from "../../../services/api/index.js";
import { STATUS } from "../../../constants/emojis.js";

// ✅ IMPORT des helpers (pas de duplication)
import type { Town, ActiveCharacter } from "./projects-common.js";
import { normalizeCapabilities, getProjectOutputText } from "./projects-helpers.js";

export async function handleProjectsCommand(interaction: CommandInteraction) {
  // Logique métier spécifique à l'affichage
  const capabilities = normalizeCapabilities(rawCapabilities); // ✅ Réutilisation
  const outputText = getProjectOutputText(project); // ✅ Réutilisation
  // ...
}
```

---

### 4. Vérification

**Objectif**: S'assurer que la refactorisation est correcte

**Actions**:
1. **Build test**: `npm run build` doit passer ✅
2. **Audit de duplication**: Vérifier qu'aucun helper n'est dupliqué
   ```bash
   grep -n "function normalizeCapabilities" handlers/*.ts
   # Doit retourner UNE SEULE occurrence dans helpers.ts
   ```
3. **Audit d'interfaces**: Vérifier qu'aucune interface n'est dupliquée
   ```bash
   grep -n "interface Town" handlers/*.ts
   # Doit retourner UNE SEULE occurrence dans common.ts
   ```

**Checklist de vérification**:
- [ ] Build passe sans erreurs TypeScript
- [ ] Aucune fonction helper dupliquée (grep vérifié)
- [ ] Aucune interface dupliquée (grep vérifié)
- [ ] Chaque handler a une responsabilité claire
- [ ] Barrel export (`index.ts`) créé

---

### 5. Documentation

**Objectif**: Tracer la refactorisation pour référence future

**Actions**:
1. Mettre à jour `CURRENT_STATUS.md`
2. Noter les métriques (lignes avant/après, nombre de fichiers)
3. Documenter la structure créée
4. Indiquer si la méthode DRY a été respectée

**Exemple d'entrée dans CURRENT_STATUS.md**:
```markdown
4. ✅ **projects.handlers.ts** (1,512 lines → 8 files, 1,618 lines total)
   - Structure: `handlers/{common,helpers,display,participate,blueprint,invest,view}.ts` + `index.ts`
   - **Méthode: Refactorisation propre avec extraction DRY** ⭐
   - **Duplication de code**: ✅ ZÉRO (vérifié)
   - **Principe DRY**: ✅ Respecté
   - **SRP**: ✅ Chaque fichier = 1 responsabilité claire
   - Build: ✅ Passing
   - Augmentation: +106 lignes (+7%) due aux imports spécialisés et séparation propre
```

---

## Comparaison: Mauvaise vs Bonne Méthode

### ❌ Mauvaise Méthode (Découpe Mécanique)

**Approche**: Découper le fichier toutes les X lignes

```typescript
// projects-display.ts (lignes 0-400)
interface Town { id: string; name: string; }
interface ActiveCharacter { /* ... */ }
function normalizeCapabilities() { /* ... */ }
function getProjectOutputText() { /* ... */ }
export async function handleProjectsCommand() { /* ... */ }

// projects-participate.ts (lignes 400-800)
interface Town { id: string; name: string; }  // ❌ DUPLICATION
interface ActiveCharacter { /* ... */ }        // ❌ DUPLICATION
function normalizeCapabilities() { /* ... */ } // ❌ DUPLICATION
function getProjectOutputText() { /* ... */ }  // ❌ DUPLICATION
export async function handleParticipateButton() { /* ... */ }
```

**Problèmes**:
- ❌ Code dupliqué dans chaque fichier
- ❌ Maintenance difficile (bug fix = modifier N fichiers)
- ❌ Augmentation massive du nombre de lignes
- ❌ Violation du principe DRY

---

### ✅ Bonne Méthode (Extraction DRY)

**Approche**: Extraire le code partagé, diviser par responsabilité

```typescript
// projects-common.ts (interfaces PARTAGÉES)
export interface Town { id: string; name: string; }
export interface ActiveCharacter { /* ... */ }

// projects-helpers.ts (helpers PARTAGÉS)
export function normalizeCapabilities() { /* ... */ }
export function getProjectOutputText() { /* ... */ }

// projects-display.ts (handler SPÉCIALISÉ)
import type { Town, ActiveCharacter } from "./projects-common.js";
import { normalizeCapabilities, getProjectOutputText } from "./projects-helpers.js";

export async function handleProjectsCommand() {
  // ✅ Réutilisation, pas de duplication
  const capabilities = normalizeCapabilities(rawData);
  const output = getProjectOutputText(project);
}

// projects-participate.ts (handler SPÉCIALISÉ)
import type { Town, ActiveCharacter } from "./projects-common.js";
import { normalizeCapabilities } from "./projects-helpers.js";

export async function handleParticipateButton() {
  // ✅ Réutilisation, pas de duplication
  const capabilities = normalizeCapabilities(rawData);
}
```

**Avantages**:
- ✅ Zéro duplication de code
- ✅ Maintenance facile (bug fix = modifier 1 seul fichier)
- ✅ Augmentation minimale des lignes (~7% pour imports spécialisés)
- ✅ Respect du principe DRY
- ✅ Code modulaire et testable

---

## Résultats Attendus

**Avec cette méthode**, chaque refactorisation doit aboutir à :

1. **Zéro duplication** (vérifié par grep)
2. **Modules spécialisés** (1 responsabilité = 1 fichier)
3. **Build qui passe** (TypeScript sans erreurs)
4. **Augmentation raisonnable** (~5-10% de lignes pour imports)
5. **Maintenabilité améliorée** (modifications localisées)

---

## Cas d'Application

Cette méthodologie s'applique à **tous les mega-handlers** contenant :
- Des fonctions helper dupliquées
- Des interfaces/types répétés
- Plusieurs responsabilités métier dans un seul fichier

**Exemples dans le projet**:
- ✅ `projects.handlers.ts` (1,512 lignes → 8 fichiers)
- 🔄 `chantiers.handlers.ts` (1,263 lignes) - À faire
- ⏸️ `users.handlers.ts` (1,328 lignes) - Nécessite refactorisation logique supplémentaire

---

## Annexe: Commandes Utiles

### Vérifier duplication de fonctions
```bash
grep -n "^function functionName\|^export function functionName" handlers/*.ts
```

### Vérifier duplication d'interfaces
```bash
grep -n "^interface InterfaceName\|^export interface InterfaceName" handlers/*.ts
```

### Compter lignes avant/après
```bash
wc -l original-file.ts
wc -l handlers/*.ts
```

### Build test
```bash
npm run build
```

---

**Conclusion**: Cette méthodologie garantit une refactorisation **professionnelle** qui améliore réellement la qualité du code, au lieu de simplement le diviser mécaniquement.

# 🚀 Prompt pour Code Supernova - Phase 3 Refactoring

**Mission : Extraction de la Logique Métier Dupliquée**
**Équipe : Claude Code (planning/validation) + Supernova (exécution) + Utilisateur (oversight)**

---

## 🎯 Objectif de la Mission

Créer 3 fichiers utilitaires pour éliminer la duplication de code dans la logique métier :
- ✅ Validations de personnages (répétées 100+ fois)
- ✅ Helpers d'interaction (206+ flags ephemeral)
- ✅ Formatage de texte (50+ occurrences)

**Résultat attendu :**
```
utils/
├── character-validation.ts  (~100 lignes) - 4 fonctions
├── interaction-helpers.ts    (~150 lignes) - 5 fonctions
└── text-formatters.ts        (~100 lignes) - 5 fonctions

Migration dans 15+ fichiers
Réduction : ~300-400 lignes
```

---

## 📋 Infrastructure Existante

✅ **Fichiers utils déjà créés :**
- `utils/embeds.ts` - Embeds centralisés
- `utils/discord-components.ts` - Composants Discord
- `utils/character.ts` - getActiveCharacterFromCommand(), etc.

---

## 🔄 Workflow Requis

**⚠️ IMPORTANT : Toutes les commandes npm doivent être exécutées dans le dossier `bot/` !**

**Pour CHAQUE fichier utils créé :**
1. ✅ Créer le fichier avec les fonctions
2. ✅ **TESTER : `cd bot && npm run build`**
3. ✅ Si OK → passer au suivant
4. ❌ Si erreur → STOP et documenter

**Après TOUS les utils créés :**
1. ✅ Migrer les usages dans les fichiers feature
2. ✅ Tester après CHAQUE fichier migré
3. ✅ Commit final

---

## 📦 Étape 1: character-validation.ts (~100 lignes)

**Fichier à créer :** `bot/src/utils/character-validation.ts`

### Contenu Complet

```typescript
import type { Character } from "../types/entities";

/**
 * Messages d'erreur standardisés pour les validations de personnage
 */
export const CHARACTER_ERRORS = {
  NO_CHARACTER: "❌ Aucun personnage actif trouvé.",
  DEAD_CHARACTER: "❌ Un mort ne peut pas effectuer cette action.",
  NO_LIVING_CHARACTER: "❌ Aucun personnage vivant trouvé. Utilisez d'abord la commande `/start` pour créer un personnage.",
  NO_TOWN: "❌ Ville de votre personnage introuvable.",
  NO_PERMISSION: "❌ Vous n'avez pas la permission d'effectuer cette action.",
} as const;

/**
 * Valide qu'un personnage existe
 * @throws Error avec message si validation échoue
 */
export function validateCharacterExists(character: Character | null | undefined): asserts character is Character {
  if (!character) {
    throw new Error(CHARACTER_ERRORS.NO_CHARACTER);
  }
}

/**
 * Valide qu'un personnage existe et est vivant
 * @throws Error avec message si validation échoue
 */
export function validateCharacterAlive(character: Character | null | undefined): asserts character is Character {
  validateCharacterExists(character);

  if (character.isDead) {
    throw new Error(CHARACTER_ERRORS.DEAD_CHARACTER);
  }
}

/**
 * Valide qu'un personnage a une ville
 * @throws Error avec message si validation échoue
 */
export function validateCharacterHasTown(character: Character): void {
  if (!character.townId) {
    throw new Error(CHARACTER_ERRORS.NO_TOWN);
  }
}

/**
 * Valide toutes les conditions de base (existe, vivant, a une ville)
 * @throws Error avec message si validation échoue
 */
export function validateCharacterReady(character: Character | null | undefined): asserts character is Character {
  validateCharacterAlive(character);
  validateCharacterHasTown(character);
}

/**
 * Vérifie si un personnage peut effectuer une action (non null et vivant)
 * @returns true si le personnage peut agir, false sinon
 */
export function canCharacterAct(character: Character | null | undefined): character is Character {
  return character !== null && character !== undefined && !character.isDead;
}

/**
 * Vérifie si un personnage est mort
 */
export function isCharacterDead(character: Character | null | undefined): boolean {
  return character?.isDead ?? false;
}
```

### Vérification
```bash
cd bot && npm run build
```

---

## 📦 Étape 2: interaction-helpers.ts (~150 lignes)

**Fichier à créer :** `bot/src/utils/interaction-helpers.ts`

### Contenu Complet

```typescript
import type {
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  InteractionReplyOptions,
  InteractionUpdateOptions,
} from "discord.js";
import { createErrorEmbed, createSuccessEmbed, createInfoEmbed } from "./embeds";

/**
 * Type union pour tous les types d'interactions
 */
export type AnyInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction
  | StringSelectMenuInteraction;

/**
 * Options pour les réponses éphémères
 */
interface EphemeralReplyOptions {
  content?: string;
  embed?: any;
}

/**
 * Répond à une interaction avec un message d'erreur éphémère
 */
export async function replyError(
  interaction: AnyInteraction,
  message: string,
  details?: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    embeds: [createErrorEmbed(message, details)],
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Répond à une interaction avec un message de succès éphémère
 */
export async function replySuccess(
  interaction: AnyInteraction,
  title: string,
  description?: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    embeds: [createSuccessEmbed(title, description)],
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Répond à une interaction avec un message d'info éphémère
 */
export async function replyInfo(
  interaction: AnyInteraction,
  title: string,
  description?: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    embeds: [createInfoEmbed(title, description)],
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Répond avec un simple message texte éphémère
 */
export async function replyEphemeral(
  interaction: AnyInteraction,
  content: string
): Promise<void> {
  const replyOptions: InteractionReplyOptions = {
    content,
    flags: ["Ephemeral"],
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

/**
 * Defer une interaction puis exécute une fonction
 * Utile pour les opérations longues
 */
export async function deferAndExecute<T>(
  interaction: AnyInteraction,
  executor: () => Promise<T>,
  options?: { ephemeral?: boolean }
): Promise<T> {
  await interaction.deferReply({
    flags: options?.ephemeral ? ["Ephemeral"] : undefined,
  });

  return await executor();
}

/**
 * Gère une erreur dans une interaction de manière standardisée
 */
export async function handleInteractionError(
  interaction: AnyInteraction,
  error: unknown,
  context: string
): Promise<void> {
  const errorMessage =
    error instanceof Error ? error.message : "Une erreur inconnue s'est produite";

  await replyError(
    interaction,
    "Une erreur s'est produite",
    `${context}: ${errorMessage}`
  );
}
```

### Vérification
```bash
cd bot && npm run build
```

---

## 📦 Étape 3: text-formatters.ts (~100 lignes)

**Fichier à créer :** `bot/src/utils/text-formatters.ts`

### Contenu Complet

```typescript
import type { Character } from "../types/entities";

/**
 * Formate les statistiques d'un personnage pour affichage
 */
export function formatCharacterStats(character: Character): string {
  const lines = [
    `❤️ **PV:** ${character.hp}/${character.hpMax}`,
    `⚡ **PM:** ${character.pm}/${character.pmMax}`,
    `🎯 **PA:** ${character.paTotal}/4`,
  ];

  if (character.hungerLevel !== undefined) {
    lines.push(`🍖 **Faim:** ${getHungerLevelText(character.hungerLevel)}`);
  }

  return lines.join("\n");
}

/**
 * Retourne le texte correspondant au niveau de faim
 */
function getHungerLevelText(hungerLevel: number): string {
  switch (hungerLevel) {
    case 0:
      return "💀 Mort de faim";
    case 1:
      return "😰 Agonisant";
    case 2:
      return "😟 Affamé";
    case 3:
      return "😐 Faim";
    case 4:
      return "😊 Rassasié";
    default:
      return "❓ Inconnu";
  }
}

/**
 * Formate une liste de ressources
 */
export function formatResourceList(resources: Array<{ name: string; quantity: number; emoji?: string }>): string {
  if (resources.length === 0) {
    return "Aucune ressource";
  }

  return resources
    .map((r) => `${r.emoji || "📦"} **${r.name}**: ${r.quantity}`)
    .join("\n");
}

/**
 * Formate une durée en millisecondes en texte lisible
 */
export function formatDuration(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days}j ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
}

/**
 * Formate une liste de membres avec leur personnage
 */
export function formatMemberList(
  members: Array<{ character: { name: string; user?: { username: string } } }>
): string {
  if (members.length === 0) {
    return "Aucun membre";
  }

  return members
    .map(
      (member) =>
        `• ${member.character.name} (${member.character.user?.username || "Inconnu"})`
    )
    .join("\n");
}

/**
 * Tronque un texte à une longueur maximale
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("fr-FR");
}
```

### Vérification
```bash
cd bot && npm run build
```

---

## 🔄 Étape 4: Migration des Usages

### Fichiers Prioritaires à Migrer (Top 10)

**⚠️ Migre UN fichier à la fois et teste après chaque !**

#### 1. expedition-display.ts
```typescript
// AVANT (lignes 44-60)
if (!character) {
  await interaction.reply({
    content: "❌ Aucun personnage actif trouvé.",
    flags: ["Ephemeral"],
  });
  return;
}

if (character.isDead) {
  await interaction.reply({
    content: "❌ Un mort ne peut pas gérer les expéditions.",
    flags: ["Ephemeral"],
  });
  return;
}

// APRÈS
import { validateCharacterAlive } from "../../../utils/character-validation";
import { replyEphemeral } from "../../../utils/interaction-helpers";

try {
  validateCharacterAlive(character);
} catch (error) {
  if (error instanceof Error) {
    await replyEphemeral(interaction, error.message);
    return;
  }
  throw error;
}
```

**Vérification après migration :**
```bash
cd bot && npm run build
```

#### 2. expedition-create.ts
**Même pattern que expedition-display.ts**

#### 3. expedition-join.ts
**Même pattern que expedition-display.ts**

#### 4. expedition-leave.ts
**Même pattern que expedition-display.ts**

#### 5. expedition-transfer.ts
**Même pattern que expedition-display.ts**

#### 6. stock.handlers.ts
```typescript
// AVANT
if (!character) {
  await interaction.reply({
    content: "❌ Aucun personnage actif trouvé.",
    flags: ["Ephemeral"],
  });
  return;
}

// APRÈS
import { validateCharacterExists } from "../../utils/character-validation";
import { replyEphemeral } from "../../utils/interaction-helpers";

try {
  validateCharacterExists(character);
} catch (error) {
  if (error instanceof Error) {
    await replyEphemeral(interaction, error.message);
    return;
  }
  throw error;
}
```

#### 7-10. Autres fichiers expeditions/admin
**Appliquer les mêmes patterns**

### Pattern Général de Migration

**Pour CHAQUE fichier :**

1. **Ajouter les imports en haut :**
```typescript
import { validateCharacterAlive, validateCharacterExists } from "../../utils/character-validation";
import { replyEphemeral, replyError } from "../../utils/interaction-helpers";
import { formatCharacterStats, formatMemberList } from "../../utils/text-formatters";
```

2. **Remplacer les validations :**
```typescript
// Pattern ancien
if (!character) {
  await interaction.reply({ content: "❌ ...", flags: ["Ephemeral"] });
  return;
}

// Pattern nouveau
try {
  validateCharacterExists(character);
} catch (error) {
  if (error instanceof Error) {
    await replyEphemeral(interaction, error.message);
    return;
  }
  throw error;
}
```

3. **Remplacer les réponses éphémères :**
```typescript
// Pattern ancien
await interaction.reply({
  content: "❌ Une erreur...",
  flags: ["Ephemeral"],
});

// Pattern nouveau
await replyEphemeral(interaction, "❌ Une erreur...");
```

4. **Tester après CHAQUE fichier :**
```bash
cd bot && npm run build
```

---

## 🚨 Règles Strictes

### ✅ OBLIGATOIRE
1. **Créer les 3 utils D'ABORD** avant toute migration
2. **Tester après chaque utils créé** : `cd bot && npm run build`
3. **Migrer UN fichier à la fois**
4. **Tester après CHAQUE migration** : `cd bot && npm run build`
5. **⚠️ Toutes les commandes npm dans le dossier bot/** : `cd bot && npm run ...`
6. **Si erreur** : STOP et documente

### ❌ INTERDIT
1. Créer tous les utils et migrer tout d'un coup
2. Modifier plusieurs fichiers avant de tester
3. Continuer si le build casse
4. Changer la logique métier
5. Modifier les messages d'erreur (garder les emojis et textes)

---

## 📊 Métriques Attendues

**Avant Phase 3 :**
```bash
# Patterns répétés
grep -rn "if (!character)" src/features --include="*.ts" | wc -l
# ~100+

grep -rn 'flags: \["Ephemeral"\]' src/features --include="*.ts" | wc -l
# ~206
```

**Après Phase 3 :**
```bash
# Utilisations des utils
grep -rn "validateCharacter" src/features --include="*.ts" | wc -l
# ~50+

grep -rn "replyEphemeral\|replyError" src/features --include="*.ts" | wc -l
# ~100+
```

---

## ✅ Checklist de Finalisation

Après avoir terminé TOUTES les étapes :

- [ ] character-validation.ts créé et compile
- [ ] interaction-helpers.ts créé et compile
- [ ] text-formatters.ts créé et compile
- [ ] 10+ fichiers migrés
- [ ] Tous les fichiers compilent
- [ ] `cd bot && npm run build` ✅
- [ ] `cd bot && npm run lint` ✅
- [ ] Commit créé

---

## 📝 Rapport Final à Générer

```markdown
# Phase 3 - TERMINÉE ✅

## Utils créés (3)
1. ✅ character-validation.ts (~XXX lignes, 6 fonctions)
2. ✅ interaction-helpers.ts (~XXX lignes, 6 fonctions)
3. ✅ text-formatters.ts (~XXX lignes, 6 fonctions)

## Fichiers migrés
- expedition-display.ts
- expedition-create.ts
- expedition-join.ts
- [liste complète]

## Tests
- Build : ✅
- ESLint : ✅

## Métriques
- Validations dupliquées éliminées : ~XXX
- Réponses éphémères centralisées : ~XXX
- Lignes totales : XXX (réduction de ~XXX lignes)

## Problèmes
[Aucun ou liste]

## ✅ Phase 3 Milestone Atteint
Logique métier centralisée !
```

---

## 🚀 Commande de Lancement

**Copie cette commande dans Supernova :**

```
Exécute la Phase 3 du refactoring.
Suis exactement le fichier docs/supernova-prompt-phase3.md.

⚠️ IMPORTANT : Exécute toutes les commandes npm DEPUIS le dossier bot/ :
cd bot && npm run build

Ordre d'exécution :
1. Créer character-validation.ts
2. Tester
3. Créer interaction-helpers.ts
4. Tester
5. Créer text-formatters.ts
6. Tester
7. Migrer fichiers UN PAR UN (expedition-display, expedition-create, etc.)
8. Tester après CHAQUE migration
9. Commit final

Si erreur : STOP et documente.

Génère le rapport final quand tout est terminé.
```

---

**Bon courage pour cette extraction de logique, Supernova ! 🧩**

*Créé par Claude Code - Collaboration Phase 3*
*Date: 2025-10-08*

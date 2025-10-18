# 🏗️ Architecture - FateWeaverBot Discord Bot

**Date de dernière mise à jour** : 2025-10-08
**Version** : Post-refactoring Phases 1-5

---

## 📋 Vue d'Ensemble

FateWeaverBot est un bot Discord de jeu de rôle développé en TypeScript avec discord.js v14. Le bot communique avec un backend REST API (Express/Prisma) pour gérer la persistance des données.

**Technologies principales :**
- Discord.js v14 (interactions, slash commands)
- TypeScript (strict mode)
- Axios (HTTP client)
- Node.js

---

## 🗂️ Structure des Répertoires

```
bot/src/
├── commands/              # Slash commands Discord (auto-chargées)
│   ├── admin-commands/   # Commandes admin uniquement
│   └── user-commands/    # Commandes publiques
│
├── core/                 # Infrastructure core du bot
│   └── client.ts        # Client Discord principal
│
├── features/            # Organisation par fonctionnalité
│   ├── admin/           # Features admin (character, stock, expedition)
│   ├── chantiers/       # Système de chantiers communautaires
│   ├── config/          # Configuration serveur
│   ├── expeditions/     # Système d'expéditions
│   ├── foodstock/       # Gestion stock alimentaire
│   ├── help/            # Commandes d'aide
│   ├── hunger/          # Mécanique de faim
│   ├── stock/           # Gestion ressources
│   └── users/           # Profils utilisateur
│
├── modals/              # Modals Discord (création personnage, etc.)
│
├── services/            # Services métier et externes
│   ├── api/            # Client API (organisé par domaine)
│   ├── logger.ts       # Logging centralisé
│   └── httpClient.ts   # HTTP client configuré
│
├── utils/               # Utilitaires partagés
│   ├── embeds.ts       # Création embeds Discord
│   ├── discord-components.ts  # Boutons, menus
│   ├── character-validation.ts # Validations personnages
│   ├── interaction-helpers.ts  # Helpers interactions
│   ├── text-formatters.ts     # Formatage texte
│   ├── button-handler.ts      # Gestionnaire boutons
│   ├── modal-handler.ts       # Gestionnaire modals
│   └── select-menu-handler.ts # Gestionnaire menus
│
├── constants/           # Constantes partagées
│   └── errors.ts       # Messages d'erreur
│
└── index.ts            # Point d'entrée du bot
```

---

## 🎯 Principes d'Architecture

### 1. Organisation par Features

Chaque fonctionnalité majeure est isolée dans `src/features/[nom]/` avec :
- `[nom].command.ts` - Définition des commandes slash
- `[nom].handlers.ts` - Logique de traitement des interactions
- `[nom].utils.ts` - Utilitaires spécifiques (optionnel)
- `[nom].types.ts` - Types TypeScript (optionnel)

**Avantages :**
- Code modulaire et maintenable
- Facile de trouver le code lié à une feature
- Découplage entre features

### 2. Centralisation des Utilitaires

**Problème initial :** Code dupliqué dans chaque feature (embeds, validations, messages)

**Solution (Phases 1-5 refactoring) :**
- ✅ **37 embeds** dupliqués → **11 fonctions** dans `utils/embeds.ts`
- ✅ **166+ `flags: ["Ephemeral"]`** → `replyEphemeral()` dans `utils/interaction-helpers.ts`
- ✅ **100+ validations** → **7 fonctions** dans `utils/character-validation.ts`

**Résultat :** Réduction ~500-700 lignes de duplication

### 3. Séparation des Responsabilités

#### Services Layer
`src/services/` contient :
- **API Client** : Communication avec le backend (organisé par domaine métier)
- **Logger** : Logs centralisés
- **HTTP Client** : Configuration Axios

#### Utils Layer
`src/utils/` contient :
- **UI Components** : Embeds, boutons, menus Discord
- **Validation** : Vérifications métier (personnages, etc.)
- **Formatters** : Formatage texte, nombres, durées
- **Interaction Helpers** : Réponses Discord standardisées
- **Handlers** : Gestion centralisée boutons/modals/menus

#### Features Layer
`src/features/` contient :
- Logique métier spécifique à chaque feature
- Commandes slash Discord
- Handlers d'interactions

---

## 📦 Modules Clés

### 1. Système de Commandes (Auto-loading)

**Emplacement :** `src/commands/`

Les commandes sont automatiquement chargées au démarrage :
```typescript
// bot/src/index.ts
const commandsPath = path.join(__dirname, "commands");
// Parcourt récursivement et charge tous les *.command.ts
```

**Types de commandes :**
- **Admin** (`admin-commands/`) : Nécessite permission Administrator
- **User** (`user-commands/`) : Accessibles à tous

**Déploiement :** `npm run deploy` (intelligent, déploie seulement les changements)

### 2. Système d'Interactions Centralisé

**Problème :** Avant, chaque feature gérait ses propres interactions (boutons, modals, menus)

**Solution :** Handlers centralisés dans `src/utils/`

#### Button Handler (`button-handler.ts`)
```typescript
// Enregistrement par préfixe
registerHandlerByPrefix("expedition_", async (interaction) => {
  // Route vers le bon handler
});

// Utilisation
if (interaction.isButton()) {
  await buttonHandler.handleButton(interaction);
}
```

**Boutons gérés :**
- `expedition_*` - Actions expéditions
- `eat_food:*` - Manger nourriture
- `character_admin_*` - Admin personnages
- `stock_admin_*` - Admin stocks
- `next_season` - Changement saison

#### Modal Handler (`modal-handler.ts`)
**Modals gérés :**
- `character_creation_modal` - Création personnage
- `expedition_creation_modal` - Création expédition
- `invest_modal` - Investissement chantiers
- `stock_admin_add_modal_*` - Ajout ressources
- etc.

#### Select Menu Handler (`select-menu-handler.ts`)
**Menus gérés :**
- `expedition_join_select` - Rejoindre expédition
- `character_admin_*` - Sélection personnages
- `stock_admin_*` - Sélection ressources
- etc.

### 3. API Service (Communication Backend)

**Emplacement :** `src/services/api/`

**Architecture modulaire :**
```typescript
// src/services/api/index.ts
export const apiService = {
  characters: characterService,
  guilds: guildService,
  chantiers: chantiersService,
  towns: townsService,
  capabilities: capabilityService,
  roles: rolesService,
  // ...
};
```

**Utilisation :**
```typescript
const character = await apiService.characters.getActiveCharacter(userId, townId);
const chantiers = await apiService.chantiers.getChantiersByServer(guildId);
```

**Endpoints backend :** Définis dans `src/services/httpClient.ts` (base URL via env `API_URL`)

---

## 🔧 Patterns et Bonnes Pratiques

### 1. Validation de Personnage (DRY)

**Avant (dupliqué 100+ fois) :**
```typescript
const character = await apiService.characters.getActiveCharacter(...);
if (!character) {
  await interaction.reply({
    content: "❌ Aucun personnage actif trouvé.",
    flags: ["Ephemeral"]
  });
  return;
}
if (character.isDead) {
  await interaction.reply({
    content: "❌ Un mort ne peut pas effectuer cette action.",
    flags: ["Ephemeral"]
  });
  return;
}
```

**Après (centralisé) :**
```typescript
import { validateCharacterAlive, CHARACTER_ERRORS } from "../../utils/character-validation.js";

try {
  const character = await apiService.characters.getActiveCharacter(...);
  validateCharacterAlive(character); // Throws si problème

  // Suite du code...
} catch (error: any) {
  await replyEphemeral(interaction, error.message || CHARACTER_ERRORS.NO_CHARACTER);
  return;
}
```

### 2. Réponses Ephemeral (DRY)

**Avant (166+ occurrences) :**
```typescript
await interaction.reply({
  content: "Message",
  flags: ["Ephemeral"]
});
```

**Après :**
```typescript
import { replyEphemeral } from "../../utils/interaction-helpers.js";

await replyEphemeral(interaction, "Message");
```

### 3. Création d'Embeds (DRY)

**Avant (37 embeds dupliqués) :**
```typescript
const embed = new EmbedBuilder()
  .setColor(0x00ff00)
  .setTitle("✅ Titre")
  .setDescription("Description")
  .setTimestamp();
```

**Après :**
```typescript
import { createSuccessEmbed } from "../../utils/embeds.js";

const embed = createSuccessEmbed("Titre", "Description", [
  { name: "Champ 1", value: "Valeur 1" }
]);
```

**11 fonctions disponibles :** `createSuccessEmbed`, `createErrorEmbed`, `createInfoEmbed`, etc.

### 4. Organisation Features Complexes

**Exemple : Expeditions (avant refactoring Phase 2)**
- 1 fichier monolithique : `expedition.handlers.ts` (1,725 lignes)

**Après décomposition :**
```
features/expeditions/
├── expedition.command.ts (19 lignes) - Entry point
└── handlers/
    ├── expedition-display.ts (377 lignes)
    ├── expedition-create.ts (422 lignes)
    ├── expedition-join.ts (241 lignes)
    ├── expedition-leave.ts (151 lignes)
    └── expedition-transfer.ts (565 lignes)
```

**Avantages :**
- Fichiers < 600 lignes (lisible)
- Séparation claire des responsabilités
- Imports ciblés (moins de contexte chargé)

---

## 📊 Métriques Post-Refactoring

### Code Size
- **Avant refactoring** : 12,693 lignes
- **Après refactoring** : 13,478 lignes (+785 lignes)
- **Note** : Augmentation due aux utils créés, mais **duplication éliminée : ~500-700 lignes**

### Fichiers
- **Utils créés** : 18 fichiers (~1,000 lignes de code réutilisable)
- **Features décomposées** : 3 (expeditions, stock-admin, character-admin)
- **Modules créés** : 14 (vs 3 fichiers monolithiques avant)

### Réutilisabilité
- **Embeds** : 37 dupliqués → 11 fonctions (**51+ utilisations**)
- **Validations** : 100+ dupliquées → 7 fonctions (**54+ utilisations**)
- **Helpers** : 166+ ephemeral flags → 1 fonction (**50+ utilisations**)

### Maintenabilité
- **Plus gros fichier** : 664 lignes (vs 1,725 avant) **-61%**
- **Fichiers modulaires** : 25+ fichiers refactorisés
- **Code DRY** : ✅ Principe respecté globalement

---

## 🚀 Workflow de Développement

### Ajouter une Nouvelle Feature

1. **Créer le répertoire** : `src/features/ma-feature/`
2. **Créer les fichiers** :
   - `ma-feature.command.ts` - Commandes slash
   - `ma-feature.handlers.ts` - Logique
   - `ma-feature.utils.ts` (optionnel) - Utils spécifiques
3. **Enregistrer les interactions** :
   - Boutons → `button-handler.ts`
   - Modals → `modal-handler.ts`
   - Menus → `select-menu-handler.ts`
4. **Déployer** : `npm run deploy`

### Ajouter un Utilitaire Partagé

**Si utilisé dans 2+ features :**
1. Créer dans `src/utils/`
2. Exporter la fonction/classe
3. Importer dans les features qui en ont besoin

**Si spécifique à 1 feature :**
1. Créer dans `src/features/[nom]/[nom].utils.ts`

### Modifier l'API Backend

1. Backend : Créer/modifier endpoint
2. Bot : Ajouter méthode dans `src/services/api/[domain].service.ts`
3. Utiliser via `apiService.[domain].method()`

---

## 🧪 Tests et Qualité

### Build
```bash
npm run build  # Compile TypeScript
```

### Linting
```bash
npm run lint   # ESLint
```

### Déploiement Discord
```bash
npm run deploy        # Déploie seulement les changements
npm run deploy:force  # Force redéploiement complet
```

### Mode Développement
- **Guild mode** : Set `DISCORD_GUILD_ID` dans `.env` pour tests rapides
- **Global mode** : Leave empty pour production (propagation 1h)

---

## 📚 Documentation Additionnelle

- **CLAUDE.md** : Instructions pour Claude Code AI
- **.claude/reference.md** : Documentation technique complète
- **.claude/collaboration.md** : Protocole Supernova
- **docs/refactoring-progress.md** : Historique du refactoring
- **README.md** : Guide utilisateur et setup

---

## 🔄 Historique du Refactoring

### Phase 1 : UI Utils (Complétée)
- Centralisation des embeds et composants Discord
- Création `utils/embeds.ts` et `utils/discord-components.ts`
- **Résultat** : 37 embeds → 11 fonctions, 51+ utilisations

### Phase 2 : Expeditions Décomposition (Complétée)
- Découpage `expedition.handlers.ts` (1,725 lignes)
- Création 5 modules (display, create, join, leave, transfer)
- **Résultat** : Fichiers < 600 lignes, séparation responsabilités

### Phase 3 : Logique Métier (Complétée)
- Extraction validations, helpers, formatters
- Création `character-validation.ts`, `interaction-helpers.ts`, `text-formatters.ts`
- **Résultat** : 310 lignes utils, 54+ utilisations, duplication éliminée

### Phase 4 : Admin Split (Complétée)
- Découpage `stock-admin.handlers.ts` (811 lignes) → 3 modules
- Découpage `character-admin.interactions.ts` (760 lignes) → 3 modules
- **Résultat** : 6 modules + 2 entry points, code modulaire

### Phase 5 : Application Globale Utils (Complétée)
- Migration 8 fichiers restants (2,743 lignes)
- Application des utils créés dans toutes les features
- **Résultat** : 50+ migrations, code cohérent et maintenable

---

## 🎯 Principes de Design Appliqués

### DRY (Don't Repeat Yourself)
✅ **Appliqué** : Utils partagés pour embeds, validations, formatters, helpers

### Separation of Concerns
✅ **Appliqué** : Services, Utils, Features séparés

### Single Responsibility Principle
✅ **Appliqué** : Chaque module a une responsabilité claire

### Modularité
✅ **Appliqué** : Features isolées, handlers centralisés

### Maintenabilité
✅ **Appliqué** : Fichiers < 700 lignes, code documenté

---

**Créé le** : 2025-10-08
**Auteur** : Refactoring Phases 1-5 (Claude Code + Code Supernova)
**Status** : ✅ Production Ready

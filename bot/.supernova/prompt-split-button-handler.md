# SUPERNOVA TASK: Split button-handler.ts

## 🎯 Objectif

Diviser le fichier `src/utils/button-handler.ts` (1,851 lignes) en modules organisés par feature pour améliorer la maintenabilité et réduire l'usage de tokens.

## 📋 Contexte

Le fichier `button-handler.ts` est un **mega-handler** qui gère tous les boutons Discord. Il contient ~40+ handlers de boutons différents tous dans un seul fichier monolithique.

**Problème :**
- Difficile à maintenir
- Usage élevé de tokens (~200 tokens par session)
- Logique métier mélangée
- Violations du principe Single Responsibility

**Solution :**
Diviser le fichier en modules séparés par feature, en gardant `button-handler.ts` comme **router/registry** central.

---

## 📂 Structure cible

### Nouveaux fichiers à créer

1. **`src/features/expeditions/buttons.ts`**
   - Handlers : `expedition_*`
   - Lignes source : ~53-114

2. **`src/features/hunger/buttons.ts`**
   - Handlers : `eat_*`, `use_cataplasme`
   - Lignes source : ~115-280

3. **`src/features/admin/character-admin/buttons.ts`**
   - Handlers : `character_admin_*`, `capability_admin_*`
   - Lignes source : ~281-324

4. **`src/features/admin/object-admin/buttons.ts`**
   - Handlers : `object_admin_*`, `skill_admin_*`, `object_category_*`, `skill_category_*`
   - Lignes source : ~325-388

5. **`src/features/users/buttons.ts`**
   - Handlers : `use_capability`, `give_object:`
   - Lignes source : ~389-420

6. **`src/features/admin/stock-admin/buttons.ts`**
   - Handlers : `stock_admin_add`, `stock_admin_remove`
   - Lignes source : ~421-452

7. **`src/features/projects/buttons.ts`**
   - Handlers : `project_admin_*`, `project_add_*`, `project_participate`, `blueprint_participate`
   - Lignes source : ~453-860

8. **`src/features/chantiers/buttons.ts`**
   - Handlers : `chantier_*`
   - Lignes source : ~657-828

9. **`src/features/season/buttons.ts`**
   - Handlers : `next_season`
   - Lignes source : ~704-795

---

## 🔧 Pattern à suivre

### Pour chaque nouveau fichier de feature

```typescript
/**
 * Button handlers for [FEATURE NAME]
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
// ... autres imports nécessaires

/**
 * Register all [FEATURE] button handlers
 */
export function register[Feature]Buttons(handler: ButtonHandler): void {
  // Handler 1
  handler.registerHandlerByPrefix("button_prefix_", async (interaction: ButtonInteraction) => {
    // Logique du handler (copier depuis button-handler.ts)
  });

  // Handler 2
  handler.registerHandler("button_exact_id", async (interaction: ButtonInteraction) => {
    // Logique du handler
  });

  // ... autres handlers
}
```

### Exemple concret : `src/features/expeditions/buttons.ts`

```typescript
/**
 * Button handlers for Expeditions
 * Extracted from utils/button-handler.ts
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
import {
  handleExpeditionJoinButton,
  handleExpeditionLeaveButton,
  handleExpeditionStartButton,
  // ... autres handlers
} from "./handlers";

export function registerExpeditionButtons(handler: ButtonHandler): void {
  handler.registerHandlerByPrefix("expedition_", async (interaction: ButtonInteraction) => {
    const action = interaction.customId.split("_")[1];

    switch (action) {
      case "join":
        await handleExpeditionJoinButton(interaction);
        break;
      case "leave":
        await handleExpeditionLeaveButton(interaction);
        break;
      case "start":
        await handleExpeditionStartButton(interaction);
        break;
      // ... autres cas
      default:
        logger.warn(`Unknown expedition button action: ${action}`);
    }
  });
}
```

---

## 🔄 Modification de button-handler.ts

Une fois tous les modules créés, transformer `button-handler.ts` en **router simple** :

```typescript
/**
 * Central Button Handler Registry
 * Delegates button handling to feature-specific modules
 */

import { Client, ButtonInteraction } from "discord.js";
import { logger } from "../services/logger";

// Import feature button registrations
import { registerExpeditionButtons } from "../features/expeditions/buttons";
import { registerHungerButtons } from "../features/hunger/buttons";
import { registerCharacterAdminButtons } from "../features/admin/character-admin/buttons";
import { registerObjectAdminButtons } from "../features/admin/object-admin/buttons";
import { registerUserButtons } from "../features/users/buttons";
import { registerStockAdminButtons } from "../features/admin/stock-admin/buttons";
import { registerProjectButtons } from "../features/projects/buttons";
import { registerChantierButtons } from "../features/chantiers/buttons";
import { registerSeasonButtons } from "../features/season/buttons";

export class ButtonHandler {
  private handlers: Map<string, (interaction: ButtonInteraction) => Promise<void>>;
  private prefixHandlers: Array<{
    prefix: string;
    handler: (interaction: ButtonInteraction) => Promise<void>;
  }>;

  constructor(private client: Client) {
    this.handlers = new Map();
    this.prefixHandlers = [];
    this.registerDefaultHandlers();
  }

  /**
   * Register a handler for exact button custom ID
   */
  public registerHandler(
    customId: string,
    handler: (interaction: ButtonInteraction) => Promise<void>
  ): void {
    this.handlers.set(customId, handler);
  }

  /**
   * Register a handler for buttons starting with a prefix
   */
  public registerHandlerByPrefix(
    prefix: string,
    handler: (interaction: ButtonInteraction) => Promise<void>
  ): void {
    this.prefixHandlers.push({ prefix, handler });
  }

  /**
   * Register all feature-specific button handlers
   */
  private registerDefaultHandlers(): void {
    logger.info("Registering button handlers...");

    // Register all feature modules
    registerExpeditionButtons(this);
    registerHungerButtons(this);
    registerCharacterAdminButtons(this);
    registerObjectAdminButtons(this);
    registerUserButtons(this);
    registerStockAdminButtons(this);
    registerProjectButtons(this);
    registerChantierButtons(this);
    registerSeasonButtons(this);

    logger.info(`✅ Registered ${this.handlers.size} exact handlers and ${this.prefixHandlers.length} prefix handlers`);
  }

  /**
   * Handle a button interaction
   */
  public async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const customId = interaction.customId;

    // Try exact match first
    const exactHandler = this.handlers.get(customId);
    if (exactHandler) {
      await exactHandler(interaction);
      return;
    }

    // Try prefix match
    for (const { prefix, handler } of this.prefixHandlers) {
      if (customId.startsWith(prefix)) {
        await handler(interaction);
        return;
      }
    }

    // No handler found
    logger.warn(`No handler registered for button: ${customId}`);
    await interaction.reply({
      content: "❌ Action non reconnue.",
      ephemeral: true,
    });
  }
}
```

---

## ✅ Checklist de validation

Pour chaque fichier créé :

- [ ] Le fichier est créé dans le bon répertoire feature
- [ ] La fonction `register[Feature]Buttons()` est exportée
- [ ] Tous les imports nécessaires sont présents
- [ ] La logique métier est identique à l'original
- [ ] Les handlers sont correctement enregistrés (registerHandler ou registerHandlerByPrefix)
- [ ] Le fichier compile sans erreur TypeScript

Une fois tous les fichiers créés :

- [ ] button-handler.ts a été transformé en router
- [ ] Tous les imports de features sont présents
- [ ] Toutes les fonctions register*Buttons() sont appelées dans registerDefaultHandlers()
- [ ] Le build passe : `npm run build`
- [ ] Aucune régression fonctionnelle (tester quelques boutons)

---

## 🚨 IMPORTANT - Ne pas modifier

- **NE PAS** modifier les messages utilisateur sans autorisation explicite
- **NE PAS** changer la logique métier existante
- **COPIER/COLLER** la logique exactement telle quelle
- **PRÉSERVER** tous les imports et dépendances
- **GARDER** les mêmes noms de fonction internes

---

## 📊 Résultat attendu

**Avant :**
- 1 fichier de 1,851 lignes
- Tout mélangé
- Difficile à naviguer

**Après :**
- 1 router de ~150 lignes (button-handler.ts)
- 9 fichiers features de ~100-300 lignes chacun
- Organisation claire par domaine métier
- **Token savings : ~200-300 tokens par session**

---

## 🎯 Ordre de traitement recommandé

1. **Expeditions** (handlers simples, bien isolés)
2. **Hunger** (handlers isolés)
3. **Season** (1 seul handler)
4. **User Actions** (2 handlers simples)
5. **Stock Admin** (2 handlers simples)
6. **Character Admin** (handlers moyens)
7. **Object Admin** (handlers moyens)
8. **Chantiers** (handlers complexes)
9. **Projects** (handlers les plus complexes - ~400 lignes)

---

## 📝 Notes finales

- Prendre le temps de bien structurer chaque fichier
- Vérifier les imports après chaque fichier créé
- Tester la compilation après chaque étape majeure
- Créer un commit à la fin : "Refactor: Split button-handler.ts into feature modules"

---

**Prêt à commencer ? Bonne chance ! 🚀**

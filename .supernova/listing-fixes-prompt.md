# PROMPT SUPERNOVA - Corrections listing.md

## 📋 CONTEXTE

Tu es un assistant spécialisé dans la modification de codebase TypeScript/Discord.js. Tu vas corriger 5 points identifiés dans `/docs/listing.md` pour le projet FateWeaverBot.

**Architecture du projet:**
- Bot Discord (TypeScript) : `/bot/`
- Backend REST API (Express/Prisma/PostgreSQL) : `/backend/`
- Working directory pour npm: `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/`

## 🎯 OBJECTIFS

### ✅ Point 1: Dépression sur personnages vivants
**STATUS:** ✅ DÉJÀ CONFORME - Aucune action requise
- Le code vérifie bien `isDead: false` partout
- `daily-pm.cron.ts:20-34` filtre les personnages vivants
- Validation OK

---

### 🔧 Point 2: Personnages DEPARTED sans accès stocks/chantiers

**PROBLÈME IDENTIFIÉ:**
Personnages en expédition DEPARTED peuvent encore utiliser harvest capabilities (Bûcheronner, Miner, Pêcher) pour ajouter des ressources au stock VILLE alors qu'ils devraient être restreints.

**FICHIER À MODIFIER:** `/backend/src/services/capability.service.ts`

**LOCATIONS:**
- Lines 300-320: `Bûcheronner` - Aucun check DEPARTED
- Lines 373-391: `Miner` - Aucun check DEPARTED
- Lines 442-468: `Pêcher` - Aucun check DEPARTED

**PATTERN EXISTANT À SUIVRE:**
```typescript
// Exemple de check DEPARTED (capability.service.ts:587-597)
const departedExpedition = await this.prisma.expeditionMember.findFirst({
  where: {
    characterId,
    expedition: { status: "DEPARTED" }
  }
});

if (departedExpedition) {
  throw new Error("Impossible de [ACTION] en expédition DEPARTED");
}
```

**ACTIONS:**

1. **Ajouter check DEPARTED** pour Bûcheronner, Miner, Pêcher (3 endroits)
   - Utiliser le pattern ci-dessus
   - Message d'erreur: `"Impossible de [Bûcheronner/Miner/Pêcher] en expédition DEPARTED"`

2. **Modifier `/bot/src/features/stock/stock.handlers.ts`** pour afficher un message si personnage DEPARTED:
   ```typescript
   // Vérifier si le personnage est en expédition DEPARTED
   const inDepartedExpedition = character.expeditionMembers?.some(
     (em: any) => em.expedition.status === "DEPARTED"
   );

   if (inDepartedExpedition) {
     await interaction.reply({
       content: "❌ Vous êtes en expédition et ne pouvez pas voir les stocks de la ville. Utilisez `/expedition` pour voir vos ressources d'expédition.",
       flags: ["Ephemeral"]
     });
     return;
   }
   ```

**NOTES IMPORTANTES:**
- Les personnages DEPARTED consomment déjà depuis le stock expédition (OK - `characters.ts:300-315`)
- Chantiers déjà bloqués (OK - `chantier.ts:176-185` et `chantier.service.ts:173-180`)
- Crafting déjà bloqué (OK - `capability.service.ts:587-597`)

---

### 📝 Point 3: Harmonisation messages d'erreur

**PROBLÈME:** 29 fichiers utilisent des messages d'erreur hardcodés au lieu du système global

**SYSTÈME EXISTANT:**
- `/bot/src/constants/errors.ts` - Sous-utilisé
- `/bot/src/utils/character-validation.ts` - `CHARACTER_ERRORS` (bien utilisé)
- `/bot/src/features/admin/character-admin.types.ts` - `CHARACTER_ADMIN_ERRORS` (bien utilisé)

**SOLUTION:** Créer un fichier unifié `/bot/src/constants/messages.ts`

**NOUVEAU FICHIER:**
```typescript
// /bot/src/constants/messages.ts

export const ERROR_MESSAGES = {
  // Système
  GUILD_ONLY: "Cette commande ne peut être utilisée que dans une guilde",
  UNKNOWN: "Une erreur inconnue est survenue",

  // Personnage
  NO_CHARACTER: "❌ Aucun personnage actif trouvé.",
  CHARACTER_DEAD: "❌ Un personnage mort ne peut pas effectuer cette action.",
  CHARACTER_DEAD_EXPEDITION: "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.",
  CHARACTER_CREATION_REQUIRED: "❌ Vous devez d'abord créer un personnage avec la commande `/profil`.",
  CHARACTER_NOT_FOUND: "❌ Personnage introuvable.",

  // Ville/Guilde
  TOWN_NOT_FOUND: "❌ Aucune ville trouvée pour ce serveur.",

  // Expéditions
  EXPEDITION_FETCH_ERROR: "❌ Une erreur est survenue lors de la récupération des informations d'expédition.",
  EXPEDITION_DEPARTED_NO_CITY_STOCK: "❌ Vous êtes en expédition et ne pouvez pas voir les stocks de la ville. Utilisez `/expedition` pour voir vos ressources d'expédition.",
  EXPEDITION_DEPARTED_NO_CITY_CHANTIER: "❌ Vous êtes en expédition et ne pouvez pas accéder aux chantiers de la ville.",
  EXPEDITION_DEPARTED_NO_CRAFT: "Impossible de crafter en expédition DEPARTED",
  EXPEDITION_DEPARTED_NO_HARVEST: (action: string) => `Impossible de ${action} en expédition DEPARTED`,

  // Admin
  ADMIN_REQUIRED: "❌ Vous devez être administrateur pour utiliser cette commande.",

  // Opérations génériques
  OPERATION_ERROR: (operation: string) => `❌ Une erreur est survenue lors de ${operation}.`,

  // Interactions
  NOT_YOUR_CAPABILITY: "❌ Vous ne pouvez utiliser que vos propres capacités.",
  NOT_YOUR_PROFILE: "❌ Vous ne pouvez utiliser que votre propre profil.",

  // Stock/Ressources
  INSUFFICIENT_PA: (current: number, required: number) => `❌ Vous n'avez pas assez de PA (${current}/${required} requis).`,

  // Nourriture
  EAT_ERROR: "❌ Une erreur est survenue lors de l'action de manger.",
  EAT_ADVANCED_MENU_ERROR: "❌ Erreur lors de l'affichage du menu avancé.",
  EAT_CONSUMPTION_ERROR: "❌ Erreur lors de la consommation.",
  MEAL_ERROR: "Une erreur est survenue lors du repas.",

  // Chantiers
  CHANTIER_FETCH_ERROR: "Une erreur est survenue lors de la récupération des chantiers.",
  CHANTIER_PARTICIPATE_ERROR: "Une erreur est survenue lors de la préparation de la participation.",
  CHANTIER_INVEST_ERROR: "Une erreur est survenue lors de la préparation de l'investissement.",
  CHANTIER_PROCESSING_ERROR: "❌ Une erreur est survenue lors du traitement de votre investissement.",
  CHANTIER_BUTTON_ERROR: "❌ Erreur lors de la participation au chantier.",
  CHANTIER_ADD_RESOURCE_ERROR: "❌ Erreur lors de l'ajout de ressource.",
  CHANTIER_CREATE_ERROR: "❌ Erreur lors de la création du chantier.",

  // Cataplasme
  CATAPLASME_ERROR: "Une erreur est survenue lors de l'utilisation du cataplasme.",
  CATAPLASME_UNAVAILABLE: "Impossible d'utiliser le cataplasme.",

  // Admin
  ADMIN_INTERACTION_ERROR: "❌ Erreur lors du traitement de l'interaction d'administration.",
  ADMIN_CAPABILITY_ERROR: "❌ Erreur lors du traitement de la gestion des capacités.",
  ADMIN_STOCK_ADD_ERROR: "❌ Erreur lors de l'affichage de l'ajout de ressources.",
  ADMIN_STOCK_REMOVE_ERROR: "❌ Erreur lors de l'affichage du retrait de ressources.",

  // Capacités
  CAPABILITY_NOT_FOUND: "❌ Capacité non trouvée.",
  CAPABILITY_DEAD: "❌ Vous ne pouvez pas utiliser de capacités avec un personnage mort.",

  // Saison
  SEASON_FETCH_ERROR: "❌ Impossible de récupérer la saison actuelle.",
  SEASON_INVALID_DATA: "❌ Format de données de saison invalide.",
  SEASON_CHANGE_ERROR: (message: string) => `❌ Erreur lors du changement de saison : ${message}`,
};

export const SUCCESS_MESSAGES = {
  CATAPLASME_USED: (message: string) => `✅ ${message}`,
  CAPABILITY_USED: (name: string, details?: string) => `✅ **${name}** utilisée avec succès !${details ? '\n' + details : ''}`,
  SEASON_CHANGED: "✅ Saison changée avec succès",
};

export const INFO_MESSAGES = {
  CHARACTER_STATUS_UNKNOWN: "❌ Impossible de déterminer l'état de votre personnage. Veuillez contacter un administrateur.",
  PROFILE_ERROR: "❌ Une erreur est survenue lors de l'affichage de votre profil.",
  REROLL_PROMPT: "❌ Votre personnage est mort. Utilisez la commande de reroll pour créer un nouveau personnage.",
};
```

**FICHIERS À MODIFIER (TOP PRIORITÉ - ~15 fichiers):**

1. `/bot/src/utils/character.ts` (3 messages)
2. `/bot/src/features/hunger/hunger.handlers.ts` (4+ messages)
3. `/bot/src/features/expeditions/handlers/expedition-join.ts` (4+ messages)
4. `/bot/src/features/expeditions/handlers/expedition-display.ts` (4+ messages)
5. `/bot/src/features/chantiers/chantiers.handlers.ts` (6+ messages)
6. `/bot/src/utils/button-handler.ts` (10+ messages)
7. `/bot/src/utils/discord-components.ts` (validations)
8. `/bot/src/features/users/users.handlers.ts` (plusieurs messages)
9. `/bot/src/modals/character-modals.ts` (messages de création)
10. `/bot/src/features/admin/character-admin/character-*.ts` (multiples)
11. `/bot/src/features/expeditions/handlers/expedition-create.ts` (multiples)
12. `/bot/src/features/expeditions/handlers/expedition-transfer.ts`
13. `/bot/src/features/death/death.handler.ts`
14. `/bot/src/features/stock/stock.handlers.ts`
15. `/bot/src/features/config/config.handlers.ts`

**PATTERN DE REMPLACEMENT:**
```typescript
// AVANT
await interaction.reply({
  content: "❌ Aucun personnage actif trouvé.",
  flags: ["Ephemeral"]
});

// APRÈS
import { ERROR_MESSAGES } from "../../constants/messages.js";

await interaction.reply({
  content: ERROR_MESSAGES.NO_CHARACTER,
  flags: ["Ephemeral"]
});
```

**RÈGLES:**
- Importer depuis `../../constants/messages.js` (ajuster le chemin selon la profondeur)
- Remplacer TOUS les strings hardcodés par les constantes
- Pour les messages dynamiques, utiliser les fonctions fléchées: `ERROR_MESSAGES.OPERATION_ERROR("récupération des chantiers")`
- Préserver les emojis existants dans les messages

---

### 🎨 Point 4: Harmonisation des emojis

**PROBLÈME:** 30+ fichiers utilisent des emojis hardcodés au lieu du système global

**SYSTÈME EXISTANT:** `/bot/src/constants/emojis.ts` (bien structuré)

**CATÉGORIES EXISTANTES:**
- `STATUS` - ✅ ❌ ⚠️ ℹ️ 📊
- `CHARACTER` - ❤️ 💜 ⚡ 👤 🌧️ 😔
- `HUNGER` - 🍽️ 😊 🤤 😕 😰 💀
- `ACTIONS` - ✏️ 🗑️ 🔄 ✅ ❌
- `CAPABILITIES` - 🏹 🌿 🎣 🎭 🔮
- `EXPEDITION` - 🏕️ ✈️ 🔒 📋 ✅
- `CHANTIER` - 🏗️ 🎉 🏛️
- `LOCATION` - 🏙️ 🏛️
- `RESOURCES` - 📦 🍞 🥞
- `UI` - ⏮️ ◀️ ▶️ ⏭️

**EMOJIS MANQUANTS À AJOUTER:**

```typescript
// Dans /bot/src/constants/emojis.ts

export const LOCATION = {
  CITY: "🏙️",
  CITY_ALT: "🏘️",
  TOWN: "🏛️",  // NOUVEAU - Très utilisé pour ville
  EXPEDITION: "🏕️",
} as const;

export const TIME = {
  STOPWATCH: "⏱️",  // NOUVEAU - Durée expéditions
  CALENDAR: "📅",
} as const;

export const SYSTEM = {
  WARNING: "⚠️",
  DELETE: "🗑️",
  STATS: "📊",
  TARGET: "🎯",
  SPARKLES: "✨",  // NOUVEAU - Événements spéciaux
} as const;

export const RESOURCES = {
  GENERIC: "📦",
  BREAD: "🍞",
  FOOD: "🥞",
  FORK_KNIFE: "🍴",  // NOUVEAU - Menu avancé manger
  BANDAGE: "🩹",
} as const;

export const SEASON = {
  SUMMER: "☀️",
  WINTER: "❄️",
  WEATHER: "🌤️",  // NOUVEAU
} as const;

export const ADMIN = {
  SETTINGS: "⚙️",
  INFO: "ℹ️",
  EDIT: "✍️",
  ROCKET: "🚀",  // NOUVEAU - Expéditions admin
  EMERGENCY: "🚨",  // NOUVEAU - Retour d'urgence
} as const;
```

**FICHIERS À MODIFIER (TOP PRIORITÉ - ~20 fichiers):**

1. `/bot/src/utils/discord-components.ts` - Navigation (⏮️ ◀️ ▶️ ⏭️), Confirm/Cancel (✅ ❌), Actions (✏️ 🗑️)
2. `/bot/src/features/users/users.handlers.ts` - 🍞 💀 ❤️ 🖤 🏹 🌿 🎣 🎭 🔮 🍴
3. `/bot/src/modals/character-modals.ts` - ❤️ ⚡
4. `/bot/src/features/expeditions/handlers/expedition-display.ts` - 🏛️ ⏱️ 🏕️ ⚠️
5. `/bot/src/features/expeditions/handlers/expedition-create.ts` - 🏕️ ⏱️ 📦 🏛️
6. `/bot/src/features/expeditions/handlers/expedition-transfer.ts` - 🏛️
7. `/bot/src/features/expeditions/expedition-utils.ts` - ✈️
8. `/bot/src/features/admin/character-admin.components.ts` - 💀 ❤️ 🔮
9. `/bot/src/features/admin/expedition-admin.handlers.ts` - ⏱️ 🏛️ 👤 📦 ✅ ✈️
10. `/bot/src/features/admin/character-admin/character-select.ts` - 💀
11. `/bot/src/features/admin/character-admin/character-stats.ts` - 💀 ❤️
12. `/bot/src/features/admin/character-admin/character-capabilities.ts` - 🔮 ℹ️
13. `/bot/src/features/admin/stock-admin/stock-display.ts` - 🏛️
14. `/bot/src/features/death/death.handler.ts` - 💀
15. `/bot/src/features/stock/stock.handlers.ts` - 🏙️
16. `/bot/src/features/hunger/hunger.handlers.ts` - 🍽️
17. `/bot/src/features/hunger/hunger.utils.ts` - 🍽️
18. `/bot/src/features/config/config.handlers.ts` - ℹ️ ⚙️
19. `/bot/src/features/help/help.utils.ts` - ⚙️ 🏗️
20. `/bot/src/utils/hunger.ts` - 💀

**FICHIERS SYSTÈME (MOINS PRIORITAIRE):**
- `/bot/src/deploy-commands.ts` - ⚠️ 🗑️ 📊
- `/bot/src/deploy-commands-force.ts` - ⚠️ 🗑️ ✍️
- `/bot/src/list-commands.ts` - 🏰 📊
- `/bot/src/utils/button-handler.ts` - 🎯 📊
- `/bot/src/services/pm-contagion-listener.ts` - 🌧️
- `/bot/src/commands/admin-commands/season-admin.ts` - 🌤️

**PATTERN DE REMPLACEMENT:**
```typescript
// AVANT
const button = new ButtonBuilder()
  .setLabel("✅ Confirmer")
  .setStyle(ButtonStyle.Success);

// APRÈS
import { ACTIONS } from "../../constants/emojis.js";

const button = new ButtonBuilder()
  .setLabel(`${ACTIONS.CONFIRM} Confirmer`)
  .setStyle(ButtonStyle.Success);
```

```typescript
// AVANT
if (character.isDead) {
  return "💀";
}

// APRÈS
import { HUNGER } from "../../constants/emojis.js";

if (character.isDead) {
  return HUNGER.DEAD;
}
```

**RÈGLES:**
- Importer seulement les catégories nécessaires: `import { STATUS, CHARACTER, ACTIONS } from "..."`
- Utiliser template literals pour combiner: `` `${STATUS.ERROR} Message` ``
- Préserver les espaces et formatage existants

---

### 📡 Point 5: Logs vers channel admin configuré

**PROBLÈME IDENTIFIÉ:**

**1. Capabilities - publicMessage envoyé dans le channel de commande**

**FICHIER:** `/bot/src/features/users/users.handlers.ts:621-623`

```typescript
// ❌ PROBLÈME - Ligne 621-623
if (result.publicMessage && interaction.channel) {
  await interaction.channel.send(result.publicMessage);
}
```

**SOLUTION:**
```typescript
// ✅ CORRECTION
import { sendLogMessage } from "../../utils/channels.js";

// Remplacer les lignes 621-623 par:
if (result.publicMessage && interaction.guildId) {
  await sendLogMessage(
    interaction.guildId,
    interaction.client,
    result.publicMessage
  );
}
```

**2. expedition-create.ts - Méthode directe au lieu de sendLogMessage**

**FICHIER:** `/backend/src/features/expeditions/handlers/expedition-create.ts:356-366`

**PATTERN ACTUEL:**
```typescript
// ❌ INCONSISTANT - Utilise logChannel direct
const guild = await apiService.guilds.getGuildByDiscordId(interaction.guildId!);
if (guild?.logChannelId) {
  const logChannel = await interaction.client.channels.fetch(guild.logChannelId);
  if (logChannel?.isTextBased()) {
    await logChannel.send({ embeds: [logEmbed] });
  }
}
```

**SOLUTION:**
```typescript
// ✅ STANDARDISER
import { sendLogMessage } from "../../utils/channels.js";

// Remplacer par:
const logMessage = `📝 **Nouvelle expédition créée**\n...`; // Construire le message texte
await sendLogMessage(
  interaction.guildId!,
  interaction.client,
  logMessage
);
```

**NOTES:**
- Les autres endroits utilisent déjà correctement `sendLogMessage()` (12+ endroits)
- Silent failure si pas de channel configuré (OK - comportement voulu)

---

## 🔍 FICHIERS DE RÉFÉRENCE IMPORTANTS

**Systèmes globaux:**
- `/bot/src/constants/emojis.ts` - Emojis (NE PAS MODIFIER sauf ajouts)
- `/bot/src/constants/errors.ts` - Erreurs existantes (À COMPLÉTER)
- `/bot/src/utils/character-validation.ts` - Validations (NE PAS MODIFIER)
- `/bot/src/utils/channels.ts` - sendLogMessage (NE PAS MODIFIER)
- `/bot/src/utils/interaction-helpers.ts` - replyError, replySuccess (NE PAS MODIFIER)

**Patterns de référence:**
- `/backend/src/services/chantier.service.ts:173-180` - Check DEPARTED
- `/backend/src/services/capability.service.ts:587-597` - Check DEPARTED crafting
- `/bot/src/features/death/death.handler.ts:30` - Utilisation sendLogMessage
- `/bot/src/features/chantiers/chantiers.handlers.ts:790` - Utilisation sendLogMessage

---

## ✅ VALIDATION FINALE

Après modifications, vérifier:

1. **Point 2:** Les harvest capabilities bloquent bien les DEPARTED
2. **Point 2:** /stock affiche le message d'erreur pour DEPARTED
3. **Point 3:** Tous les messages hardcodés sont remplacés par constantes
4. **Point 4:** Tous les emojis hardcodés sont remplacés par constantes
5. **Point 5:** Les publicMessage vont dans le channel admin configuré

**TESTS À EFFECTUER:**
```bash
# Vérifier compilation
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot
npm run build

# Vérifier qu'aucun message hardcodé ne reste (exemples)
grep -r "❌ Aucun personnage actif" bot/src/features/
grep -r "Une erreur est survenue lors" bot/src/features/
grep -r '"💀"' bot/src/features/
grep -r '"🏛️"' bot/src/features/
```

---

## 📊 ESTIMATION MODIFICATIONS

- **Point 2:** 4 fichiers, ~30 lignes modifiées
- **Point 3:** 1 nouveau fichier + 15 fichiers modifiés, ~150 remplacements
- **Point 4:** Modifications dans emojis.ts + 20 fichiers, ~200 remplacements
- **Point 5:** 2 fichiers, ~10 lignes modifiées

**TOTAL:** ~23 fichiers modifiés, ~390 changements

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Créer** `/bot/src/constants/messages.ts` (Point 3)
2. **Modifier** `/bot/src/constants/emojis.ts` - Ajouter emojis manquants (Point 4)
3. **Modifier** Backend - Harvest capabilities + DEPARTED checks (Point 2a)
4. **Modifier** Bot - Stock handler pour DEPARTED (Point 2b)
5. **Modifier** Bot - Capabilities publicMessage → sendLogMessage (Point 5a)
6. **Modifier** Bot - expedition-create.ts standardisation (Point 5b)
7. **Remplacer massivement** - Messages d'erreur hardcodés (Point 3)
8. **Remplacer massivement** - Emojis hardcodés (Point 4)
9. **Tester** - Build + vérifications grep

---

## 📝 RAPPORT FINAL ATTENDU

À la fin de l'exécution, fournis un rapport avec:

1. ✅ Liste des fichiers modifiés
2. 📊 Nombre de remplacements effectués (messages + emojis)
3. ⚠️ Points d'attention ou inconsistances trouvées
4. 🧪 Résultats des tests (build + grep)
5. 📋 Checklist de validation complétée

---

**BON COURAGE ! 🚀**

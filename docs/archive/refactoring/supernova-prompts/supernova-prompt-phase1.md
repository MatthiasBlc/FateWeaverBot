# 🚀 Prompt pour Code Supernova - Phase 1 Refactoring

**Mission : Exécution Batch 1-6 de la Phase 1**
**Collaborateurs : Claude Code (planning/validation) + Supernova (exécution) + Utilisateur (oversight)**

---

## 🎯 Objectif de la Mission

Migrer **36 embeds Discord** vers les fonctions utilitaires déjà créées dans `utils/embeds.ts` et `utils/discord-components.ts`.

**Résultat attendu :**
- -570 lignes de code dupliqué
- 36 embeds migrés → 1 seul fichier source (utils/embeds.ts)
- 0 erreurs de build
- Code plus maintenable

---

## 📋 Infrastructure Déjà en Place

✅ **Fichiers créés par Claude Code :**
- `bot/src/utils/embeds.ts` (273 lignes) - 11 fonctions réutilisables
- `bot/src/utils/discord-components.ts` (243 lignes) - 8 fonctions de composants
- `bot/src/features/expeditions/expedition-utils.ts` (80 lignes)
- 1 exemple de migration dans `character-admin.interactions.ts`

✅ **Fonctions disponibles :**
```typescript
// Embeds
createSuccessEmbed(title, description?, fields?)
createErrorEmbed(message, details?)
createInfoEmbed(title, description?, fields?)
createWarningEmbed(title, description?)
createCustomEmbed({ color, title, description, ... })
getHungerColor(hungerLevel)
getStockColor(stock)

// Composants
createActionButtons(buttons[])
createConfirmationButtons(customIdPrefix, options?)
createSelectMenu(customId, options[], placeholder?)
```

---

## 🔄 Workflow Requis

**Pour CHAQUE fichier que tu modifies :**
1. ✅ Lire le fichier
2. ✅ Identifier les embeds à migrer
3. ✅ Appliquer les transformations
4. ✅ Ajouter les imports nécessaires
5. ✅ **TESTER : `npm run build`**
6. ✅ Si OK → passer au suivant
7. ❌ Si erreur → STOP et documenter

**Après CHAQUE batch complet :**
1. ✅ Tous les fichiers du batch testés
2. ✅ Créer un commit : `refactor(phase1-batchX): migration embeds [description]`
3. ✅ Documenter dans refactoring-progress.md

---

## 📦 Batch 1: character-admin.interactions.ts (5 embeds)

**Fichier :** `bot/src/features/admin/character-admin.interactions.ts`

### Import à ajouter (ligne 1-20)
```typescript
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from "../../utils/embeds";
```

### Embed 1 - handleAdvancedStatsModalSubmit (ligne ~311)
**Chercher :**
```typescript
const embed = new EmbedBuilder()
  .setColor(0x00ff00)
  .setTitle("✅ Stats avancées mises à jour")
  .setDescription(`**${updatedCharacter.name}** a été modifié.`)
  .addFields(...)
  .setTimestamp();
```

**Remplacer par :**
```typescript
const embed = createSuccessEmbed(
  "Stats avancées mises à jour",
  `**${updatedCharacter.name}** a été modifié.`
).addFields(...);
```

### Embed 2 - handleKillButton (ligne ~419)
**Chercher :**
```typescript
const embed = new EmbedBuilder()
  .setColor(0xff0000)
  .setTitle("💀 Personnage Tué")
  .setDescription(`**${character.name}** a été tué.`)
  .setTimestamp();
```

**Remplacer par :**
```typescript
const embed = createErrorEmbed(
  "💀 Personnage Tué",
  `**${character.name}** a été tué.`
);
```

### Embed 3 - handleToggleRerollButton (ligne ~473)
**Chercher :**
```typescript
const embed = new EmbedBuilder()
  .setColor(0x00ff00)
  .setTitle(`🔄 Autorisation de Reroll ${newCanReroll ? "Accordée" : "Révoquée"}`)
  .setDescription(...)
  .setTimestamp();
```

**Remplacer par :**
```typescript
const embed = createSuccessEmbed(
  `Autorisation de Reroll ${newCanReroll ? "Accordée" : "Révoquée"}`,
  `**${character.name}** ${newCanReroll ? "peut maintenant" : "ne peut plus"} créer un nouveau personnage.`
);
```

### Embed 4 - handleViewCapabilities (ligne ~680)
**Chercher :**
```typescript
const embed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle(`🔮 Capacités de ${character.name}`)
  .setDescription(...)
  .setFooter(...)
  .setTimestamp();
```

**Remplacer par :**
```typescript
const embed = createInfoEmbed(
  `🔮 Capacités de ${character.name}`,
  capabilitiesList
).setFooter({ text: `${capabilities.length} capacité(s)` });
```

### Embed 5 - handleCapabilitySelect (ligne ~756)
**Chercher :**
```typescript
const embed = new EmbedBuilder()
  .setColor(action === 'add' ? 0x00ff00 : 0xff0000)
  .setTitle(`${action === 'add' ? '➕ Ajout' : '➖ Suppression'} de capacités`)
  .setDescription(results.join('\n'))
  .setTimestamp();
```

**Remplacer par :**
```typescript
const embed = action === 'add'
  ? createSuccessEmbed('Ajout de capacités', results.join('\n'))
  : createErrorEmbed('Suppression de capacités', results.join('\n'));
```

### ✅ Vérification Batch 1
```bash
npm run build
# Doit passer sans erreur
```

---

## 📦 Batch 2: users.handlers.ts (1 embed principal)

**Fichier :** `bot/src/features/users/users.handlers.ts`

### Import à ajouter
```typescript
import { createCustomEmbed, getHungerColor } from "../../utils/embeds";
```

### Principale migration : createProfileEmbed (ligne ~237)

**Chercher :**
```typescript
const embed = new EmbedBuilder()
  .setColor(getHungerColorLocal(data.character.hungerLevel))  // fonction locale
  .setTitle(`📋 Profil de ${data.character.name || "Sans nom"}`)
  .setThumbnail(data.user.displayAvatarURL)
  .setFooter(...)
  .setTimestamp();
```

**Remplacer par :**
```typescript
const embed = createCustomEmbed({
  color: getHungerColor(data.character.hungerLevel),
  title: `📋 Profil de ${data.character.name || "Sans nom"}`,
  thumbnail: data.user.displayAvatarURL,
  footer: { text: `Profil de: ${data.character.name}`, iconURL: data.user.displayAvatarURL },
  timestamp: true,
});
```

### ⚠️ Action supplémentaire
**Supprimer la fonction locale `getHungerColorLocal`** (si elle existe autour de la ligne 390-410)
Elle est déjà dans `utils/embeds.ts`

### ✅ Vérification Batch 2
```bash
cd bot && npm run build
```

---

## 📦 Batch 3: expedition.handlers.ts (8 embeds)

**Fichier :** `bot/src/features/expeditions/expedition.handlers.ts`

### Import à ajouter
```typescript
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed, createCustomEmbed, EMBED_COLORS } from "../../utils/embeds";
import { getStatusEmoji } from "./expedition-utils";
```

### Pattern général pour ce fichier

**Messages de succès :**
```typescript
// AVANT
new EmbedBuilder().setColor(0x00ff00).setTitle("✅ ...").setTimestamp()

// APRÈS
createSuccessEmbed("titre", "description")
```

**Messages d'erreur :**
```typescript
// AVANT
new EmbedBuilder().setColor(0xff0000).setTitle("❌ ...").setTimestamp()

// APRÈS
createErrorEmbed("message d'erreur", "détails optionnels")
```

**Embeds d'information (expédition en cours, etc.) :**
```typescript
// AVANT
new EmbedBuilder().setColor(0x0099ff).setTitle("🚀 ...").setTimestamp()

// APRÈS
createInfoEmbed("titre", "description").addFields(...)
```

### Zones spécifiques à vérifier
1. `handleExpeditionMainCommand` (ligne ~100-165)
2. `handleExpeditionInfoCommand` (ligne ~942-1006)
3. `handleExpeditionJoinCommand` (ligne ~750-810)
4. Messages de succès/erreur dans les autres fonctions

### ✅ Vérification Batch 3
```bash
cd bot && npm run build
```

---

## 📦 Batch 4: stock-admin.handlers.ts (6 embeds)

**Fichier :** `bot/src/features/admin/stock-admin.handlers.ts`

### Import à ajouter
```typescript
import { createCustomEmbed, createSuccessEmbed, createErrorEmbed, getStockColor } from "../../utils/embeds";
```

### Pattern de migration

**Embed principal de stock :**
```typescript
// AVANT
const embed = new EmbedBuilder()
  .setColor(getStockColorLocal(stock))  // fonction locale si elle existe
  .setTitle("📦 Stock des Ressources")
  .setTimestamp()
  .addFields(...);

// APRÈS
const embed = createCustomEmbed({
  color: getStockColor(stock),
  title: "📦 Stock des Ressources",
  timestamp: true,
}).addFields(...);
```

**Messages de modification :**
```typescript
// Succès
createSuccessEmbed("Ressource ajoutée", `Quantité: ${quantity}`)

// Erreur
createErrorEmbed("Erreur lors de la modification", errorDetails)
```

### ⚠️ Action supplémentaire
Si une fonction locale `getStockColorLocal()` existe, la supprimer (déjà dans utils/embeds.ts)

### ✅ Vérification Batch 4
```bash
cd bot && npm run build
```

---

## 📦 Batch 5: Autres fichiers (12 embeds répartis)

**Fichiers concernés :**
1. `bot/src/features/chantiers/chantiers.handlers.ts` (3 embeds)
2. `bot/src/features/hunger/hunger.handlers.ts` (2 embeds)
3. `bot/src/features/foodstock/foodstock.handlers.ts` (2 embeds)
4. `bot/src/features/admin/expedition-admin.handlers.ts` (3 embeds)
5. `bot/src/features/help/*.ts` (2 embeds)

### Pattern universel

**Pour CHAQUE fichier :**

1. **Ajouter import :**
```typescript
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed, createCustomEmbed } from "../../utils/embeds";
```

2. **Identifier et remplacer :**
- `new EmbedBuilder().setColor(0x00ff00)` → `createSuccessEmbed()`
- `new EmbedBuilder().setColor(0xff0000)` → `createErrorEmbed()`
- `new EmbedBuilder().setColor(0x0099ff)` → `createInfoEmbed()`
- Couleur custom → `createCustomEmbed({ color, ... })`

3. **Tester après CHAQUE fichier :**
```bash
cd bot && npm run build
```

### ✅ Vérification Batch 5
```bash
npm run build
# Tous les fichiers du batch 5 doivent compiler
```

---

## 📦 Batch 6: Migration des Boutons (15 occurrences)

**Fichiers concernés :**
- `expedition.handlers.ts`
- `character-admin.components.ts`
- Autres handlers avec boutons

### Import à ajouter
```typescript
import { createActionButtons, createConfirmationButtons } from "../../utils/discord-components";
```

### Pattern de migration

**Boutons d'action :**
```typescript
// AVANT
const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("expedition_leave")
    .setLabel("Quitter")
    .setStyle(ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId("expedition_transfer")
    .setLabel("Transférer")
    .setStyle(ButtonStyle.Primary)
);

// APRÈS
const buttonRow = createActionButtons([
  {
    customId: "expedition_leave",
    label: "Quitter",
    style: ButtonStyle.Danger,
  },
  {
    customId: "expedition_transfer",
    label: "Transférer",
    style: ButtonStyle.Primary,
  }
]);
```

**Boutons de confirmation :**
```typescript
// AVANT
const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("action_confirm")
    .setLabel("✅ Confirmer")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("action_cancel")
    .setLabel("❌ Annuler")
    .setStyle(ButtonStyle.Danger)
);

// APRÈS
const row = createConfirmationButtons("action");
```

### ✅ Vérification Batch 6
```bash
cd bot && npm run build
```

---

## 🚨 Règles STRICTES

### ✅ À FAIRE OBLIGATOIREMENT
1. **Tester après CHAQUE fichier** : `npm run build`
2. **Si le build casse** : ARRÊTER immédiatement, documenter l'erreur
3. **Commit après chaque batch réussi** : `git commit -m "refactor(phase1-batchX): description"`
4. **Respecter les patterns** définis dans ce prompt
5. **Ne PAS modifier la logique métier** (seulement l'UI)

### ❌ NE JAMAIS FAIRE
1. Modifier les noms de fonctions exportées
2. Changer les types ou interfaces
3. Toucher aux tests
4. Continuer si le build est cassé
5. Modifier plusieurs fichiers avant de tester

---

## 📊 Métriques de Validation

**Avant le refactoring :**
```bash
grep -rn "new EmbedBuilder" bot/src --include="*.ts" | wc -l
# Résultat attendu : 37
```

**Après Phase 1 complète :**
```bash
grep -rn "new EmbedBuilder" bot/src --include="*.ts" | wc -l
# Résultat attendu : 1 (seulement dans utils/embeds.ts)
```

**Lignes gagnées :** ~570

---

## ✅ Checklist Finale

Après avoir complété TOUS les batches :

- [ ] 36 embeds migrés (Batches 1-5)
- [ ] 15 boutons migrés (Batch 6)
- [ ] `npm run build` passe ✅
- [ ] `npm run lint` sans nouvelles erreurs ✅
- [ ] Tous les commits créés
- [ ] Fichier `docs/refactoring-progress.md` mis à jour

---

## 📝 Rapport Final à Générer

Quand tu as terminé, génère ce rapport :

```markdown
# Rapport Phase 1 - Refactoring Embeds

## Résumé
- **Embeds migrés :** X/36
- **Boutons migrés :** X/15
- **Lignes supprimées :** ~XXX
- **Durée :** XXX minutes

## Fichiers modifiés
1. character-admin.interactions.ts
2. users.handlers.ts
3. [etc.]

## Tests
- Build : ✅/❌
- ESLint : ✅/❌

## Problèmes rencontrés
[Liste des problèmes ou "Aucun"]

## Prochaine étape
Phase 2 : Décomposition de expedition.handlers.ts
```

---

## 🚀 Commande de Lancement

**Pour commencer, utilise cette commande :**

```
Exécute le Batch 1 du refactoring Phase 1.
Suis exactement les instructions du fichier supernova-prompt-phase1.md.
Teste après chaque fichier avec npm run build.
Si tout passe, commit et passe au Batch 2.
```

**Bon refactoring, Supernova ! 🚀**

---

*Créé par Claude Code - Collaboration Claude + Supernova + Utilisateur*
*Date: ${new Date().toISOString().split('T')[0]}*

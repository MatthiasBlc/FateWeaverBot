# 🎯 Prompt Supernova - Finalisation Phase 1

**Mission : Terminer les 6 fichiers restants + Batch 6 (Boutons)**
**Équipe : Claude Code + Supernova + Utilisateur**

---

## 📋 État Actuel

✅ **Déjà fait (Session précédente) :**
- character-admin.interactions.ts (5 embeds)
- users.handlers.ts (1 embed)
- expedition.handlers.ts (8 embeds)
- stock-admin.handlers.ts (7 embeds)
- chantiers.handlers.ts (1 embed)
- hunger.handlers.ts (3 embeds)

🎯 **Reste à faire (Cette session) :**
- expedition-admin.handlers.ts (5 embeds)
- config.handlers.ts (4 embeds)
- stock.handlers.ts (1 embed)
- foodstock.handlers.ts (1 embed)
- help.utils.ts (1 embed)
- hunger.utils.ts (1 embed)
- Migration boutons (Batch 6)

---

## 📦 Fichier 1: expedition-admin.handlers.ts (5 embeds)

**Fichier :** `bot/src/features/admin/expedition-admin.handlers.ts`

### Import à ajouter
```typescript
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../utils/embeds";
```

### Pattern à suivre
Cherche tous les `new EmbedBuilder()` dans ce fichier (environ lignes 59, 112, 296, 358, 401).

**Pour chaque embed :**
- Couleur `0x0099ff` → `createInfoEmbed()`
- Couleur `0x00ff00` → `createSuccessEmbed()`
- Couleur `0xff0000` → `createErrorEmbed()`

**Exemple de transformation :**
```typescript
// AVANT (ligne ~59)
const embed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle("🚀 Expédition créée")
  .setDescription("...")
  .setTimestamp();

// APRÈS
const embed = createInfoEmbed(
  "🚀 Expédition créée",
  "..."
);
```

### Vérification
```bash
npm run build
```

---

## 📦 Fichier 2: config.handlers.ts (4 embeds)

**Fichier :** `bot/src/features/config/config.handlers.ts`

### Import à ajouter
```typescript
import { createInfoEmbed, createSuccessEmbed, createWarningEmbed } from "../../utils/embeds";
```

### Embeds à migrer (lignes ~119, 148, 183, 209)

**Exemple :**
```typescript
// AVANT (ligne ~148)
const successEmbed = new EmbedBuilder()
  .setColor(0x00ff00)
  .setTitle("✅ Configuration mise à jour")
  .setDescription(...)
  .setTimestamp();

// APRÈS
const successEmbed = createSuccessEmbed(
  "Configuration mise à jour",
  ...
);
```

**Pour timeout embed (ligne ~209) :**
```typescript
// AVANT
const timeoutEmbed = new EmbedBuilder()
  .setColor(0xffa500)  // Orange = Warning
  .setTitle("⏱️ Temps écoulé")
  ...

// APRÈS
const timeoutEmbed = createWarningEmbed(
  "⏱️ Temps écoulé",
  ...
);
```

### Vérification
```bash
npm run build
```

---

## 📦 Fichier 3: stock.handlers.ts (1 embed)

**Fichier :** `bot/src/features/stock/stock.handlers.ts`

### Import à ajouter
```typescript
import { createCustomEmbed, getStockColor } from "../../utils/embeds";
```

### Embed à migrer (ligne ~77)

```typescript
// AVANT
const embed = new EmbedBuilder()
  .setColor(getStockColorFunction(stockLevel))  // fonction locale possible
  .setTitle("📦 Stock")
  .setDescription(...)
  .setTimestamp();

// APRÈS
const embed = createCustomEmbed({
  color: getStockColor(stockLevel),
  title: "📦 Stock",
  description: ...,
  timestamp: true,
});
```

⚠️ **Si fonction locale `getStockColorFunction` existe** → la supprimer (déjà dans utils/embeds.ts)

### Vérification
```bash
npm run build
```

---

## 📦 Fichier 4: foodstock.handlers.ts (1 embed)

**Fichier :** `bot/src/features/foodstock/foodstock.handlers.ts`

### Import à ajouter
```typescript
import { createCustomEmbed, getStockColor } from "../../utils/embeds";
```

### Embed à migrer (ligne ~75)

**Même pattern que stock.handlers.ts :**
```typescript
// AVANT
const embed = new EmbedBuilder()
  .setColor(...)
  .setTitle("🍖 Stock Nourriture")
  .setTimestamp();

// APRÈS
const embed = createCustomEmbed({
  color: getStockColor(...),
  title: "🍖 Stock Nourriture",
  timestamp: true,
}).addFields(...);
```

### Vérification
```bash
npm run build
```

---

## 📦 Fichier 5: help.utils.ts (1 embed)

**Fichier :** `bot/src/features/help/help.utils.ts`

### Import à ajouter
```typescript
import { createInfoEmbed } from "../../utils/embeds";
```

### Embed à migrer (ligne ~6)

```typescript
// AVANT
const embed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle("ℹ️ Aide")
  .setDescription(...)
  .setTimestamp();

// APRÈS
const embed = createInfoEmbed(
  "ℹ️ Aide",
  ...
).addFields(...);
```

### Vérification
```bash
npm run build
```

---

## 📦 Fichier 6: hunger.utils.ts (1 embed)

**Fichier :** `bot/src/features/hunger/hunger.utils.ts`

### Import à ajouter
```typescript
import { createCustomEmbed, getHungerColor } from "../../utils/embeds";
```

### Embed à migrer (ligne ~15)

```typescript
// AVANT
const embed = new EmbedBuilder()
  .setColor(getHungerColorLocal(hungerLevel))  // fonction locale possible
  .setTitle("🍖 Faim")
  .setDescription(...)
  .setTimestamp();

// APRÈS
const embed = createCustomEmbed({
  color: getHungerColor(hungerLevel),
  title: "🍖 Faim",
  description: ...,
  timestamp: true,
});
```

⚠️ **Si fonction locale `getHungerColorLocal` existe** → la supprimer (déjà dans utils/embeds.ts)

### Vérification
```bash
npm run build
```

---

## 📦 Batch 6: Migration des Boutons (15 occurrences)

### Fichiers à analyser
```bash
# Chercher tous les boutons manuels
grep -rn "new ButtonBuilder" src/features --include="*.ts"
grep -rn "new ActionRowBuilder<ButtonBuilder>" src/features --include="*.ts"
```

### Import à ajouter (dans chaque fichier concerné)
```typescript
import { createActionButtons, createConfirmationButtons } from "../../utils/discord-components";
```

### Pattern 1: Boutons d'action simples

**AVANT :**
```typescript
const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("action_confirm")
    .setLabel("Confirmer")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("action_cancel")
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Danger)
);
```

**APRÈS :**
```typescript
const row = createConfirmationButtons("action");
```

### Pattern 2: Boutons personnalisés

**AVANT :**
```typescript
const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("expedition_join")
    .setLabel("Rejoindre")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("🚀"),
  new ButtonBuilder()
    .setCustomId("expedition_leave")
    .setLabel("Quitter")
    .setStyle(ButtonStyle.Danger)
    .setEmoji("🚪")
);
```

**APRÈS :**
```typescript
const row = createActionButtons([
  {
    customId: "expedition_join",
    label: "Rejoindre",
    style: ButtonStyle.Primary,
    emoji: "🚀"
  },
  {
    customId: "expedition_leave",
    label: "Quitter",
    style: ButtonStyle.Danger,
    emoji: "🚪"
  }
]);
```

### Vérification après chaque fichier
```bash
npm run build
```

---

## 🚨 Règles Strictes (Rappel)

### ✅ OBLIGATOIRE
1. **Test après CHAQUE fichier** : `npm run build`
2. **Si erreur** : STOP et documente
3. **Commit après chaque fichier** : `git commit -m "refactor(phase1): migrate [filename]"`
4. Ne PAS modifier la logique métier
5. Respecter exactement les patterns ci-dessus

### ❌ INTERDIT
1. Modifier plusieurs fichiers avant de tester
2. Continuer si le build casse
3. Changer les noms de fonctions exportées
4. Modifier les types/interfaces

---

## 📊 Métriques Finales Attendues

**Après cette session :**
```bash
# Embeds restants (seulement dans utils)
grep -rn "new EmbedBuilder" src --include="*.ts" | wc -l
# Attendu: 5 (seulement dans utils/embeds.ts)

# Boutons restants
grep -rn "new ActionRowBuilder<ButtonBuilder>" src/features --include="*.ts" | wc -l
# Attendu: 0 ou <3
```

---

## ✅ Checklist de Finalisation

Après avoir terminé TOUS les fichiers :

- [ ] 6 fichiers migrés (expedition-admin, config, stock, foodstock, help, hunger)
- [ ] Batch 6 terminé (boutons migrés)
- [ ] `npm run build` ✅
- [ ] `npm run lint` ✅
- [ ] Tous les commits créés
- [ ] Métriques validées

---

## 📝 Rapport Final à Générer

```markdown
# Phase 1 - TERMINÉE ✅

## Fichiers migrés (Session finale)
1. ✅ expedition-admin.handlers.ts (5 embeds)
2. ✅ config.handlers.ts (4 embeds)
3. ✅ stock.handlers.ts (1 embed)
4. ✅ foodstock.handlers.ts (1 embed)
5. ✅ help.utils.ts (1 embed)
6. ✅ hunger.utils.ts (1 embed)

## Boutons migrés
- Total : X boutons migrés vers utils

## Tests
- Build : ✅
- ESLint : ✅

## Métriques
- Embeds dans features : 0
- Embeds dans utils : 5 (normal)
- Lignes totales : [à vérifier]
- Objectif -570 lignes : [pourcentage]

## Problèmes
[Aucun ou liste]

## ✅ Phase 1 Milestone Atteint
Toutes les embeds migrées vers utils centralisé !
Prêt pour Phase 2 : Décomposition Expeditions
```

---

## 🚀 Commande de Lancement

**Copie cette commande dans Supernova :**

```
Exécute la finalisation de la Phase 1 du refactoring.
Suis exactement le fichier supernova-prompt-phase1-finalisation.md.

Migre dans cet ordre :
1. expedition-admin.handlers.ts
2. config.handlers.ts
3. stock.handlers.ts
4. foodstock.handlers.ts
5. help.utils.ts
6. hunger.utils.ts
7. Batch 6: Boutons

Teste après CHAQUE fichier avec npm run build.
Commit après chaque fichier qui passe.
Si erreur : STOP et documente.

Génère le rapport final quand tout est terminé.
```

---

**Bon courage pour cette dernière ligne droite, Supernova ! 🏁**

*Créé par Claude Code - Collaboration finale Phase 1*
*Date: 2025-10-08*

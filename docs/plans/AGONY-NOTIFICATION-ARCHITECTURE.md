# Architecture des Notifications d'Agonie

**Date:** 2025-11-05
**Status:** ✅ Implémenté (Option A)
**Type:** Documentation d'architecture

---

## 🎯 Problématique

Lorsqu'un personnage entre en agonie (HP=1 ou hunger=0) depuis n'importe quelle source (cron de faim, commande admin, manger de la nourriture), il faut envoyer une notification publique dans le canal de logs Discord en taggant le joueur.

**Défi:** Comment permettre au backend de communiquer directement avec Discord sans passer par une requête du bot ?

---

## 🔍 Solutions Analysées

### Option A: Login du Client Backend ✅ RETENUE

**Description:** Le backend maintient son propre client Discord.js et se connecte avec le même `DISCORD_TOKEN` que le bot.

**Implémentation:**
```typescript
// backend/src/services/discord-notification.service.ts
class DiscordNotificationService {
  async initialize(): Promise<void> {
    await this.client.login(env.DISCORD_TOKEN);
  }
}

// backend/src/app.ts
discordNotificationService.initialize();
```

**Avantages:**
- ✅ **Implémentation ultra-rapide** (30 min, 2 fichiers)
- ✅ **Aucune nouvelle dépendance**
- ✅ **Aucune configuration Docker supplémentaire**
- ✅ **Pattern cohérent** avec les autres notifications (expéditions, saisons)
- ✅ **Variable d'environnement déjà existante** (`DISCORD_TOKEN`)

**Inconvénients:**
- ⚠️ Deux clients Discord connectés simultanément (bot + backend)
- ⚠️ Couplage backend-Discord (mais déjà existant)

**Complexité:** 🟢 Très faible (~30 min)

---

### Option B: Webhook HTTP (Backend → Bot) ❌ NON RETENUE

**Description:** Le bot expose un endpoint HTTP, le backend envoie des requêtes POST.

**Avantages:**
- ✅ Un seul client Discord (le bot)
- ✅ Découplage backend-Discord

**Inconvénients:**
- ❌ Serveur HTTP à créer côté bot (~3 nouveaux fichiers)
- ❌ Gestion authentification, retry, timeout
- ❌ Configuration Docker (ports, variables env)

**Complexité:** 🟡 Moyenne (~2-3h, 6 fichiers, ~170 lignes)

---

### Option C: Redis Pub/Sub ❌ NON RETENUE

**Description:** Backend publie sur Redis, bot subscribe et envoie à Discord.

**Avantages:**
- ✅ Architecture professionnelle microservices
- ✅ Scalable (plusieurs bots, plusieurs guildes)
- ✅ Utilisable pour d'autres fonctionnalités (cache, queues)

**Inconvénients:**
- ❌ **Infrastructure supplémentaire** (Redis container)
- ❌ Complexité élevée (gestion erreurs, reconnexion, monitoring)
- ❌ Sur-engineering pour le besoin actuel

**Complexité:** 🔴 Élevée (~1-2 jours, 5-7 fichiers, ~300-400 lignes)

---

## ✅ Implémentation (Option A)

### Fichiers Modifiés

1. **`backend/src/services/discord-notification.service.ts`**
   - Ajout méthode `initialize()` pour login du client
   - Ajout méthode `ensureReady()` pour vérifier l'état
   - Ajout guard `ensureReady()` dans toutes les méthodes d'envoi

2. **`backend/src/app.ts`**
   - Appel `discordNotificationService.initialize()` au démarrage
   - Gestion du cas test mode (skip login)

3. **`backend/src/util/agony-notification.ts`**
   - Ajout paramètre `userDiscordId` pour tag joueur
   - Format message: `⚠️ **[Nom]** (<@userDiscordId>) vient de passer en agonie ! 💀`

4. **Appels mis à jour:**
   - `backend/src/cron/hunger-increase.cron.ts:70`
   - `backend/src/controllers/character/character-stats.controller.ts:142`
   - `backend/src/controllers/character/character-stats.controller.ts:306`
   - `backend/src/controllers/character/character-stats.controller.ts:422`

---

## 📊 Architecture Actuelle

```
┌─────────────────────────────────────────────────────────────┐
│                    Discord (Serveur)                        │
└─────────────────────────────────────────────────────────────┘
                    ▲                      ▲
                    │                      │
         DISCORD_TOKEN (même token)       │
                    │                      │
         ┌──────────┴──────────┐   ┌──────┴────────┐
         │   Bot Client        │   │ Backend Client │
         │  (discord.js)       │   │  (discord.js)  │
         └─────────────────────┘   └────────────────┘
                │                          │
                │                          │
         Interactions            Notifications automatiques
         utilisateur             (agonie, expéditions, etc)
```

---

## 🔧 Utilisation de `discordNotificationService`

### Messages Actuellement Envoyés

| Type | Méthode | Canal Cible | Source |
|------|---------|-------------|--------|
| **Agonie** | `sendNotification()` | `logChannelId` | Cron faim, Admin stats |
| **Expéditions** | `sendExpeditionNotification()` | Canal dédié ou `logChannelId` | Controller expéditions |
| **Saisons** | `sendSeasonChangeNotification()` | Canal spécifique | Cron saisons |
| **Messages quotidiens** | `sendDailyMessage()` | `dailyMessageChannelId` | ⚠️ Doublé (bot + backend) |

### Format Message d'Agonie

```typescript
await notifyAgonyEntered(
  guildDiscordId: string,     // ID Discord de la guilde
  characterName: string,       // Nom du personnage
  userDiscordId?: string,      // ID Discord du joueur (pour tag)
  cause?: 'hunger' | 'damage' | 'other'
);
```

**Rendu Discord:**
```
⚠️ **Jean Dupont** (<@123456789>) vient de passer en agonie à cause de la faim ! 💀
```

---

## 🚨 Points d'Attention

### 1. Deux Clients Discord Simultanés

**Situation:** Bot ET backend connectés avec le même token.

**Discord.js gère ça ?** ✅ Oui, Discord autorise plusieurs connexions avec le même token (jusqu'à 1000 sessions simultanées). Les deux clients reçoivent les événements indépendamment.

**Risques:**
- ⚠️ Rate limiting si trop de requêtes API Discord combinées
- ⚠️ Duplication possible si les deux tentent d'envoyer le même message

**Mitigation actuelle:**
- Bot = Interactions utilisateur uniquement
- Backend = Notifications automatiques uniquement
- **Pas de chevauchement fonctionnel**

### 2. Messages Quotidiens - Doublon Résolu ✅

**Problème découvert:** Deux implémentations en parallèle :
- `bot/src/cron/daily-messages.cron.ts` → ✅ Fonctionne (envoie des embeds)
- `backend/src/cron/daily-message.cron.ts` → ❌ Ne fonctionnait pas (client jamais login)

**Action prise:** Cron backend désactivé dans `backend/src/app.ts:73-79`
- Import commenté (ligne 19)
- Appel `setupDailyMessageJob()` commenté (lignes 74-79)
- **Seul le bot envoie maintenant les messages quotidiens** (embeds élégants)

---

## 🔄 Migration Future (Optionnelle)

Si le projet évolue vers :
- Multiple bots Discord
- Forte charge de notifications
- Besoin de découplage critique

**Recommandation:** Migrer vers **Option B (Webhook)** ou **Option C (Redis)**.

**Avantage:** L'interface `notifyAgonyEntered()` reste inchangée, seule l'implémentation interne change.

---

## 📝 Conventions de Code

### Quand appeler `notifyAgonyEntered()` ?

**Règle:** Appeler uniquement si `agonyUpdate.enteredAgony === true`

```typescript
const agonyUpdate = applyAgonyRules(...);

if (agonyUpdate.enteredAgony && guild.discordGuildId) {
  await notifyAgonyEntered(
    guild.discordGuildId,
    characterName,
    userDiscordId,
    cause
  );
}
```

### Sources d'Agonie

1. ✅ **Cron de faim quotidien** (`hunger-increase.cron.ts`)
2. ✅ **Modification admin HP/hunger** (`character-stats.controller.ts:422`)
3. ✅ **Manger de la nourriture** (`character-stats.controller.ts:142,306`)
4. ❓ **Autres sources potentielles** (à vérifier)

---

## ✅ Tests de Validation

### Tests Manuels à Effectuer

1. **Test local (character-admin):**
   ```bash
   docker compose up -d
   # Utiliser /character-admin pour baisser HP d'un perso à 1
   # Vérifier notification dans logChannelId avec tag joueur
   ```

2. **Test cron (hunger):**
   ```bash
   # Attendre minuit OU exécuter manuellement :
   cd backend && npx tsx src/cron/hunger-increase.cron.ts
   ```

3. **Vérifier logs backend:**
   ```bash
   docker compose logs -f backenddev | grep "Discord notification"
   ```

**Critères de succès:**
- ✅ Message apparaît dans le canal de logs Discord
- ✅ Joueur est tagué (`<@userId>`)
- ✅ Message correct selon la cause (faim/blessures)
- ✅ Pas d'erreur dans les logs backend

---

## 🚀 Configuration Production

### Variables d'Environnement

**✅ Tout est déjà configuré !**

La variable `DISCORD_TOKEN` est passée au backend dans :
- ✅ `docker-compose.yml` (dev) - ligne 56
- ✅ `docker-compose.prod.yml` (prod) - ligne 52
- ✅ `deploy_prod.sh` - ligne 29 (export)
- ✅ `.github/workflows/deploy.yml` - ligne 88

**Aucun secret à ajouter** - Le secret GitHub `DISCORD_TOKEN` existant est automatiquement injecté au backend.

Le prochain déploiement sur `master` activera automatiquement les notifications d'agonie en production.

---

## 📚 Références

- Discord.js Multiple Connections: https://discord.js.org/#/docs/main/stable/general/welcome
- Agony System Logic: `backend/src/util/agony.ts`
- Best Practices: `.claude/best-practices.md`

---

**Créé lors de la session EPCT du 2025-11-05**

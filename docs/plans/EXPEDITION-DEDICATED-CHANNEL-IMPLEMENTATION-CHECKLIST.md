# Checklist d'Implémentation : Channel Dédié par Expédition

## 🚀 Commande de Lancement

```
Implémente EXPEDITION-DEDICATED-CHANNEL-PLAN.md phases 1 à 5
```

## ⚠️ RÈGLE CRITIQUE

**NE MODIFIER AUCUN CONTENU DE MESSAGE EXISTANT**

- Les messages/logs existants = IDENTIQUES (texte, emojis, variables, format)
- Seul le **routing** change (destination du message)
- Remplacer uniquement l'appel de fonction : `sendLogMessage()` → `sendExpeditionLog()`

---

## Phase 1 : Database (3-4h) ✅

### 1.1 Modifier le Schema Prisma
- [ ] Ajouter `expeditionChannelId String? @map("expedition_channel_id")` au modèle Expedition
- [ ] Ajouter `channelConfiguredAt DateTime? @map("channel_configured_at")` au modèle Expedition
- [ ] Ajouter `channelConfiguredBy String? @map("channel_configured_by")` au modèle Expedition
- [ ] **Fichier** : `backend/prisma/schema.prisma` (après ligne 61)

### 1.2 Migration
- [ ] Exécuter : `npx prisma migrate dev --name add_expedition_channel`
- [ ] Vérifier que la migration s'est bien appliquée

### 1.3 Types TypeScript
- [ ] Vérifier que les types sont générés : `npx prisma generate`
- [ ] Mettre à jour `bot/src/types/entities/expedition.ts` si nécessaire

---

## Phase 2 : Backend API (4-5h) ✅

### 2.1 Service Expedition
- [ ] Ajouter méthode `setExpeditionChannel()` dans `backend/src/services/expedition.service.ts`
- [ ] Ajouter méthode `getExpeditionChannelId()` dans `backend/src/services/expedition.service.ts`

### 2.2 Controller
- [ ] Créer handler `setExpeditionChannel` dans `backend/src/controllers/expedition.ts`
- [ ] Créer handler `sendExpeditionLog` dans `backend/src/controllers/expedition.ts`

### 2.3 Routes
- [ ] Ajouter route `POST /:id/channel` dans `backend/src/routes/expedition.routes.ts`
- [ ] Ajouter route `POST /:id/log` dans `backend/src/routes/expedition.routes.ts`

### 2.4 Notification Service
- [ ] Ajouter méthode `sendExpeditionNotification()` dans `backend/src/services/discord-notification.service.ts`
- [ ] Ajouter méthode privée `sendNotificationToChannel()` dans `backend/src/services/discord-notification.service.ts`

---

## Phase 3 : Frontend Admin (5-6h) ✅

### 3.1 Bouton Admin
- [ ] Ajouter bouton "📺 Configurer Channel" dans `bot/src/features/admin/expedition-admin.handlers.ts:~135`
- [ ] Afficher le channel actuel dans l'embed si configuré (ligne ~122-145)

### 3.2 Handlers
- [ ] Créer `handleExpeditionAdminConfigureChannel()` dans `bot/src/features/admin/expedition-admin.handlers.ts`
- [ ] Créer `handleExpeditionChannelSelect()` dans `bot/src/features/admin/expedition-admin.handlers.ts`
- [ ] Enregistrer les handlers dans le router

### 3.3 API Service
- [ ] Ajouter méthode `setExpeditionChannel()` dans `bot/src/services/api/expedition-api.service.ts`
- [ ] Ajouter méthode `sendExpeditionLog()` dans `bot/src/services/api/expedition-api.service.ts`

---

## Phase 4 : Logs System (2-3h) ✅

⚠️ **RÈGLE** : Remplacer UNIQUEMENT la fonction d'envoi, JAMAIS le contenu du message !

### 4.1 Manger en Expédition
- [ ] Modifier `bot/src/features/hunger/eat-more.handlers.ts:~393-397`
- [ ] Remplacer `sendLogMessage(guildId, client, logMessage)` par `sendExpeditionLog(expeditionId, guildId, logMessage)`
- [ ] ⚠️ La variable `logMessage` reste IDENTIQUE (aucun changement de texte)

### 4.2 Vote Retour d'Urgence
- [ ] Modifier `bot/src/features/expeditions/handlers/expedition-emergency.ts:~75-83`
- [ ] Remplacer `sendLogMessage(guildId, client, logMessage)` par `sendExpeditionLog(expeditionId, guildId, logMessage)`
- [ ] ⚠️ La variable `logMessage` reste IDENTIQUE (aucun changement de texte)

---

## Phase 5 : Tests (1-2h) ✅

### 5.1 Tests Manuels
- [ ] Créer une expédition
- [ ] Configurer un channel dédié via `/expedition-admin`
- [ ] Passer l'expédition en DEPARTED (manuellement ou attendre 8h)
- [ ] Tester manger en expédition → vérifie que le log va au channel dédié
- [ ] Tester vote retour d'urgence → vérifie que le log va au channel dédié
- [ ] Désactiver le channel dédié
- [ ] Tester que les logs reviennent au channel global
- [ ] Vérifier que les logs de PLANNING restent dans le channel global

### 5.2 Tests de Fallback
- [ ] Configurer un channel puis le supprimer sur Discord
- [ ] Vérifier que les logs vont au channel global (fallback)
- [ ] Vérifier qu'aucune erreur n'est levée

### 5.3 Tests de Nettoyage (optionnel)
- [ ] Faire revenir une expédition (RETURNED)
- [ ] Vérifier le comportement du channel (selon décision)

---

## ⚠️ Points d'Attention

### Sécurité
- ✅ Vérifier les permissions admin avant de permettre la configuration
- ✅ Valider que le channel existe et est accessible
- ✅ Fallback gracieux si le channel n'est plus accessible

### Performance
- ✅ Pas de requête DB supplémentaire : `getExpeditionChannelId()` vérifie status + channelId
- ✅ Cache déjà en place pour les expéditions (5 min TTL)

### UX
- ✅ Message de confirmation après configuration
- ✅ Affichage du channel actuel dans l'embed admin
- ✅ Log de l'action de configuration dans le channel global

---

## 📊 Estimation Totale

- **Phase 1** : 3-4h
- **Phase 2** : 4-5h
- **Phase 3** : 5-6h
- **Phase 4** : 2-3h
- **Phase 5** : 1-2h

**Total** : 15-20h

---

## 🔗 Fichiers Principaux à Modifier

### Backend (6 fichiers)
1. `backend/prisma/schema.prisma`
2. `backend/src/services/expedition.service.ts`
3. `backend/src/services/discord-notification.service.ts`
4. `backend/src/controllers/expedition.ts`
5. `backend/src/routes/expedition.routes.ts`

### Frontend (4 fichiers)
1. `bot/src/features/admin/expedition-admin.handlers.ts`
2. `bot/src/services/api/expedition-api.service.ts`
3. `bot/src/features/hunger/eat-more.handlers.ts`
4. `bot/src/features/expeditions/handlers/expedition-emergency.ts`

**Total** : 10 fichiers

---

## ✅ Validation Finale

Avant de considérer l'implémentation terminée :

- [ ] Toutes les phases sont complétées
- [ ] Tous les tests passent
- [ ] Le build compile sans erreur (`npm run build` dans `/bot`)
- [ ] La documentation est à jour
- [ ] Les logs fonctionnent correctement en DEPARTED
- [ ] Le fallback fonctionne si pas de channel configuré
- [ ] Les logs de PLANNING restent dans le channel global

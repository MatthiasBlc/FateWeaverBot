# Plan d'Évolution : Channel Discord Dédié par Expédition

## 🚀 COMMANDE RAPIDE POUR LANCER L'IMPLÉMENTATION

```
Implémente le plan EXPEDITION-DEDICATED-CHANNEL-PLAN.md en suivant les 5 phases.
Commence par Phase 1 (Database), puis continue séquentiellement.
```

---

## ⚠️ RÈGLE CRITIQUE

**NE MODIFIER AUCUN CONTENU DE MESSAGE EXISTANT**

- Les messages/logs existants doivent rester EXACTEMENT identiques
- Seul le **routing** (où le message est envoyé) change
- Aucune modification de texte, emojis, variables, ou format
- Seulement remplacer `sendLogMessage()` par `sendExpeditionLog()` quand en DEPARTED

---

## 📋 Vue d'ensemble

**Objectif** : Permettre aux admins de configurer un channel Discord spécifique pour chaque expédition, où tous les logs liés à cette expédition seront envoyés pendant qu'elle est en statut DEPARTED.

**Comportement** :
- Si un channel est configuré → Logs envoyés dans ce channel dédié (routing différent)
- Si pas de channel configuré → Logs envoyés dans le channel global (comportement actuel)

**Logs concernés** : Uniquement les 3 logs de la section "4️⃣ ACTIONS PENDANT DEPARTED" (manger, vote urgence)

**Contenu des messages** : AUCUNE MODIFICATION - seul le canal de destination change

---

## 🎯 Fonctionnalités Requises

### 1. Configuration par Expédition
- Nouveau bouton dans `/expedition-admin` : **"Configurer Channel"**
- Sélection d'un channel Discord via menu déroulant
- Possibilité de désactiver le channel dédié (revenir au global)
- Afficher le channel actuellement configuré

### 2. Envoi des Logs
- **Pendant DEPARTED** : Tous les logs vont au channel dédié (si configuré)
- **Autres statuts** : Logs au channel global
- Types de logs concernés :
  - 🍽️ Manger en expédition
  - 🚨 Votes retour d'urgence
  - 📦 Transferts de ressources (optionnel)
  - ⚠️ Événements critiques (membres retirés, etc.)

### 3. Gestion du Cycle de Vie
- **PLANNING/LOCKED** : Pas de channel dédié actif
- **DEPARTED** : Channel dédié actif
- **RETURNED** : Channel dédié désactivé (archivage optionnel)

---

## 🗂️ Architecture Technique

### Phase 1 : Modèle de Données

#### 1.1 Modification du Schema Prisma

**Fichier** : `backend/prisma/schema.prisma`

```prisma
model Expedition {
  id                     String                    @id @default(cuid())
  name                   String
  townId                 String                    @map("town_id")
  status                 ExpeditionStatus          @default(PLANNING)
  duration               Int
  returnAt               DateTime?                 @map("return_at")
  createdBy              String                    @map("created_by")
  pendingEmergencyReturn Boolean                   @default(false)

  // Direction fields
  initialDirection       Direction?                @map("initial_direction")
  path                   Direction[]               @default([])
  currentDayDirection    Direction?                @map("current_day_direction")
  directionSetBy         String?                   @map("direction_set_by")
  directionSetAt         DateTime?                 @map("direction_set_at")

  // 🆕 NOUVEAU : Channel dédié
  expeditionChannelId    String?                   @map("expedition_channel_id")  // Discord Channel ID
  channelConfiguredAt    DateTime?                 @map("channel_configured_at")  // Optionnel: audit
  channelConfiguredBy    String?                   @map("channel_configured_by")  // Optionnel: qui a configuré

  town                   Town                      @relation(...)
  members                ExpeditionMember[]
  emergencyVotes         ExpeditionEmergencyVote[]
  createdAt              DateTime                  @default(now())
  updatedAt              DateTime                  @updatedAt
}
```

**Migration** :
```bash
npx prisma migrate dev --name add_expedition_channel
```

---

### Phase 2 : Backend API

#### 2.1 Nouveau Endpoint

**Fichier** : `backend/src/controllers/expedition.ts`

```typescript
/**
 * Configure or update expedition dedicated channel
 * POST /api/expeditions/:id/channel
 */
export const setExpeditionChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { channelId, configuredBy } = req.body; // channelId = null pour désactiver

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await container.expeditionService.setExpeditionChannel(
      id,
      channelId,
      configuredBy
    );

    res.json(expedition);
  } catch (error) {
    next(error);
  }
};
```

**Route** : `backend/src/routes/expedition.routes.ts`
```typescript
router.post("/:id/channel", setExpeditionChannel);
```

---

#### 2.2 Service Backend

**Fichier** : `backend/src/services/expedition.service.ts`

```typescript
/**
 * Set or update expedition dedicated channel
 */
async setExpeditionChannel(
  expeditionId: string,
  channelId: string | null,
  configuredBy: string
): Promise<Expedition> {
  return await prisma.expedition.update({
    where: { id: expeditionId },
    data: {
      expeditionChannelId: channelId,
      channelConfiguredAt: channelId ? new Date() : null,
      channelConfiguredBy: channelId ? configuredBy : null,
    },
    include: {
      town: true,
      members: {
        include: {
          character: true,
        },
      },
    },
  });
}

/**
 * Get expedition channel ID (if configured and expedition is DEPARTED)
 */
async getExpeditionChannelId(expeditionId: string): Promise<string | null> {
  const expedition = await prisma.expedition.findUnique({
    where: { id: expeditionId },
    select: {
      status: true,
      expeditionChannelId: true,
    },
  });

  // Only return channel if expedition is DEPARTED and channel is configured
  if (expedition?.status === ExpeditionStatus.DEPARTED && expedition.expeditionChannelId) {
    return expedition.expeditionChannelId;
  }

  return null;
}
```

---

### Phase 3 : Frontend Bot (Admin UI)

#### 3.1 Ajout du Bouton dans Admin

**Fichier** : `bot/src/features/admin/expedition-admin.handlers.ts`

**Localisation** : Fonction `handleExpeditionAdminSelect()` (ligne ~122-145)

```typescript
// Ajouter dans buttonRow1 ou créer une nouvelle row
const channelButton = new ButtonBuilder()
  .setCustomId(`expedition_admin_channel_${expeditionId}`)
  .setLabel("📺 Configurer Channel")
  .setStyle(ButtonStyle.Secondary);

// Afficher le channel actuel dans l'embed si configuré
if (expedition.expeditionChannelId) {
  embed.addFields({
    name: "📺 Channel Dédié",
    value: `<#${expedition.expeditionChannelId}>`,
    inline: true,
  });
}
```

---

#### 3.2 Handler de Sélection du Channel

**Fichier** : `bot/src/features/admin/expedition-admin.handlers.ts`

```typescript
/**
 * Handler: expedition_admin_channel_${expeditionId}
 * Affiche la sélection du channel Discord
 */
export async function handleExpeditionAdminConfigureChannel(
  interaction: ButtonInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const expeditionId = interaction.customId.split("_")[3];

    // Récupérer l'expédition
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.editReply({
        content: "❌ Expédition introuvable.",
      });
      return;
    }

    // Récupérer tous les canaux textuels du serveur
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({
        content: "❌ Impossible de récupérer les informations du serveur.",
      });
      return;
    }

    const channels = guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildText)
      .sort((a, b) => a.position - b.position);

    // Créer le menu de sélection (max 25 options)
    const options: StringSelectMenuOptionBuilder[] = [
      new StringSelectMenuOptionBuilder()
        .setLabel("🚫 Aucun (désactiver)")
        .setValue("none")
        .setDescription("Désactiver le channel dédié pour cette expédition"),
    ];

    channels.forEach((channel) => {
      if (options.length < 25) {
        const textChannel = channel as TextChannel;
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(`#${textChannel.name}`)
            .setValue(textChannel.id)
            .setDescription(`Catégorie: ${textChannel.parent?.name || "Aucune"}`)
        );
      }
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_channel_select:${expeditionId}`)
      .setPlaceholder("Sélectionnez un channel pour cette expédition")
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const currentChannelText = expedition.expeditionChannelId
      ? `<#${expedition.expeditionChannelId}>`
      : "Aucun configuré";

    await interaction.editReply({
      content: `📺 **Configuration du Channel pour "${expedition.name}"**\n\n` +
        `Channel actuel : ${currentChannelText}\n\n` +
        `Sélectionnez un channel Discord où les logs de cette expédition seront envoyés pendant qu'elle est DEPARTED.`,
      components: [row],
    });
  } catch (error) {
    logger.error("Error in handleExpeditionAdminConfigureChannel:", error);
    await interaction.editReply({
      content: "❌ Une erreur est survenue.",
    });
  }
}
```

---

#### 3.3 Handler de Confirmation de Sélection

**Fichier** : `bot/src/features/admin/expedition-admin.handlers.ts`

```typescript
/**
 * Handler: expedition_channel_select:${expeditionId}
 * Confirme et enregistre le channel sélectionné
 */
export async function handleExpeditionChannelSelect(
  interaction: StringSelectMenuInteraction
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const expeditionId = interaction.customId.split(":")[1];
    const selectedChannelId = interaction.values[0];

    // Récupérer l'expédition
    const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.editReply({
        content: "❌ Expédition introuvable.",
      });
      return;
    }

    // Préparer les données
    const channelId = selectedChannelId === "none" ? null : selectedChannelId;

    // Appel API pour configurer le channel
    await apiService.expeditions.setExpeditionChannel(
      expeditionId,
      channelId,
      interaction.user.id
    );

    // Message de confirmation
    const confirmMessage = channelId
      ? `✅ Channel <#${channelId}> configuré pour l'expédition **${expedition.name}**.\n\n` +
        `Les logs seront envoyés dans ce channel lorsque l'expédition sera en statut DEPARTED.`
      : `✅ Channel dédié désactivé pour l'expédition **${expedition.name}**.\n\n` +
        `Les logs seront envoyés dans le channel de logs global.`;

    await interaction.editReply({
      content: confirmMessage,
      components: [],
    });

    // Log de l'action dans le channel global
    const logMessage = channelId
      ? `📺 **${interaction.user.username}** a configuré le channel <#${channelId}> pour l'expédition **${expedition.name}**`
      : `📺 **${interaction.user.username}** a désactivé le channel dédié pour l'expédition **${expedition.name}**`;

    await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
  } catch (error) {
    logger.error("Error in handleExpeditionChannelSelect:", error);
    await interaction.editReply({
      content: "❌ Erreur lors de la configuration du channel.",
    });
  }
}
```

---

#### 3.4 Service API Frontend

**Fichier** : `bot/src/services/api/expedition-api.service.ts`

```typescript
/**
 * Set expedition dedicated channel
 */
async setExpeditionChannel(
  expeditionId: string,
  channelId: string | null,
  configuredBy: string
): Promise<Expedition> {
  try {
    const response = await this.api.post<Expedition>(
      `${this.basePath}/${expeditionId}/channel`,
      {
        channelId,
        configuredBy,
      }
    );
    return response.data;
  } catch (error) {
    logger.error("Error setting expedition channel:", error);
    throw error;
  }
}
```

---

### Phase 4 : Système de Notification

#### 4.1 Modifier le Service de Notification

**Fichier** : `backend/src/services/discord-notification.service.ts`

```typescript
/**
 * Send notification to expedition's dedicated channel (if configured and DEPARTED)
 * Falls back to guild's log channel if no dedicated channel
 */
async sendExpeditionNotification(
  expeditionId: string,
  guildId: string,
  message: string
): Promise<boolean> {
  try {
    // Check if expedition has a dedicated channel
    const expeditionChannelId = await container.expeditionService.getExpeditionChannelId(expeditionId);

    if (expeditionChannelId) {
      // Send to expedition's dedicated channel
      return await this.sendNotificationToChannel(expeditionChannelId, message);
    } else {
      // Fallback to guild's log channel
      return await this.sendNotification(guildId, message);
    }
  } catch (error) {
    logger.error("Error sending expedition notification:", {
      expeditionId,
      guildId,
      error,
    });
    return false;
  }
}

/**
 * Send message to a specific channel ID
 */
private async sendNotificationToChannel(
  channelId: string,
  message: string
): Promise<boolean> {
  try {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      logger.warn(`Channel ${channelId} not found or not text-based`);
      return false;
    }

    await (channel as TextChannel).send(message);
    return true;
  } catch (error) {
    logger.error(`Error sending message to channel ${channelId}:`, error);
    return false;
  }
}
```

---

#### 4.2 Modifier les Appels de Logs dans le Bot

**Fichiers à modifier** :

⚠️ **IMPORTANT** : Ne modifier QUE l'appel de fonction, AUCUN changement au contenu du message !

1. **`bot/src/features/hunger/eat-more.handlers.ts`** (ligne ~393-397)

```typescript
// AVANT
await sendLogMessage(
  interaction.guildId!,
  interaction.client,
  logMessage  // Le message reste EXACTEMENT le même
);

// APRÈS
if (activeExpedition) {
  // Envoyer au channel dédié via le backend (CONTENU IDENTIQUE)
  await apiService.expeditions.sendExpeditionLog(
    activeExpedition.id,
    interaction.guildId!,
    logMessage  // ⚠️ MÊME VARIABLE, MÊME CONTENU
  );
} else {
  // Comportement normal
  await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
}
```

2. **`bot/src/features/expeditions/handlers/expedition-emergency.ts`** (ligne ~79-83)

```typescript
// AVANT
await sendLogMessage(
  interaction.guildId!,
  interaction.client,
  logMessage
);

// APRÈS
await apiService.expeditions.sendExpeditionLog(
  expeditionId,
  interaction.guildId!,
  logMessage  // ⚠️ MÊME VARIABLE, MÊME CONTENU
);
```

---

#### 4.3 Nouveau Endpoint Backend pour Logs

**Fichier** : `backend/src/controllers/expedition.ts`

```typescript
/**
 * Send a log message to expedition's dedicated channel
 * POST /api/expeditions/:id/log
 */
export const sendExpeditionLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { guildId, message } = req.body;

    if (!id || !guildId || !message) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    const sent = await container.discordNotificationService.sendExpeditionNotification(
      id,
      guildId,
      message
    );

    res.json({ success: sent });
  } catch (error) {
    next(error);
  }
};
```

**Route** :
```typescript
router.post("/:id/log", sendExpeditionLog);
```

---

#### 4.4 Service API Frontend pour Logs

**Fichier** : `bot/src/services/api/expedition-api.service.ts`

```typescript
/**
 * Send a log message for an expedition
 */
async sendExpeditionLog(
  expeditionId: string,
  guildId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await this.api.post<{ success: boolean }>(
      `${this.basePath}/${expeditionId}/log`,
      {
        guildId,
        message,
      }
    );
    return response.data.success;
  } catch (error) {
    logger.error("Error sending expedition log:", error);
    return false;
  }
}
```

---

### Phase 5 : Gestion du Cycle de Vie

#### 5.1 Nettoyage à la Fin de l'Expédition (Optionnel)

**Fichier** : `backend/src/services/expedition.service.ts`

```typescript
/**
 * Clear expedition channel when returning
 */
async clearExpeditionChannel(expeditionId: string): Promise<void> {
  await prisma.expedition.update({
    where: { id: expeditionId },
    data: {
      expeditionChannelId: null,
      channelConfiguredAt: null,
      channelConfiguredBy: null,
    },
  });
}
```

**Appeler dans** `returnExpedition()` :
```typescript
async returnExpedition(expeditionId: string): Promise<Expedition> {
  // ... code existant ...

  // Clear expedition channel
  await this.clearExpeditionChannel(expeditionId);

  return updatedExpedition;
}
```

---

## 📊 Checklist d'Implémentation

### ✅ Phase 1 : Modèle de Données
- [ ] Ajouter champs au modèle Prisma
- [ ] Créer et exécuter la migration
- [ ] Mettre à jour les types TypeScript

### ✅ Phase 2 : Backend API
- [ ] Créer endpoint `POST /expeditions/:id/channel`
- [ ] Créer endpoint `POST /expeditions/:id/log`
- [ ] Ajouter méthodes dans `expedition.service.ts`
- [ ] Modifier `discord-notification.service.ts`

### ✅ Phase 3 : Frontend Bot (Admin)
- [ ] Ajouter bouton "Configurer Channel" dans admin
- [ ] Créer handler de sélection du channel
- [ ] Créer handler de confirmation
- [ ] Afficher le channel actuel dans l'embed admin

### ✅ Phase 4 : Système de Logs
- [ ] Modifier logs de `eat-more.handlers.ts`
- [ ] Modifier logs de `expedition-emergency.ts`
- [ ] Modifier logs de `expedition-transfer.ts`
- [ ] Créer méthode API `sendExpeditionLog()`

### ✅ Phase 5 : Tests
- [ ] Tester configuration d'un channel
- [ ] Tester envoi de logs au channel dédié
- [ ] Tester désactivation du channel
- [ ] Tester nettoyage à la fin de l'expédition

---

## 🎨 UX/UI Proposée

### Dans `/expedition-admin`

**Avant** :
```
📍 Expédition: Exploration Nord (DEPARTED)
⏱️ Durée: 3 jours
📅 Retour prévu: 2025-01-15 08:00

[Modifier durée] [Gérer ressources] [Gérer membres]
[Retour forcé]
```

**Après** :
```
📍 Expédition: Exploration Nord (DEPARTED)
⏱️ Durée: 3 jours
📅 Retour prévu: 2025-01-15 08:00
📺 Channel Dédié: #expedition-nord

[Modifier durée] [Gérer ressources] [Gérer membres]
[📺 Configurer Channel]
[Retour forcé]
```

---

### Menu de Sélection du Channel

```
📺 Configuration du Channel pour "Exploration Nord"

Channel actuel : #expedition-nord

Sélectionnez un channel Discord où les logs de cette expédition
seront envoyés pendant qu'elle est DEPARTED.

[Menu déroulant]
└─ 🚫 Aucun (désactiver)
└─ #expedition-nord
└─ #logs-expéditions
└─ #général
└─ ...
```

---

## 🔒 Sécurité et Permissions

### Vérifications à Effectuer

1. **Permissions Discord** :
   - Vérifier que le bot a accès au channel sélectionné
   - Vérifier les permissions d'écriture (`SEND_MESSAGES`)

2. **Permissions Utilisateur** :
   - Seuls les admins peuvent configurer le channel
   - Vérifier `interaction.memberPermissions.has("Administrator")`

3. **Validation** :
   - Vérifier que le channel existe avant de l'enregistrer
   - Gérer les cas où le channel est supprimé après configuration

4. **Fallback** :
   - Si le channel dédié n'est plus accessible, revenir au channel global
   - Logger une erreur mais ne pas bloquer l'envoi

---

## 📈 Améliorations Futures (Optionnelles)

### V2 : Auto-création de Channel

```typescript
/**
 * Auto-create a dedicated channel for an expedition
 */
async autoCreateExpeditionChannel(
  expeditionId: string,
  guildId: string
): Promise<string> {
  const expedition = await prisma.expedition.findUnique({
    where: { id: expeditionId },
    select: { name: true, townId: true },
  });

  if (!expedition) throw new NotFoundError("Expedition", expeditionId);

  const guild = await this.client.guilds.fetch(guildId);
  const channelName = `expedition-${expedition.name.toLowerCase().replace(/\s+/g, "-")}`;

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `Logs de l'expédition ${expedition.name}`,
    reason: `Channel dédié créé automatiquement pour l'expédition`,
  });

  // Configure permissions (optionnel)
  await channel.permissionOverwrites.create(guild.roles.everyone, {
    ViewChannel: true,
    SendMessages: false, // Seul le bot peut écrire
  });

  return channel.id;
}
```

### V3 : Archivage Automatique

- Archiver/verrouiller le channel à la fin de l'expédition
- Garder l'historique accessible en lecture seule
- Supprimer automatiquement après X jours

### V4 : Statistiques

- Compter le nombre de messages envoyés par expédition
- Afficher dans l'embed admin

---

## 🚀 Ordre d'Implémentation Recommandé

1. **Semaine 1** : Modèle de données + Backend API
2. **Semaine 2** : Frontend Admin UI
3. **Semaine 3** : Système de notification modifié
4. **Semaine 4** : Tests et déploiement

---

## 📝 Notes Importantes

### Logs Concernés (DEPARTED uniquement)

D'après `docs/mechanics/EXPEDITION-PUBLIC-LOGS.md` section **4️⃣ ACTIONS PENDANT DEPARTED** :

✅ **À envoyer au channel dédié** (quand status = DEPARTED et channel configuré) :

1. **🍽️ Manger en expédition**
   - Fichier: `bot/src/features/hunger/eat-more.handlers.ts:393-397`
   - Message: `🍽️ **{characterName}** a mangé **{quantity}x {emoji}**, il reste **{remainingStock}** {emoji} dans expédition "{expeditionName}"`

2. **🚨 Vote retour d'urgence (ajouté)**
   - Fichier: `bot/src/features/expeditions/handlers/expedition-emergency.ts:75-83`
   - Message: `🚨 **{characterName}** a voté pour le retour d'urgence ({totalVotes}/{membersCount})`

3. **🔄 Vote retour d'urgence (retiré)**
   - Fichier: `bot/src/features/expeditions/handlers/expedition-emergency.ts:75-83`
   - Message: `🔄 **{characterName}** a retiré son vote de retour d'urgence ({totalVotes}/{membersCount})`

❌ **À NE PAS envoyer au channel dédié** (restent dans le channel global) :
- Toutes les autres étapes (PLANNING, LOCK, RETURN)
- Événements quotidiens (DailyEventLog)
- Logs administratifs (création, départ, retour d'expédition)

### Questions à Clarifier

1. **Nettoyage du channel** :
   - Supprimer automatiquement `expeditionChannelId` à la fin (RETURNED) ?
   - Garder la configuration pour la prochaine expédition ?
   - Laisser à l'admin le choix ?

2. **Auto-création** :
   - Créer automatiquement un channel au départ (LOCKED → DEPARTED) ?
   - Ou laisser l'admin le configurer manuellement ?

3. **Transferts de ressources** :
   - Actuellement pas dans la section "ACTIONS PENDANT DEPARTED"
   - À envoyer au channel dédié ou non ?

---

## ✅ Résumé du Plan

Ce plan propose une implémentation complète et structurée du système de channel dédié par expédition. Il suit les patterns existants du code (configuration de channels, admin d'expédition) et s'intègre proprement dans l'architecture actuelle.

**Temps estimé** : 15-20h de développement + 5h de tests
**Complexité** : Moyenne (réutilisation de patterns existants)
**Impact** : Amélioration significative de l'UX pour les expéditions

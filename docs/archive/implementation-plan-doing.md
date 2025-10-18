# Plan d'Implémentation - Features doing.md

**Date:** 2025-10-15
**Status:** En cours

---

## Vue d'ensemble

6 features principales à implémenter :
1. ✅ Validation ressources expédition (SIMPLE)
2. 📋 Système Blueprint projets (MOYEN)
3. 📋 Direction d'expédition (MOYEN)
4. 📋 Consommation PA expédition (COMPLEXE)
5. 📋 Messages quotidiens 8h (COMPLEXE)
6. 📋 Vérification faim expédition (TEST)

---

## 1. VALIDATION RESSOURCES EXPÉDITION ✅

**Fichier:** `backend/src/services/expedition.service.ts` (lignes 252-283)

**Action:** Améliorer le message d'erreur quand ressources insuffisantes

**Avant:**
```typescript
throw new Error(`Insufficient ${resourceType.name} in town stock`);
```

**Après:**
```typescript
throw new Error(`Ressources insuffisantes : ${resourceType.name} (demandé: ${resourceAmount}, disponible: ${townStock.quantity})`);
```

---

## 2. SYSTÈME BLUEPRINT PROJETS 📋

### 2.1 Database Schema
**Fichier:** `backend/prisma/schema.prisma`

**Ajouts au modèle Project (après ligne 165):**
```prisma
isBlueprint         Boolean  @default(false)
originalProjectId   Int?
paBlueprintRequired Int?
```

**Nouveau modèle (après ProjectResourceCost):**
```prisma
model ProjectBlueprintResourceCost {
  id              Int          @id @default(autoincrement())
  projectId       Int
  resourceTypeId  Int
  quantityRequired Int
  project         Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  resourceType    ResourceType @relation(fields: [resourceTypeId], references: [id])
}
```

**Migration:** `npx prisma migrate dev --name add_blueprint_system`

### 2.2 Backend Service
**Fichier:** `backend/src/services/project.service.ts`

**Modifications:**

1. **createProject()** (ligne 30) - Ajouter paramètres blueprint:
```typescript
interface CreateProjectData {
  // ... existant
  paBlueprintRequired?: number;
  blueprintResourceCosts?: Array<{resourceTypeId: number, quantityRequired: number}>;
}
```

2. **Nouvelle méthode convertToBlueprint():**
```typescript
async convertToBlueprint(projectId: number) {
  // Marque isBlueprint = true
  // Garde l'historique du projet original
}
```

3. **Nouvelle méthode restartBlueprint():**
```typescript
async restartBlueprint(blueprintId: number) {
  // Crée nouveau projet avec coûts blueprint
  // Status ACTIVE
}
```

4. **contributeToProject()** (ligne 241) - Auto-conversion:
```typescript
if (isComplete) {
  await this.convertToBlueprint(projectId);
}
```

### 2.3 Discord Bot UI
**Fichiers:**
- `bot/src/features/projects/project-creation.ts`
- `bot/src/features/projects/projects.handlers.ts`

**Actions:**
1. Ajouter champs blueprint au modal de création
2. Ajouter bouton "Recommencer" sur projets COMPLETED + isBlueprint
3. Handler `handleRestartBlueprintButton()`

---

## 3. DIRECTION D'EXPÉDITION 📋

### 3.1 Database Schema
**Fichier:** `backend/prisma/schema.prisma`

**Nouvel enum (après ligne 269):**
```prisma
enum Direction {
  NORD
  NORD_EST
  EST
  SUD_EST
  SUD
  SUD_OUEST
  OUEST
  NORD_OUEST
  UNKNOWN
}
```

**Ajouts au modèle Expedition (après ligne 289):**
```prisma
initialDirection    Direction @default(UNKNOWN)
path                Direction[]
currentDayDirection Direction?
directionSetBy      Int?
```

**Migration:** `npx prisma migrate dev --name add_expedition_directions`

### 3.2 Backend Service
**Fichier:** `backend/src/services/expedition.service.ts`

**Modifications:**

1. **createExpedition()** (ligne 235) - Accepter initialDirection
2. **Nouvelle méthode setNextDirection():**
```typescript
async setNextDirection(expeditionId: number, direction: Direction, characterId: number) {
  // Vérifie status DEPARTED
  // Vérifie currentDayDirection null
  // Set currentDayDirection + directionSetBy
}
```

### 3.3 Backend Cron
**Fichier:** `backend/src/cron/expedition.cron.ts`

**Modifications:**

1. **lockExpeditionsDue()** (ligne 9):
   - Si initialDirection = null → set UNKNOWN

2. **departExpeditionsDue()** (ligne 43):
   - Append initialDirection to path array
   - Reset currentDayDirection = null

3. **Nouveau job daily (00:01):**
```typescript
async appendDailyDirection() {
  // Pour chaque DEPARTED expedition
  // Si currentDayDirection set → append to path
  // Reset currentDayDirection = null, directionSetBy = null
}
```

### 3.4 Discord Bot UI
**Fichiers:**
- `bot/src/features/expeditions/handlers/expedition-create.ts`
- `bot/src/features/expeditions/handlers/expedition-display.ts`

**Actions:**
1. Ajouter dropdown direction au modal création
2. Afficher direction actuelle + path dans display
3. Bouton "Choisir Direction" si DEPARTED + currentDayDirection null
4. Handler `handleDirectionSelect()`

---

## 4. CONSOMMATION PA EXPÉDITION 📋

### 4.1 Backend Cron
**Fichier:** `backend/src/cron/daily-pa.cron.ts`

**TIMING CRITIQUE:**
```
00:00:00 → Hunger decrease (hunger-increase.cron.ts)
00:00:10 → PA consumption expéditions (NOUVEAU)
00:00:20 → PM contagion (daily-pm.cron.ts)
00:00:30 → PA regeneration (daily-pa.cron.ts)
```

**Nouvelle fonction (avant updateAllCharactersActionPoints):**
```typescript
async deductExpeditionPA() {
  // 1. Find all DEPARTED expeditions NOT on emergency return
  // 2. For each expedition member:
  //    - Check validateCanUsePA(character, 2)
  //    - If OK: deduct 2 PA
  //    - If KO: removeFromExpedition + send to city + log catastrophic return
}
```

**Nouvelle fonction:**
```typescript
async handleCatastrophicReturn(characterId: number, expeditionId: number) {
  // 1. Remove from expedition
  // 2. Set location = CITY
  // 3. Set PA = 0
  // 4. Log event for Discord notification
}
```

### 4.2 Backend Service
**Fichier:** `backend/src/services/expedition.service.ts`

**Nouvelle méthode:**
```typescript
async removeMemberCatastrophic(characterId: number, expeditionId: number, reason: string) {
  // Similar to leaveExpedition but forced
  // Logs catastrophic event
}
```

### 4.3 Discord Bot Notification
**Nouveau fichier:** `bot/src/features/expeditions/handlers/expedition-catastrophic.ts`

**Handler:**
```typescript
async sendCatastrophicReturnNotification(characterName: string, guildId: string) {
  // Send: "**{character}** est rentré en catastrophe ! @Admin"
}
```

### 4.4 Cron Setup
**Fichier:** `backend/src/cron/expedition.cron.ts`

**Ajouter:**
```typescript
export function setupExpeditionPaJob() {
  const job = new CronJob(
    "10 0 * * *", // 00:00:10
    deductExpeditionPA,
    null,
    true,
    "Europe/Paris"
  );
  return job;
}
```

**Enregistrer dans:** `backend/src/app.ts` (ligne 33-39)

---

## 5. MESSAGES QUOTIDIENS 8H 📋

### 5.1 Database Schema
**Fichier:** `backend/prisma/schema.prisma`

**Nouveaux modèles:**
```prisma
model WeatherMessage {
  id           Int      @id @default(autoincrement())
  season       Season
  messageType  WeatherMessageType
  message      String   @db.Text
  createdAt    DateTime @default(now())
}

enum WeatherMessageType {
  REGULAR
  FIRST_DAY
}

model WeatherMessageUsage {
  id               Int      @id @default(autoincrement())
  weatherMessageId Int
  usedAt           DateTime @default(now())
  season           Season
  weatherMessage   WeatherMessage @relation(fields: [weatherMessageId], references: [id])
}

model DailyMessageOverride {
  id          Int      @id @default(autoincrement())
  scheduledFor DateTime @db.Date
  message     String   @db.Text
  createdAt   DateTime @default(now())
}

model DailyEventLog {
  id          Int      @id @default(autoincrement())
  eventType   DailyEventType
  eventDate   DateTime @db.Date
  description String   @db.Text
  metadata    Json?
  createdAt   DateTime @default(now())
}

enum DailyEventType {
  PROJECT_COMPLETED
  CHANTIER_COMPLETED
  RESOURCE_GATHERED
  EXPEDITION_DEPARTED
  EXPEDITION_RETURNED
  EXPEDITION_EMERGENCY_RETURN
  CHARACTER_CATASTROPHIC_RETURN
}
```

**Migration:** `npx prisma migrate dev --name add_daily_messages_system`

### 5.2 Event Logging Service
**Nouveau fichier:** `backend/src/services/daily-event-log.service.ts`

**Méthodes:**
```typescript
async logProjectCompleted(projectId: number, projectName: string, townId: number)
async logChantierCompleted(chantierId: number, chantierName: string, townId: number)
async logResourceGathered(characterId: number, resourceType: string, quantity: number)
async logExpeditionDeparted(expeditionId: number, memberCount: number)
async logExpeditionReturned(expeditionId: number, resourcesSummary: object)
async logExpeditionEmergencyReturn(expeditionId: number)
async logCharacterCatastrophicReturn(characterId: number, characterName: string)

async getYesterdayEvents(): Promise<DailyEventLog[]>
```

**Intégrer dans services existants:**
- `project.service.ts` (ligne 246-272) → log completion
- `chantier.service.ts` (ligne 263-272) → log completion
- `capability.service.ts` → log resource gathering
- `expedition.service.ts` → log departures/returns

### 5.3 Daily Message Service
**Nouveau fichier:** `backend/src/services/daily-message.service.ts`

**Méthodes:**
```typescript
async getWeatherMessage(): Promise<string> {
  // 1. Check override for today
  // 2. Get current season
  // 3. If first day of season → use FIRST_DAY message
  // 4. Else → rotate through REGULAR messages (exclude used ones)
  // 5. Mark message as used
}

async getActionRecap(): Promise<string> {
  // Format yesterday's events from DailyEventLog
}

async getStockSummary(townId: number): Promise<string> {
  // Format ResourceStock for town
}

async getExpeditionSummary(townId: number): Promise<string> {
  // Yesterday's expedition events
}

async buildDailyMessage(townId: number): Promise<string> {
  const weather = await this.getWeatherMessage();
  const recap = await this.getActionRecap();
  const stock = await this.getStockSummary(townId);
  const expeditions = await this.getExpeditionSummary(townId);

  return `${weather}\n\n${recap}\n\n${stock}\n\n${expeditions}`;
}
```

### 5.4 Daily Message Cron
**Nouveau fichier:** `backend/src/cron/daily-message.cron.ts`

**Job:**
```typescript
async sendDailyMessages() {
  // 1. Get all active towns
  // 2. For each town:
  //    - Build message with DailyMessageService
  //    - Send to configured channel (town.dailyChannelId?)
  //    - Log success/failure
}

export function setupDailyMessageJob() {
  const job = new CronJob(
    "0 8 * * *", // 08:00
    sendDailyMessages,
    null,
    true,
    "Europe/Paris"
  );
  console.log("Daily message job configured (08:00 Paris)");
  return job;
}
```

**Enregistrer dans:** `backend/src/app.ts`

### 5.5 Admin Override Command
**Nouveau fichier:** `bot/src/commands/admin-commands/weather-override.ts`

**Commande:**
```typescript
/admin-weather <message>
  → Creates DailyMessageOverride for tomorrow
  → Confirmation message
```

---

## 6. VÉRIFICATION FAIM EXPÉDITION 📋

**Action:** Tests uniquement

**Vérifier:**
1. `backend/src/controllers/characters.ts` (ligne 299-318):
   - Eating uses EXPEDITION stock if character in DEPARTED expedition ✅

2. `backend/src/cron/hunger-increase.cron.ts`:
   - Hunger decreases for all living characters (no location check) ✅

**Conclusion:** Devrait déjà fonctionner, mais tester en conditions réelles.

---

## ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. ✅ **Validation ressources** (5 min)
2. 📋 **Event logging system** (30 min) - Fondation pour daily messages
3. 📋 **Direction expéditions** (45 min) - Feature isolée
4. 📋 **Système Blueprint** (60 min) - Feature isolée
5. 📋 **PA expéditions** (45 min) - Utilise event logging
6. 📋 **Daily messages** (45 min) - Utilise event logging
7. 📋 **Tests finaux** (30 min)

**Temps total estimé:** ~4h30

---

## COMMANDES UTILES

```bash
# Migrations
npx prisma migrate dev --name <nom>
npx prisma generate

# Tests compilation
npm run build

# Deploy commands
npm run deploy

# Logs
docker compose logs -f backenddev
docker compose logs -f discord-botdev
```

---

## CHECKLIST FINALE

- [ ] Toutes les migrations appliquées
- [ ] Compilation sans erreurs
- [ ] Commands Discord déployées
- [ ] Tests manuels de chaque feature
- [ ] Documentation mise à jour
- [ ] Commit + push

---

**Document créé pour reprise de travail si interruption token.**

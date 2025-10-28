# 🕐 FateWeaver - Cron Jobs Documentation

This document provides technical documentation for all scheduled cron jobs in the FateWeaver system.

---

## 📋 Overview

**IMPORTANT ARCHITECTURE NOTE:**
- **Backend Cron Jobs:** Game mechanics (hunger, PA, expeditions) run in `/backend/src/app.ts`
- **Bot Cron Jobs:** Discord notifications (daily messages, season changes) run in `/bot/src/index.ts`

All cron jobs use the **Europe/Paris timezone**.

### Active Cron Jobs

#### Backend Cron Jobs (Game Mechanics)

| Job | File | Frequency | Purpose |
|-----|------|-----------|---------|
| **Unified Midnight Orchestrator** | `backend/src/cron/midnight-tasks.cron.ts` | Daily 00:00:00 | Orchestrates all midnight tasks sequentially |
| ↳ **Hunger Management** | Called: `increaseAllCharactersHunger()` | - | Heal HP (hunger=4), decrease hunger, trigger agony |
| ↳ **Mental Health Contagion** | Called: `updateMentalHealthContagion()` | - | Spread depression between characters |
| ↳ **Lock Expeditions** | Called: `lockExpeditionsDue()` | - | Lock PLANNING expeditions, remove critical members |
| ↳ **Daily PA Update** | Called: `dailyPaUpdate()` | - | Death/agony checks, PA reset/regen, append directions, expedition PA deduction |
| **Morning Expedition Update** | `backend/src/cron/expedition.cron.ts` | Daily 08:00:00 | Process returns (DEPARTED→RETURNED) then departs (LOCKED→DEPARTED) |

#### Bot Cron Jobs (Discord Notifications)

| Job | File | Frequency | Purpose |
|-----|------|-----------|---------|
| **Daily Messages** | `bot/src/cron/daily-messages.cron.ts` | Daily 08:00:05 | Send daily recap to Discord (weather, actions, stocks, expeditions) |
| **Season Change Notifications** | `bot/src/cron/season-change.cron.ts` | Weekly (Mon 00:00) | Check for season changes and notify all guilds |

---

## 🔄 Execution Order & Timeline

**CRITICAL:** Cron jobs execute in a specific order to ensure correct game mechanics.

### Midnight Sequence (00:00:00) - UNIFIED ORCHESTRATOR

**CRITICAL UPDATE:** All midnight jobs now run through a unified orchestrator for guaranteed sequential execution.

```
00:00:00 - Unified Midnight Job (midnight-tasks.cron.ts)
│
├─ Orchestrator runs 4 tasks SEQUENTIALLY:
│
├── 1. Hunger Management (increaseAllCharactersHunger)
│   ├─ STEP 1: Heal HP if hungerLevel=4 (+1 HP max 5)
│   ├─ STEP 2: Decrease hungerLevel by 1
│   └─ STEP 3: If hunger=0 → Set hp=1 (Agonie) + Mark agonySince
│
├── 2. Mental Health Contagion (updateMentalHealthContagion)
│   ├─ Find all PM=0 characters
│   ├─ For each: Select random victim in same location
│   └─ Victim loses 1 PM
│
├── 3. Lock Expeditions (lockExpeditionsDue)
│   ├─ Lock PLANNING expeditions created before midnight
│   ├─ Set initialDirection to UNKNOWN if not set
│   └─ Remove members with critical conditions (isDead, hp≤1, hungerLevel≤1, pm≤1)
│
└── 4. Daily PA Update (dailyPaUpdate) - COMPREHENSIVE JOB
    ├─ STEP 1: Reset agonySince if recovered (hp > 1)
    ├─ STEP 2: Check death if hp=0 → isDead=true
    ├─ STEP 3: Check agony duration (2 days → death)
    ├─ STEP 4: Reset paUsedToday = 0
    ├─ STEP 5: Regenerate PA (hunger penalty if hungerLevel≤1)
    │   └─ Normal: +2 PA, Affamé: +1 PA (hunger≤1), Cap: max 4
    ├─ STEP 6: Append expedition directions to path[]
    └─ STEP 7: Deduct 2 PA for DEPARTED expeditions
       └─ If PA < 2 + catastrophic → Remove from expedition
          (catastrophic = hungerLevel≤1 OR isDead OR hp≤1 OR pm≤1)
```

**Why Unified Orchestrator:**
- ✅ Guaranteed sequential execution (no race conditions)
- ✅ Explicit task ordering
- ✅ Single cron schedule to manage
- ✅ Better error handling and logging
- ✅ Cleaner architecture than multiple simultaneous jobs

**File:** `/backend/src/cron/midnight-tasks.cron.ts`
**Registration:** `/backend/src/app.ts` line 42

### Morning Sequence (08:00:00 - 08:00:05)

```
08:00:00 - Morning Expedition Update (backend/expedition.cron.ts)
├── STEP 1: Return Expeditions (DEPARTED → RETURNED)
│   ├─ Find DEPARTED expeditions with returnAt <= now
│   ├─ Process emergency returns (pendingEmergencyReturn flag)
│   ├─ Change status to RETURNED
│   └─ Handle resource transfers and notifications
│
└── STEP 2: Depart Expeditions (LOCKED → DEPARTED)
    ├─ Find all LOCKED expeditions
    ├─ Change status to DEPARTED
    └─ Initialize path with initialDirection

08:00:05 - Daily Messages (bot/daily-messages.cron.ts) ⚡ BOT
└── Send daily recap to Discord
    ├─ Fetch all guilds from backend API
    ├─ For each guild with dailyMessageChannelId:
    │   ├─ Call backend API endpoints:
    │   │   ├─ GET /api/towns/:id/weather
    │   │   ├─ GET /api/towns/:id/actions-recap
    │   │   ├─ GET /api/towns/:id/stocks-summary
    │   │   └─ GET /api/towns/:id/expeditions-summary
    │   └─ Send rich embed to Discord channel
    └─ Log sent count
```

### Weekly Maintenance (Monday 00:00:00)

```
Monday 00:00:00 - Season Change Check (bot/season-change.cron.ts) ⚡ BOT
└── Check and notify season changes
    ├─ Call backend API: GET /api/seasons/check-change
    ├─ If season changed in last 24h:
    │   ├─ Fetch all guilds from backend API
    │   ├─ For each guild with notification channel:
    │   │   ├─ Create season-specific embed (emoji, color, temp, description)
    │   │   └─ Send to dailyMessageChannelId or logChannelId
    │   └─ Log sent count
    └─ If no change: log and continue
```

---

### Why This Order Matters

**Critical Sequencing (Enforced by Unified Orchestrator):**
- **Heal BEFORE hunger decrease:** Hunger=4 heal must happen before hunger drops to 3 (atomicity in same job)
- **Reset agonySince BEFORE agony check:** Characters healed during night (hunger job) must have agonySince cleared first
- **Hunger before PA:** Hunger affects PA regeneration calculation
- **PM contagion before Lock:** Depressed characters may be removed during lock phase
- **Lock before PA update:** Members with critical conditions removed before PA processing
- **Death/agony check before PA regen:** Dead/dying characters handled correctly
- **PA regen before append directions:** PA must be updated before expedition processing
- **Append directions before PA deduction:** Path updates before new day PA costs
- **PA deduction uses current PA:** NO double regeneration, uses PA from STEP 5
- **All PA steps in ONE job:** Ensures consistency, no race conditions
- **Unified orchestrator:** ELIMINATES race conditions between jobs
- **Lock before depart:** Expeditions must be locked (00:00) before departing (08:00)
- **Returns before departs:** Returning expeditions processed BEFORE new departures (08:00)
- **Messages after expedition processing:** Daily recap sent at 08:00:05 to include all returns/departs

---

## 📝 Job Details

### 1. Hunger Management (`hunger-increase.cron.ts`)

**Purpose:** Heal characters with full hunger, then decrease hunger levels for all living characters daily.

**CRITICAL:** This job combines healing and hunger decrease to ensure atomicity.

#### Logic

```typescript
For each living character (isDead=false):
  1. STEP 1: Heal HP if hungerLevel = 4 (Satiété)
     - If hungerLevel == 4 AND hp < 5:
       * hp = min(5, hp + 1)
       * healedCount++

  2. STEP 2: Decrease hungerLevel by 1 (min: 0)
     - hungerLevel = max(0, hungerLevel - 1)

  3. STEP 3: If hungerLevel reaches 0:
     - Set hp = 1 (Agonie state)
     - Mark agonySince = now (if not already in agony)

  4. Update character in database
```

#### Key Features

- **Heal Before Hunger Decrease:** Ensures hunger=4 characters get healed before hunger drops
- **Atomicity:** Both operations happen in the same database update
- **No Instant Death:** Hunger reaching 0 sets HP to 1 (agony), doesn't kill
- **Agony Tracking:** Records agonySince timestamp for death timer
- **Persistent Hunger:** Once at 0, hunger stays at 0 until character eats
- **Logging:** Logs healed count and characters entering agony state

#### Configuration

```typescript
Cron Pattern: "0 0 0 * * *"  // Daily at 00:00:00
Timezone: Europe/Paris
```

#### Manual Execution

```bash
node backend/src/cron/hunger-increase.cron.ts
```

---

### 2. Mental Health Contagion (`daily-pm.cron.ts`)

**Purpose:** Spread depression from PM=0 characters to others in their location.

#### PM Contagion Algorithm

```typescript
1. Find all characters with PM=0 (Dépression) who are alive

2. For each depressed character:

   a. Determine location:
      - Check if in DEPARTED expedition
      - If yes → Location = expedition
      - If no → Location = city

   b. Find potential victims in same location:
      - Must be in same location
      - Must have PM > 0 (not already depressed)
      - Must NOT be dead
      - If in city: Must NOT be in DEPARTED expedition

   c. If victims available:
      - Select ONE victim randomly
      - Decrease victim's PM by 1
      - Log the contagion event with structured logging
      - Send Discord notification via logger

   d. If no victims available:
      - Log "no victims available"
      - Continue to next depressed character
```

#### Location Logic

**City Characters:**
```typescript
- Include: All characters in town NOT in DEPARTED expeditions
- Exclude: Dead characters, PM=0 characters, DEPARTED expedition members
```

**DEPARTED Expedition Characters:**
```typescript
- Include: All expedition members
- Exclude: Dead characters, PM=0 characters
```

#### Edge Cases

1. **Multiple depressed in same location:**
   - Each depressed character affects ONE random victim
   - Same character can be affected by multiple depressed characters in one day

2. **No eligible victims:**
   - If everyone in location is dead or already depressed → No contagion
   - Logged as "Aucune victime disponible"

3. **Expedition transitions:**
   - Only DEPARTED expeditions count as separate locations
   - PLANNING/LOCKED expeditions use city location

#### Configuration

```typescript
Cron Pattern: "0 0 * * *"  // Daily at 00:00:00
Timezone: Europe/Paris
```

#### Manual Execution

```bash
node backend/src/cron/daily-pm.cron.ts
```

---

### 3. Daily PA Update (`daily-pa.cron.ts`)

**Purpose:** Unified job handling all PA-related daily updates including death checks, PA regeneration, expedition directions, and expedition costs.

**IMPORTANT:** This is now a SINGLE unified job that runs all steps sequentially at 00:00:00.

**NOTE:** HP healing was moved to `hunger-increase.cron.ts` to ensure atomicity with hunger decrease.

#### Unified PA Update Process (00:00:00)

**Sequential Steps:**

**STEP 1: Reset Agony Timer if Recovered**
```typescript
For each living character:
  If hp > 1 AND agonySince != null:
    agonySince = null
```
**Critical:** This must happen BEFORE agony duration check to handle characters healed by hunger job.

**STEP 2: Death Check**
```typescript
For each living character:
  If hp == 0:
    isDead = true
    deathCount++
```

**STEP 3: Agony Duration Check**
```typescript
For each living character with hp == 1 AND agonySince != null:
  // Only for characters still in agony who haven't recovered
  daysSinceAgony = floor((now - agonySince) / (24h))

  If daysSinceAgony >= 2:
    isDead = true
    hp = 0
    deathCount++
```

**STEP 4: Reset Daily PA Counter**
```typescript
For each character:
  paUsedToday = 0
  lastPaReset = now
```

**STEP 5: PA Regeneration**
```typescript
For each living character (not dead from steps above):
  1. Calculate PA to add:
     - If hungerLevel <= 1: pointsToAdd = 1 (Affamé penalty)
     - Else: pointsToAdd = 2 (Normal regeneration)

  2. Apply cap:
     pointsToAdd = min(pointsToAdd, 4 - paTotal)

  3. If pointsToAdd > 0:
     paTotal += pointsToAdd
     lastPaUpdate = now
```

**STEP 6: Append Expedition Directions**
```typescript
1. Find all DEPARTED expeditions with currentDayDirection != null

2. For each expedition:
   - Append currentDayDirection to path[]
   - Reset currentDayDirection = null
   - Reset directionSetBy = null
   - Reset directionSetAt = null
```

**STEP 7: Deduct Expedition PA**
```typescript
1. Find all ExpeditionMembers in DEPARTED expeditions

2. For each member:
   a. Skip if expedition has pendingEmergencyReturn flag

   b. Check if can afford expedition (needs PA >= 2):
      // IMPORTANT: Uses current paTotal from STEP 5 (already regenerated with hunger penalties)

      If paTotal >= 2:
        - Deduct 2 PA: paTotal -= 2

      If paTotal < 2:
        - Check catastrophic return conditions:
          * hungerLevel <= 1 (Affamé/Agonie from hunger)
          * isDead (Mort)
          * hp <= 1 (Agonie/Mort from HP)
          * pm <= 2 (Dépression/Déprime)

        - If catastrophic:
          * Remove member from expedition
          * Set reason (agonie, mort/agonie, dépression)
          * Log catastrophic return
          * Note: hp<=1 includes both agony (hp=1) and death (hp=0)

        - If not catastrophic:
          * Log warning (shouldn't happen in normal gameplay)
```

#### Key Features

- **Single Unified Job:** All PA operations in one sequential job (no race conditions)
- **No Double Regeneration:** Expedition deduction uses PA from STEP 5 directly
- **Agony Death Timer:** 2 days in agony (hp=1) = automatic death
- **Hunger Penalties:** Affects PA regeneration (heal moved to hunger job)
- **Catastrophic Returns:** Automatic expedition removal for critical conditions
- **Daily Counter Reset:** paUsedToday reset for depression mechanics
- **Sequential Processing:** Steps 1-7 run in order within same job

#### Logging

```typescript
Unified job console output:
=== Début de la mise à jour quotidienne des PA ===
- Total characters updated
- Number dead (hp=0 or 2-day agony)
--- STEP 6: Append daily expedition directions ---
- Directions appended count
--- STEP 7: Deduct PA for expeditions ---
- Members who paid 2 PA
- Catastrophic returns with reasons
=== Mise à jour quotidienne des PA terminée ===
```

#### Configuration

```typescript
Cron Pattern: "0 0 * * *"  // Daily at 00:00:00
Timezone: Europe/Paris
```

#### Manual Execution

```bash
node backend/src/cron/daily-pa.cron.ts
# Note: Only runs main job, not expedition deduction
```

---

### 4. Expedition Management (`expedition.cron.ts`)

**Purpose:** Manage expedition lifecycle transitions (lock, morning returns/departs).

This file contains **TWO separate jobs** that handle different expedition phases.

**NOTE:** Append directions was moved to `daily-pa.cron.ts` to ensure it runs after PA regeneration.

#### Job 1: Lock Expeditions (00:00:00)

**Purpose:** Lock PLANNING expeditions after midnight on their creation day.

```typescript
Logic:
1. Calculate midnightToday (00:00:00 of current day)
2. Find all PLANNING expeditions with createdAt < midnightToday
3. For each expedition:
   - Call expeditionService.lockExpedition(id)
   - If initialDirection is null or UNKNOWN → Set to UNKNOWN
4. Log locked count
```

#### Job 2: Morning Expedition Update (08:00:00)

**Purpose:** Process all returns then all departures in the morning.

**CRITICAL:** This is a unified job that processes returns BEFORE departures.

**STEP 1: Return Expeditions (DEPARTED → RETURNED)**
```typescript
Logic:
1. Find all DEPARTED expeditions with returnAt <= now
2. For each expedition:
   - Call expeditionService.returnExpedition(id)
   - Handle resource transfers
   - Update expedition members
   - Send Discord notifications
3. Process emergency returns (pendingEmergencyReturn flag)
4. Log returned count
```

**STEP 2: Depart Expeditions (LOCKED → DEPARTED)**
```typescript
Logic:
1. Find all LOCKED expeditions
2. For each expedition:
   - Call expeditionService.departExpedition(id)
   - Initialize path with initialDirection (default UNKNOWN if null)
3. Log departed count
```

#### Expedition Status Flow

```
PLANNING → LOCKED → DEPARTED → RETURNED
    ↓         ↓          ↓
 00:00:00   08:00:00   08:00:00
 (lock)     (depart)   (return)

Note: Returns happen at 08:00:00 when returnAt is reached
      (not continuously monitored)
```

#### Configuration

```typescript
Lock Job: "0 0 * * *"    // 00:00:00
Morning Job: "0 8 * * *" // 08:00:00 (returns then departs)
Timezone: Europe/Paris
```

---

### 5. Daily Messages (`bot/src/cron/daily-messages.cron.ts`) ⚡ BOT

**Location:** Discord Bot (not backend)

**Purpose:** Send daily recap to Discord including weather, actions, stocks, and expeditions.

**STATUS:** ✅ Fully Implemented (Runs in bot, calls backend API)

**CRITICAL:** Runs at 08:00:05, 5 seconds AFTER expedition processing to include all updates.

#### Architecture

```
Bot Cron (08:00:05)
└─→ Backend API
    ├─→ GET /api/guilds (get all guilds with towns)
    ├─→ GET /api/towns/:id/weather
    ├─→ GET /api/towns/:id/actions-recap
    ├─→ GET /api/towns/:id/stocks-summary
    └─→ GET /api/towns/:id/expeditions-summary
```

#### Logic

```typescript
1. Fetch all guilds from backend API (GET /api/guilds)
2. For each guild:
   a. Check if dailyMessageChannelId is configured
   b. Verify bot is in Discord server
   c. Fetch Discord channel
   d. Verify guild has associated town
   e. Call backend API endpoints to get data:
      - Weather message
      - Actions recap from previous day
      - Current stock summary
      - Expedition summary (active expeditions)
   f. Build rich embed with all sections
   g. Send to Discord channel
   h. Log success/failure
3. Log total sent count
```

#### Key Features

- **Bot-Hosted:** Runs directly in Discord bot (no HTTP communication needed)
- **Guild-Based:** One message per guild with dailyMessageChannelId configured
- **API-Driven:** Fetches all data from backend REST API
- **Post-Processing Timing:** Runs after expedition updates (08:00:05) to include fresh data
- **Discord.js:** Uses Discord.js EmbedBuilder for rich message formatting
- **Separate Channel:** Uses `dailyMessageChannelId` (not `logChannelId`)
- **Graceful Errors:** Continues to next guild if one fails

#### Configuration

```typescript
Cron Pattern: "5 8 * * *"  // Daily at 08:00:05 (after expedition processing)
Timezone: Europe/Paris
Initialization: bot/src/index.ts (clientReady event)
```

#### Backend API Endpoints

Created to support daily messages:

- **GET /api/guilds** - Returns all guilds with their towns
- **GET /api/towns/:id/weather** - Returns weather message (TODO: season-based)
- **GET /api/towns/:id/actions-recap** - Returns actions from last 24h (TODO: implement logs)
- **GET /api/towns/:id/stocks-summary** - Returns formatted stock list with emojis
- **GET /api/towns/:id/expeditions-summary** - Returns active expeditions with return dates

---

### 6. Season Change Notifications (`bot/src/cron/season-change.cron.ts`) ⚡ BOT

**Location:** Discord Bot (not backend)

**Purpose:** Check for season changes and notify all guilds via Discord.

**STATUS:** ✅ Fully Implemented (Runs in bot, calls backend API)

#### Architecture

```
Bot Cron (Monday 00:00:00)
└─→ Backend API
    ├─→ GET /api/seasons/check-change (checks if changed in last 24h)
    └─→ GET /api/guilds (if changed, get all guilds)
```

#### Logic

```typescript
1. Call backend API: GET /api/seasons/check-change
2. Backend checks if season was updated in last 24h
3. If season changed:
   a. Fetch all guilds from backend API
   b. For each guild:
      - Get notification channel (dailyMessageChannelId or fallback to logChannelId)
      - Verify bot is in Discord server
      - Fetch Discord channel
      - Create season-specific embed:
        * Season emoji (🌸 Spring, ☀️ Summer, 🍂 Autumn, ❄️ Winter)
        * Season color (Light green, Gold, Orange, Sky blue)
        * Temperature and precipitation
        * Season description
      - Send to Discord channel
      - Log success/failure
   c. Log total sent count
4. If no change:
   - Log "No season change detected"
```

#### Season System

```typescript
- Backend manages SUMMER/WINTER/SPRING/AUTUMN transitions
- Bot checks weekly (every Monday) if change occurred in last 24h
- Backend stores season in database with updatedAt timestamp
- Bot creates notifications with season-specific data:
  * Name (localized: Été, Hiver, Printemps, Automne)
  * Temperature (e.g., 28°C for Summer, -5°C for Winter)
  * Precipitation percentage
  * Description text
- Uses seasonal emojis and Discord embed colors
- Notifications sent to all configured guilds
```

#### Configuration

```typescript
Cron Pattern: "0 0 * * 1"  // Every Monday at 00:00:00
Timezone: Europe/Paris
Initialization: bot/src/index.ts (clientReady event)
```

#### Backend API Endpoints

Created to support season notifications:

- **GET /api/seasons/check-change** - Checks if season changed in last 24h, returns season data
  - Returns: `{ changed: boolean, newSeason: { name, temperature, precipitation, description } }`
  - Uses season.updatedAt timestamp to detect recent changes
  - Returns localized season names and data

---

## 🔧 Development & Testing

### Running Cron Jobs Manually

#### Backend Cron Jobs

Backend cron jobs support manual execution for testing:

```bash
# From project root
node backend/src/cron/hunger-increase.cron.ts
node backend/src/cron/daily-pm.cron.ts
node backend/src/cron/daily-pa.cron.ts
# Note: expedition.cron.ts doesn't support manual execution (multiple jobs)
```

#### Bot Cron Jobs

Bot cron jobs are initialized when the bot starts (index.ts:193-205). To test:

```bash
# Start the bot in development mode
cd bot
npm run dev

# Cron jobs will initialize on bot ready and run at scheduled times
# Check logs for "✅ Cron jobs initialized successfully"
```

**Note:** Bot cron jobs cannot be run manually outside of the bot process because they require:
- Discord.js Client instance (for posting messages)
- Active connection to Discord servers
- Access to guild channels

### Disabling Cron Jobs

#### Backend Cron Jobs

Cron jobs are automatically disabled in test environment:

```typescript
// In backend/src/app.ts
if (process.env.NODE_ENV !== "test") {
  const { mainJob } = setupDailyPaJob();
  mainJob.start();
  setupHungerIncreaseJob();
  setupDailyPmJob();
  setupExpeditionJobs();
  // Note: Daily messages and season changes now in bot
}
```

#### Bot Cron Jobs

Bot cron jobs are initialized in the `clientReady` event:

```typescript
// In bot/src/index.ts
client.once("clientReady", async () => {
  // ... other initialization

  // Initialize cron jobs
  try {
    const { setupDailyMessagesJob } = await import("./cron/daily-messages.cron.js");
    const { setupSeasonChangeJob } = await import("./cron/season-change.cron.js");

    setupDailyMessagesJob(client);
    setupSeasonChangeJob(client);

    logger.info("✅ Cron jobs initialized successfully");
  } catch (error) {
    logger.error("❌ Failed to initialize cron jobs:", { error });
  }
});
```

### Testing Strategy

1. **Unit Tests:** Test individual cron logic functions
2. **Integration Tests:** Test full cron execution with test database
3. **Manual Testing:** Run cron scripts with development database
4. **Timing Tests:** Verify morning sequence (returns at 08:00:00, messages at 08:00:05)
5. **Production Monitoring:** Check logs after midnight and 08:00 for errors

---

## 📊 Performance Considerations

### Current Implementation

- **Sequential Processing:** Each character/expedition processed one-by-one
- **No Batching:** Individual database updates per entity
- **Transaction Safety:** Some operations use Prisma transactions
- **Timing Sensitivity:** 10-second delay between PA jobs ensures consistency

### Optimization Opportunities

#### 1. Batch Updates

```typescript
// Current (slow):
for (const character of characters) {
  await prisma.character.update({...});
}

// Optimized (faster):
await prisma.character.updateMany({
  where: { id: { in: characterIds } },
  data: { ... }
});
```

**Trade-off:** Batch updates can't handle per-character logic differences (e.g., hunger penalties).

#### 2. Parallel Processing

```typescript
// Current:
for (const character of characters) {
  await processCharacter(character);
}

// Optimized:
await Promise.all(
  characters.map(char => processCharacter(char))
);
```

**Trade-off:** Higher memory usage, potential race conditions.

#### 3. Database Indexing

Ensure proper indexes on:
- `Character.isDead`
- `Character.hungerLevel`
- `Character.pm`
- `Character.hp`
- `Character.agonySince`
- `Expedition.status`
- `Expedition.returnAt`
- `Expedition.createdAt`
- `ExpeditionMember.expeditionId`

---

## 🚨 Error Handling

### Current Error Handling

All cron jobs use try-catch blocks:

```typescript
try {
  // Cron logic
  console.log("Success");
} catch (error) {
  console.error("Error:", error);
}
```

### Individual Job Error Handling

Some jobs (expeditions) handle per-entity errors:

```typescript
for (const entity of entities) {
  try {
    await processEntity(entity);
  } catch (error) {
    logger.error(`Failed to process ${entity.id}:`, { error });
    // Continue processing other entities
  }
}
```

### Monitoring Recommendations

1. **Log Aggregation:** Use structured logging (Winston, Pino) - partially implemented with logger service
2. **Alerting:** Send notifications for cron failures
3. **Health Checks:** Monitor last successful run timestamp
4. **Metrics:** Track execution time, entities processed, errors
5. **Timing Monitors:** Alert if PA expedition job runs before main job completes

---

## 📝 Adding New Cron Jobs

### Template

```typescript
import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import { logger } from "../services/logger";

const prisma = new PrismaClient();

async function myCustomUpdate() {
  try {
    logger.info("Starting custom update...");

    // Your logic here

    logger.info("Custom update complete");
  } catch (error) {
    logger.error("Error in custom update:", { error });
  }
}

export function setupMyCustomJob() {
  const job = new CronJob(
    "0 0 * * *",        // Cron pattern
    myCustomUpdate,      // Function to run
    null,                // onComplete callback
    true,                // Start immediately
    "Europe/Paris"       // Timezone
  );
  logger.info("My custom job configured");
  return job;
}

// Allow manual execution
if (require.main === module) {
  console.log("Manual execution...");
  myCustomUpdate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
```

### Registration

Add to `/backend/src/app.ts`:

```typescript
import { setupMyCustomJob } from "./cron/my-custom.cron";

if (process.env.NODE_ENV !== "test") {
  // ... existing jobs
  setupMyCustomJob();
}
```

### Timing Considerations

When adding jobs that depend on other jobs:
- Use seconds offset for critical sequencing (e.g., `"5 0 * * *"` = 00:00:05)
- Document timing dependencies in this file
- Test timing in development environment
- Monitor timing in production logs

---

## 🐛 Known Issues & TODOs

### Completed Items ✅

1. ✅ **Daily Messages Integration (v4.0):**
   - Moved to bot cron jobs (from backend)
   - Bot calls backend API for data
   - Sends formatted embeds to Discord channels
   - Uses separate `dailyMessageChannelId` configuration

2. ✅ **Season Change Notifications (v4.0):**
   - Moved to bot cron jobs (from backend)
   - Bot checks backend API for season changes
   - Sends to all guilds with notification channels
   - Season-specific emojis, colors, and descriptions

### Architecture Notes

**Bot Cron Jobs:**
- Run directly in Discord bot process
- Use Discord.js for message posting
- Call backend REST API for data
- No HTTP server needed in bot
- Initialized in `clientReady` event

**Deprecated (v3.2):**
- `discord-notification.service.ts` in backend (removed in v4.0)
- Backend-based Discord REST API integration (replaced by bot crons)

### Known Limitations

1. **Race Conditions:**
   - Multiple jobs start at 00:00:00 simultaneously
   - Hunger job ensures atomicity by combining heal + hunger decrease
   - PA job is now unified (no internal race conditions)
   - May need transaction isolation for concurrent updates between different jobs

2. **Fixed Issues (Previously Limitations):**
   - ✅ Expedition PA logic no longer assumes +2 PA (uses actual paTotal from STEP 5)
   - ✅ No more timing issues between PA regeneration and deduction (same job now)
   - ✅ HP healing moved from PA job to hunger job for atomicity

---

## 📚 Related Documentation

- **Game Mechanics:** See `GAME-MECHANICS.md` for how cron jobs affect gameplay
- **Database Schema:** See `backend/prisma/schema.prisma` for data models
- **API Services:** See `backend/src/services/` for business logic
- **Logger Service:** See `backend/src/services/logger.ts` for structured logging

---

**Last Updated:** 2025-10-27
**Version:** 4.1 - Unified Midnight Orchestrator Architecture

## 📋 Version History

### v4.1 - Unified Midnight Orchestrator (2025-10-27)

**ARCHITECTURE IMPROVEMENT:** Consolidated midnight cron jobs into single orchestrator

**Changes:**
- ✅ **Unified midnight job:** All midnight tasks now run through `/backend/src/cron/midnight-tasks.cron.ts`
- ✅ **Sequential execution:** Tasks run in explicit order (no race conditions)
- ✅ **Simplified registration:** Single cron schedule in `app.ts` line 42
- ✅ **Better logging:** Centralized orchestrator with task-level logging
- ✅ **Updated expedition lock:** Now removes members with critical conditions (pm≤1, not pm≤2)

**Benefits:**
- ✨ Guaranteed sequential execution (eliminates race conditions)
- ✨ Easier to maintain and debug
- ✨ Clear task dependencies in code
- ✨ Single point of failure (better error handling)

### v4.0 - Bot-Based Discord Notifications (2025-10-16)

**MAJOR ARCHITECTURE CHANGE:** Moved Discord notifications from backend to bot

**Changes:**
- ✅ **Moved cron jobs to bot:**
  - Daily messages now run in `bot/src/cron/daily-messages.cron.ts`
  - Season change notifications now run in `bot/src/cron/season-change.cron.ts`
  - Initialized in bot's `clientReady` event handler

- ✅ **New backend API endpoints:**
  - `GET /api/guilds` - Get all guilds with towns
  - `GET /api/towns/:id/weather` - Get weather message
  - `GET /api/towns/:id/actions-recap` - Get activities recap (TODO: implement logs)
  - `GET /api/towns/:id/stocks-summary` - Get formatted stock list
  - `GET /api/towns/:id/expeditions-summary` - Get active expeditions summary
  - `GET /api/seasons/check-change` - Check if season changed in last 24h
  - `PATCH /api/guilds/:discordId/daily-message-channel` - Update daily message channel

- ✅ **Database changes:**
  - Added `dailyMessageChannelId` field to Guild model
  - Separate channels for logs vs daily messages

- ✅ **Bot features:**
  - Updated `/config-channel-admin` to configure two channel types
  - Bot fetches data from backend API via fetch()
  - Bot posts directly to Discord using Discord.js EmbedBuilder
  - Season-specific emojis, colors, and descriptions

**Benefits:**
- ✨ Simpler architecture (no HTTP server needed in bot)
- ✨ No complex inter-service communication
- ✨ Bot already connected to Discord (reuses existing connection)
- ✨ Lighter codebase with fewer dependencies

### v3.2 - Discord Integration & Major Refactoring

**v3.2 Changes:**
- ✅ Implemented Discord REST API integration for notifications (deprecated in v4.0)
- ✅ Created discord-notification.service.ts for centralized Discord messaging (deprecated in v4.0)
- ✅ Daily messages sent to Discord as rich embeds
- ✅ Season change notifications broadcast to all guilds

### v3.1 - PA System Refactoring

**v3.1 Changes:**
- HP healing moved to hunger job for atomicity
- agonySince reset moved before agony duration check
- Unified Daily PA job (removed separate expedition job and timing issues)
- Removed double PA regeneration bug in expedition logic
- Moved append directions to PA job for proper sequencing
- Unified morning expedition update (returns at 08:00, then departs, then messages at 08:00:05)
- Removed unnecessary continuous monitoring jobs (returns only happen at 08:00)

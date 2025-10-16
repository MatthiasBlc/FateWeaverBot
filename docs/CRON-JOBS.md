# 🕐 FateWeaver - Cron Jobs Documentation

This document provides technical documentation for all scheduled cron jobs in the FateWeaver bot backend.

---

## 📋 Overview

All cron jobs are registered in `/backend/src/app.ts` and use the **Europe/Paris timezone**.

### Active Cron Jobs

| Job | File | Frequency | Purpose |
|-----|------|-----------|---------|
| **Hunger Management** | `hunger-increase.cron.ts` | Daily 00:00:00 | Heal HP (hunger=4), decrease hunger, trigger agony |
| **Mental Health Contagion** | `daily-pm.cron.ts` | Daily 00:00:00 | Spread depression between characters |
| **Lock Expeditions** | `expedition.cron.ts` | Daily 00:00:00 | Lock PLANNING expeditions created before midnight |
| **Daily PA (Main)** | `daily-pa.cron.ts` | Daily 00:00:00 | Check death/agony, reset PA counter, regenerate PA |
| **Append Directions** | `expedition.cron.ts` | Daily 00:00:05 | Append daily directions to expedition paths |
| **Daily PA (Expeditions)** | `daily-pa.cron.ts` | Daily 00:00:10 | Deduct 2 PA for DEPARTED expeditions, handle catastrophic returns |
| **Daily Messages** | `daily-message.cron.ts` | Daily 08:00:00 | Send daily status messages to Discord |
| **Depart Expeditions** | `expedition.cron.ts` | Daily 08:00:00 | Depart LOCKED expeditions |
| **Return Expeditions** | `expedition.cron.ts` | Every 10 min | Process expedition returns when returnAt is reached |
| **Emergency Returns** | `expedition.cron.ts` | Every 10 min | Process emergency/catastrophic expedition returns |
| **Season Change** | `season-change.cron.ts` | Weekly (Mon 00:00) | Manage seasonal transitions |

---

## 🔄 Execution Order & Timeline

**CRITICAL:** Cron jobs execute in a specific order to ensure correct game mechanics.

### Midnight Sequence (00:00:00 - 00:00:10)

```
00:00:00 (simultaneous start)
├── 1. Hunger Management (hunger-increase.cron.ts)
│   ├─ STEP 1: Heal HP if hungerLevel=4 (+1 HP max 5)
│   ├─ STEP 2: Decrease hungerLevel by 1
│   └─ STEP 3: If hunger=0 → Set hp=1 (Agonie) + Mark agonySince
│
├── 2. Mental Health Contagion (daily-pm.cron.ts)
│   ├─ Find all PM=0 characters
│   ├─ For each: Select random victim in same location
│   └─ Victim loses 1 PM
│
├── 3. Lock Expeditions (expedition.cron.ts)
│   ├─ Lock PLANNING expeditions created before today
│   └─ Set initialDirection to UNKNOWN if not set
│
└── 4. Daily PA Update - Main (daily-pa.cron.ts)
    ├─ STEP 1: Reset agonySince if recovered (hp > 1)
    ├─ STEP 2: Check death if hp=0 → isDead=true
    ├─ STEP 3: Check agony duration (2 days → death)
    ├─ STEP 4: Reset paUsedToday = 0
    └─ STEP 5: Regenerate PA (hunger penalty if hungerLevel≤1)

00:00:05
└── 5. Append Directions (expedition.cron.ts)
    ├─ Find DEPARTED expeditions with currentDayDirection
    ├─ Append currentDayDirection to path[]
    └─ Reset currentDayDirection, directionSetBy, directionSetAt

00:00:10
└── 6. Daily PA Update - Expeditions (daily-pa.cron.ts)
    ├─ Find all members in DEPARTED expeditions
    ├─ Give +2 PA first (daily regeneration)
    ├─ Check if can afford 2 PA for expedition
    ├─ If yes: Deduct 2 PA
    └─ If no + catastrophic conditions → Remove from expedition
       (catastrophic = hungerLevel≤1 OR isDead OR hp=0 OR pm≤2)
```

### Morning Sequence (08:00:00)

```
08:00:00
├── Daily Messages (daily-message.cron.ts)
│   ├─ Build daily status message for each town
│   └─ Send to Discord log channels
│
└── Depart Expeditions (expedition.cron.ts)
    ├─ Find all LOCKED expeditions
    ├─ Change status to DEPARTED
    └─ Initialize path with initialDirection
```

### Continuous Monitoring (Every 10 minutes)

```
*/10 * * * *
├── Return Expeditions (expedition.cron.ts)
│   ├─ Find DEPARTED expeditions with returnAt <= now
│   ├─ Change status to RETURNED
│   └─ Handle resource transfers and notifications
│
└── Emergency Returns (expedition.cron.ts)
    └─ Process expeditions with pendingEmergencyReturn flag
```

### Weekly Maintenance (Monday 00:00:00)

```
Monday 00:00:00
└── Season Change (season-change.cron.ts)
    ├─ Check if season change is due
    ├─ Update current season
    └─ Notify Discord if changed
```

---

### Why This Order Matters

**Critical Sequencing:**
- **Heal BEFORE hunger decrease:** Hunger=4 heal must happen before hunger drops to 3 (atomicity in same job)
- **Reset agonySince BEFORE agony check:** Characters healed during night (hunger job) must have agonySince cleared first
- **Hunger before PA (main):** Hunger affects PA regeneration calculation
- **PM contagion before PA (main):** Depressed characters use paUsedToday logic
- **Death/agony check before PA:** Dead/dying characters handled correctly
- **PA reset before expedition:** paUsedToday must reset before daily costs
- **PA regeneration before expedition PA:** Main regeneration happens first
- **Append directions after PA but before deduction:** Path updates before new day costs
- **Expedition PA deduction 10s after main:** Ensures all updates are complete
- **Lock before depart:** Expeditions must be locked (00:00) before departing (08:00)
- **Messages at 08:00:** Sent after all midnight processing is complete

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

**Purpose:** Check for death/agony, reset PA counter, regenerate PA, and deduct expedition costs.

**IMPORTANT:** This file contains TWO separate jobs that run at different times.

**NOTE:** HP healing was moved to `hunger-increase.cron.ts` to ensure atomicity with hunger decrease.

#### Job 1: Main PA Update (00:00:00)

**Multi-Step Process:**

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

#### Job 2: Expedition PA Deduction (00:00:10)

**Purpose:** Deduct 2 PA for characters in DEPARTED expeditions.

```typescript
1. Find all ExpeditionMembers in DEPARTED expeditions

2. For each member:
   a. Skip if expedition has pendingEmergencyReturn flag

   b. Calculate PA after regeneration:
      newPaTotal = character.paTotal + 2

   c. Check if can afford expedition (needs >= 2 PA):
      If yes:
        - Deduct 2 PA: paTotal = newPaTotal - 2

      If no:
        - Check catastrophic return conditions:
          * hungerLevel <= 1 (Agonie)
          * isDead
          * hp == 0
          * pm <= 2 (Dépression/Déprime)

        - If catastrophic:
          * Remove member from expedition
          * Set reason (agonie, mort, dépression)
          * Log catastrophic return

        - If not catastrophic:
          * Log warning (shouldn't happen)
```

#### Key Features

- **Two-Stage PA System:** Regenerate first, then deduct expedition costs
- **Agony Death Timer:** 2 days in agony (hp=1) = automatic death
- **Hunger Penalties:** Affects PA regeneration (heal moved to hunger job)
- **Catastrophic Returns:** Automatic expedition removal for critical conditions
- **Daily Counter Reset:** paUsedToday reset for depression mechanics

#### Logging

```typescript
Main job console output:
- Total characters updated
- Number dead (hp=0 or 2-day agony)

Expedition job console output:
- Members who paid 2 PA
- Catastrophic returns with reasons
```

#### Configuration

```typescript
Main Job Pattern: "0 0 * * *"     // 00:00:00
Expedition Job Pattern: "10 0 * * *"  // 00:00:10
Timezone: Europe/Paris
```

#### Manual Execution

```bash
node backend/src/cron/daily-pa.cron.ts
# Note: Only runs main job, not expedition deduction
```

---

### 4. Expedition Management (`expedition.cron.ts`)

**Purpose:** Manage the complete expedition lifecycle across multiple stages.

This file contains **FIVE separate jobs** that handle different expedition phases.

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

#### Job 2: Append Daily Directions (00:00:05)

**Purpose:** Append the current day's direction to expedition path.

```typescript
Logic:
1. Find all DEPARTED expeditions with currentDayDirection != null
2. For each expedition:
   - Append currentDayDirection to path[]
   - Reset currentDayDirection = null
   - Reset directionSetBy = null
   - Reset directionSetAt = null
3. Log appended count
```

#### Job 3: Depart Expeditions (08:00:00)

**Purpose:** Depart all LOCKED expeditions in the morning.

```typescript
Logic:
1. Find all LOCKED expeditions
2. For each expedition:
   - Call expeditionService.departExpedition(id)
   - Initialize path with initialDirection (default UNKNOWN if null)
3. Log departed count
```

#### Job 4: Return Expeditions (Every 10 minutes)

**Purpose:** Process expeditions that have reached their return time.

```typescript
Logic:
1. Find all DEPARTED expeditions with returnAt <= now
2. For each expedition:
   - Call expeditionService.returnExpedition(id)
   - Handle resource transfers
   - Update expedition members
   - Send Discord notifications
3. Log returned count
```

#### Job 5: Process Emergency Returns (Every 10 minutes)

**Purpose:** Force emergency returns for expeditions flagged for immediate return.

```typescript
Logic:
1. Call expeditionService.forceEmergencyReturns()
2. Process all expeditions with pendingEmergencyReturn = true
3. Log emergency return count
```

#### Expedition Status Flow

```
PLANNING → LOCKED → DEPARTED → RETURNED
    ↓         ↓          ↓
 00:00:00   08:00:00   returnAt
 (lock)     (depart)   (return)
```

#### Configuration

```typescript
Lock Job: "0 0 * * *"        // 00:00:00
Append Job: "5 0 * * *"      // 00:00:05
Depart Job: "0 8 * * *"      // 08:00:00
Return Job: "*/10 * * * *"   // Every 10 minutes
Emergency Job: "*/10 * * * *" // Every 10 minutes
Timezone: Europe/Paris
```

---

### 5. Daily Messages (`daily-message.cron.ts`)

**Purpose:** Send daily status messages to Discord log channels.

**STATUS:** ⚠️ Partially Implemented (Discord integration pending)

#### Logic

```typescript
1. Find all towns with logChannelId configured
2. For each town:
   a. Build daily status message via dailyMessageService
   b. TODO: Send to Discord log channel
   c. Currently: Log message to console
3. Log sent count
```

#### Key Features

- **Town-Based:** One message per town
- **Guild Integration:** Uses guild logChannelId
- **Service-Driven:** Message building delegated to dailyMessageService
- **TODO:** Discord webhook/API call implementation pending

#### Configuration

```typescript
Cron Pattern: "0 8 * * *"  // Daily at 08:00:00
Timezone: Europe/Paris
```

---

### 6. Season Change (`season-change.cron.ts`)

**Purpose:** Manage seasonal transitions in the game world.

#### Logic

```typescript
1. Initialize SeasonService
2. Call checkAndUpdateSeason()
3. If season changed:
   - Log new season
   - TODO: Send Discord notification
4. If no change:
   - Log "no change needed"
```

#### Season System

```typescript
- Manages SUMMER ↔ WINTER transitions
- Checks season schedule weekly
- Updates current season in database
```

#### Configuration

```typescript
Cron Pattern: "0 0 * * 1"  // Every Monday at 00:00:00
Timezone: Europe/Paris
```

#### Manual Execution

```bash
node backend/src/cron/season-change.cron.ts
```

---

## 🔧 Development & Testing

### Running Cron Jobs Manually

All cron jobs support manual execution for testing:

```bash
# From project root
node backend/src/cron/hunger-increase.cron.ts
node backend/src/cron/daily-pm.cron.ts
node backend/src/cron/daily-pa.cron.ts
# Note: expedition.cron.ts doesn't support manual execution (5 separate jobs)
node backend/src/cron/season-change.cron.ts
# Note: daily-message.cron.ts doesn't support manual execution
```

### Disabling Cron Jobs

Cron jobs are automatically disabled in test environment:

```typescript
// In app.ts
if (process.env.NODE_ENV !== "test") {
  const { mainJob, expeditionJob } = setupDailyPaJob();
  mainJob.start();
  expeditionJob.start();
  setupHungerIncreaseJob();
  setupDailyPmJob();
  setupExpeditionJobs();
  setupSeasonChangeJob();
  setupDailyMessageJob();
}
```

### Testing Strategy

1. **Unit Tests:** Test individual cron logic functions
2. **Integration Tests:** Test full cron execution with test database
3. **Manual Testing:** Run cron scripts with development database
4. **Timing Tests:** Verify 10-second delay between PA main and expedition jobs
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

### TODO Items

1. **Daily Messages Integration:**
   - Implement Discord webhook/API call
   - Currently only logs to console

2. **Season Change Notifications:**
   - Add Discord notification when season changes
   - Currently only logs to console

### Known Limitations

1. **Race Conditions:**
   - Multiple jobs start at 00:00:00 simultaneously
   - 10-second delay mitigates PA race condition
   - Hunger job ensures atomicity by combining heal + hunger decrease
   - May need transaction isolation for other concurrent updates

2. **Expedition PA Logic:**
   - Assumes +2 PA regeneration in expedition job
   - Should read actual regeneration amount from main job result
   - Works because expedition job runs 10s after main job

3. **HP Healing Logic:**
   - HP healing moved from PA job to hunger job for atomicity
   - This ensures hunger=4 characters get healed before hunger drops to 3
   - Both jobs run at 00:00:00 but healing is now guaranteed to happen first

---

## 📚 Related Documentation

- **Game Mechanics:** See `GAME-MECHANICS.md` for how cron jobs affect gameplay
- **Database Schema:** See `backend/prisma/schema.prisma` for data models
- **API Services:** See `backend/src/services/` for business logic
- **Logger Service:** See `backend/src/services/logger.ts` for structured logging

---

**Last Updated:** 2025-10-16
**Version:** 2.2 - Fixed critical bugs:
- HP healing moved to hunger job for atomicity
- agonySince reset moved before agony duration check

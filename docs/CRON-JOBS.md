# 🕐 FateWeaver - Cron Jobs Documentation

This document provides technical documentation for all scheduled cron jobs in the FateWeaver bot backend.

---

## 📋 Overview

All cron jobs run at **midnight (00:00) in Europe/Paris timezone** and are registered in `/backend/src/app.ts`.

### Active Cron Jobs

| Job | File | Frequency | Purpose |
|-----|------|-----------|---------|
| **Daily PA** | `daily-pa.cron.ts` | Daily 00:00 | Heal HP, check death, regenerate PA |
| **Hunger Increase** | `hunger-increase.cron.ts` | Daily 00:00 | Decrease hunger levels |
| **Mental Health Contagion** | `daily-pm.cron.ts` | Daily 00:00 | Spread depression between characters |
| **Expedition Management** | `expedition.cron.ts` | Daily 00:00 | Handle expedition returns |
| **Season Change** | `season-change.cron.ts` | Variable | Manage seasonal changes |

---

## 🔄 Execution Order

**CRITICAL:** Cron jobs execute in a specific order to ensure correct game mechanics.

### Order of Operations (Daily Midnight Update)

```
1. Hunger Increase     (hunger-increase.cron.ts)
   ├─ Decrease hungerLevel by 1
   └─ If hunger=0 → Set hp=1 (Agonie)

2. Mental Health       (daily-pm.cron.ts)
   ├─ Find all PM=0 characters
   ├─ For each: Select random victim in same location
   └─ Victim loses 1 PM

3. Daily PA Update     (daily-pa.cron.ts)
   ├─ STEP 1: Heal HP if hungerLevel=4
   ├─ STEP 2: Check death if hp=0 → isDead=true
   └─ STEP 3: Regenerate PA (hunger penalty if hungerLevel≤1)

4. Expeditions         (expedition.cron.ts)
   └─ Process expedition returns

5. Seasons             (season-change.cron.ts)
   └─ Handle seasonal transitions
```

### Why This Order Matters

- **Hunger before PA:** Hunger affects PA regeneration, so it must update first
- **PM contagion before PA:** Characters who become depressed should not receive PA
- **Healing before death check:** Characters at hunger=4 get one last chance to heal before dying
- **Death check before PA:** Dead characters should not receive PA

---

## 📝 Job Details

### 1. Hunger Increase (`hunger-increase.cron.ts`)

**Purpose:** Decrease hunger levels for all living characters daily.

#### Logic

```typescript
For each living character (isDead=false):
  1. Decrease hungerLevel by 1 (min: 0)
  2. If hungerLevel reaches 0:
     - Set hp = 1 (Agonie state)
  3. Update character in database
```

#### Key Features

- **No Death:** Hunger reaching 0 does NOT kill directly (sets HP to 1 instead)
- **Persistent Hunger:** Once at 0, hunger stays at 0 until character eats
- **Logging:** Logs all characters entering agony state

#### Configuration

```typescript
Cron Pattern: "0 0 0 * * *"  // Daily at midnight
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
      - Log the contagion event

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
   - Each depressed character affects ONE different random victim
   - Same character can theoretically be affected by multiple depressed characters

2. **No eligible victims:**
   - If everyone in location is dead or already depressed → No contagion
   - Logged as "Aucune victime disponible"

3. **Expedition transitions:**
   - Only DEPARTED expeditions count as separate locations
   - PLANNING/LOCKED expeditions use city location

#### Configuration

```typescript
Cron Pattern: "0 0 * * *"  // Daily at midnight
Timezone: Europe/Paris
```

#### Manual Execution

```bash
node backend/src/cron/daily-pm.cron.ts
```

---

### 3. Daily PA Update (`daily-pa.cron.ts`)

**Purpose:** Heal HP, check for death, and regenerate action points.

#### Three-Step Process

**STEP 1: Heal HP (Satiété Bonus)**
```typescript
For each living character:
  If hungerLevel == 4 AND hp < 5:
    hp = min(5, hp + 1)
```

**STEP 2: Death Check**
```typescript
For each living character:
  If hp == 0:
    isDead = true
```

**STEP 3: PA Regeneration**
```typescript
For each living character (not dead from step 2):
  1. Calculate PA to add:
     - If hungerLevel <= 1: pointsToAdd = 1 (Affamé penalty)
     - Else: pointsToAdd = 2 (Normal)

  2. Apply cap:
     pointsToAdd = min(pointsToAdd, 4 - paTotal)

  3. If pointsToAdd > 0:
     paTotal += pointsToAdd
     lastPaUpdate = now
```

#### Logging

```typescript
Console output:
- Total characters updated
- Number healed (Satiété bonus)
- Number dead (hp=0)
```

#### Configuration

```typescript
Cron Pattern: "0 0 * * *"  // Daily at midnight
Timezone: Europe/Paris
```

#### Manual Execution

```bash
node backend/src/cron/daily-pa.cron.ts
```

---

### 4. Expedition Management (`expedition.cron.ts`)

**Purpose:** Process expedition returns and manage expedition lifecycle.

#### Logic

```typescript
1. Find all DEPARTED expeditions with returnAt <= now
2. For each expedition:
   - Change status to RETURNED
   - Handle resource transfers
   - Update expedition members
   - Send Discord notifications
```

#### Configuration

```typescript
Cron Pattern: "0 0 * * *"  // Daily at midnight
Timezone: Europe/Paris
```

---

### 5. Season Change (`season-change.cron.ts`)

**Purpose:** Manage seasonal transitions in the game world.

#### Logic

```typescript
Toggle between:
- SUMMER ↔ WINTER
Based on configured schedule
```

#### Configuration

```typescript
Cron Pattern: Variable (configured separately)
Timezone: Europe/Paris
```

---

## 🔧 Development & Testing

### Running Cron Jobs Manually

All cron jobs support manual execution for testing:

```bash
# From backend directory
node src/cron/hunger-increase.cron.ts
node src/cron/daily-pm.cron.ts
node src/cron/daily-pa.cron.ts
node src/cron/expedition.cron.ts
node src/cron/season-change.cron.ts
```

### Disabling Cron Jobs

Cron jobs are automatically disabled in test environment:

```typescript
// In app.ts
if (process.env.NODE_ENV !== "test") {
  setupDailyPaJob();
  setupHungerIncreaseJob();
  setupDailyPmJob();
  setupExpeditionJobs();
  setupSeasonChangeJob();
}
```

### Testing Strategy

1. **Unit Tests:** Test individual cron logic functions
2. **Integration Tests:** Test full cron execution with test database
3. **Manual Testing:** Run cron scripts with development database
4. **Production Monitoring:** Check logs after midnight for errors

---

## 📊 Performance Considerations

### Current Implementation

- **Sequential Processing:** Each character processed one-by-one
- **No Batching:** Individual database updates per character
- **Transaction Safety:** Some operations use Prisma transactions

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

**Trade-off:** Batch updates can't handle per-character logic differences.

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

### Monitoring Recommendations

1. **Log Aggregation:** Use structured logging (Winston, Pino)
2. **Alerting:** Send notifications for cron failures
3. **Health Checks:** Monitor last successful run timestamp
4. **Metrics:** Track execution time, characters processed, errors

---

## 📝 Adding New Cron Jobs

### Template

```typescript
import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";

const prisma = new PrismaClient();

async function myCustomUpdate() {
  try {
    console.log("Starting custom update...");

    // Your logic here

    console.log("Custom update complete");
  } catch (error) {
    console.error("Error in custom update:", error);
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
  console.log("My custom job configured");
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

---

## 📚 Related Documentation

- **Game Mechanics:** See `GAME-MECHANICS.md` for how cron jobs affect gameplay
- **Database Schema:** See `backend/prisma/schema.prisma` for data models
- **API Services:** See `backend/src/services/` for business logic

---

**Last Updated:** 2025-10-09
**Version:** 1.0 - Initial cron jobs technical documentation

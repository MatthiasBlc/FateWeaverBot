# 🎮 FateWeaver - Game Mechanics

This document describes the core game mechanics for the FateWeaver Discord RPG bot.

---

## 📊 Character Stats Overview

Each character has four primary stats that govern their survival and actions:

| Stat                     | Range | Icon | Description                             |
| ------------------------ | ----- | ---- | --------------------------------------- |
| **PA** (Points d'Action) | 0-4   | ⚡   | Action points for performing activities |
| **HP** (Points de Vie)   | 0-5   | ❤️   | Health points                           |
| **PM** (Points Mentaux)  | 0-5   | 💜   | Mental health points                    |
| **Hunger** (Faim)        | 0-4   | 🍖   | Hunger level                            |

---

## 🍖 Hunger System (Faim)

### Hunger Levels

| Level | Name    | Visual | Effects                        | Daily Update |
| ----- | ------- | ------ | ------------------------------ | ------------ |
| **4** | Satiété | 😊     | Heals +1 HP per day            | -1 hunger    |
| **3** | Faim    | 🤤     | Normal state                   | -1 hunger    |
| **2** | Faim    | 😕     | Normal state                   | -1 hunger    |
| **1** | Affamé  | 😰     | Only +1 PA regen instead of +2 | -1 hunger    |
| **0** | Agonie  | 💀     | Sets HP to 1 (Agonie state)    | Stays at 0   |

### Hunger Mechanics

- **Daily Decrease:** Hunger decreases by 1 point every day at midnight
- **Satiété Bonus:** At hunger level 4, characters heal 1 HP per day (before hunger decreases)
- **Affamé Penalty:** At hunger level ≤1, PA regeneration is reduced to +1 instead of +2
- **Starvation:** When hunger reaches 0, the character enters Agonie (HP drops to 1)

### Eating

Characters can eat to restore hunger:

- **Vivres (Food Supplies):** Restores **+1 hunger point** per vivre consumed
- **Repas (Prepared Meals):** Restores **+1 hunger point** per repas consumed
- **Important Rules:**
  - Each food item **always** restores exactly **1 point** of hunger
  - Food **never** kills or reduces hunger
  - Characters can only eat when hunger < 4
  - Maximum hunger is capped at 4 (Satiété)
- **Location Matters:**
  - In city → Uses city stocks
  - In DEPARTED expedition → Uses expedition stocks

---

## ❤️ Health System (HP - Points de Vie)

### HP Levels

| Level   | State  | Visual     | Effects                        |
| ------- | ------ | ---------- | ------------------------------ |
| **5-2** | Normal | ❤️❤️❤️❤️❤️ | No restrictions                |
| **1**   | Agonie | ❤️‍🩹🖤🖤🖤🖤 | **Cannot use PA**              |
| **0**   | Mort   | 🖤🖤🖤🖤🖤 | Character dies (`isDead=true`) |

### HP Mechanics

- **Death Check:** If HP reaches 0, character dies (`isDead=true`) during daily update
- **Agonie State:** At HP=1, character cannot use PA (any action blocked)
  - **Entry Triggers:**
    - HP drops to 1 from any cause (damage, admin edit, etc.) → Agony starts
    - Hunger reaches 0 from any cause → HP forced to 1 AND agony starts
  - **Exit Condition:** HP increases to 2 or more → Agony ends (`agonySince` cleared)
  - **Death Timer:** After 2 days in agony → Death (`isDead=true`, `hp=0`)
- **Healing Options:**
  - **Natural:** Eating at hunger level 4 (Satiété) → +1 HP per day
  - **Cataplasme:** Use a cataplasme (science resource) → +1 HP instantly
- **No Natural Regen:** HP does NOT regenerate on its own except through Satiété or cataplasmes

---

## 💜 Mental Health System (PM - Points Mentaux)

### PM Levels

| Level   | State      | Visual     | Effects                        |
| ------- | ---------- | ---------- | ------------------------------ |
| **5-2** | Normal     | 💜💜💜💜💜 | No restrictions                |
| **1**   | Déprime    | 💜🖤🖤🖤🖤 | **Cannot use PA**              |
| **0**   | Dépression | 💜🖤🖤🖤🖤 | **Cannot use PA + Contagious** |

### PM Mechanics

- **Déprime (PM=1):** Character cannot use PA (all actions blocked)
- **Dépression (PM=0):** Character cannot use PA AND spreads depression to others

#### PM Contagion System

When a character has PM=0 (Dépression):

1. **Daily Spread:** Each day at midnight, they affect ONE random character in their location
2. **Location Rules:**
   - If in city → Affects one random city character (not in DEPARTED expeditions)
   - If in DEPARTED expedition → Affects one random expedition member
3. **Target Selection:**
   - Target must NOT already be depressed (PM > 0)
   - Target must NOT be dead
   - Target must be in the same location
4. **Effect:** The affected character loses 1 PM

**Example:** Alice has PM=0 in the city. Bob and Carol are also in the city with PM=3. During the daily update, ONE of them (randomly selected) will drop to PM=2.

---

## ⚡ Action Points System (PA - Points d'Action)

### PA Mechanics

- **Range:** 0-4 PA
- **Daily Regeneration:** Characters gain PA every day at midnight
  - **Normal:** +2 PA per day
  - **Affamé (Hunger ≤1):** Only +1 PA per day
  - **Maximum:** PA cannot exceed 4

### PA Usage Restrictions

Characters **CANNOT** use PA if:

- **HP ≤ 1** (Agonie or dead)
- **PM ≤ 1** (Déprime or Dépression)

Error messages:

- HP=1: "Vous êtes en agonie et ne pouvez pas utiliser de PA"
- PM≤1: "Votre moral est trop bas pour utiliser des PA"

### PA Usage

PA is consumed when:

- Using capabilities (Hunt, Gather, Fish, etc.)
- Contributing to chantiers (construction projects)
- Other gameplay actions

---

## 🕐 Daily Update System

Every day at **midnight (00:00 Europe/Paris)**, a unified cron job orchestrates all updates **sequentially**:

### Execution Order (Unified Midnight Job)

The system uses a **unified orchestrator** (`/backend/src/cron/midnight-tasks.cron.ts`) that runs all tasks in sequence:

1. **Hunger Management** (`hunger-increase.cron.ts`)

   - STEP 1: Heal HP if `hungerLevel = 4` AND `hp < 5` → `hp + 1`
   - STEP 2: Decrease hunger for all living characters → `hungerLevel - 1`
   - STEP 3: If hunger reaches 0 → Set `hp = 1` (Agonie), mark `agonySince`

2. **PM Contagion** (`daily-pm.cron.ts`)

   - For each character with `pm = 0`:
     - Find eligible targets in same location (city or DEPARTED expedition)
     - Randomly select ONE target with PM > 0
     - Decrease target's PM by 1

3. **Lock Expeditions** (`expedition.cron.ts`)

   - Lock PLANNING expeditions created before midnight
   - Remove members with critical conditions (isDead, hp≤1, hungerLevel≤1, pm≤1)

4. **Daily PA Update** (`daily-pa.cron.ts`)
   - STEP 1: Reset agonySince if hp > 1 (recovered from agony)
   - STEP 2: Death check: if hp = 0 → set isDead = true
   - STEP 3: Agony duration check: 2 days in agony → death
   - STEP 4: Reset paUsedToday = 0
   - STEP 5: PA regeneration:
     - `hungerLevel ≤ 1` → +1 PA (Affamé penalty)
     - `hungerLevel > 1` → +2 PA (Normal)
     - Cap at 4 PA maximum
   - STEP 6: Append expedition directions to path[]
   - STEP 7: Deduct 2 PA for DEPARTED expeditions

**Morning Sequence (08:00 Europe/Paris):**

- **08:00:00** - Morning Expedition Job (`expedition.cron.ts`)
  - Returns expeditions (DEPARTED → RETURNED)
  - Then departs expeditions (LOCKED → DEPARTED)
- **08:00:05** - Daily Messages (Bot cron in `/bot/src/cron/daily-messages.cron.ts`)
  - Sends Discord embeds with weather, actions, stocks, expeditions

---

## 🚀 Expedition Restrictions

Characters in **DEPARTED** expeditions have special restrictions:

### Cannot Access City Resources

- ❌ Cannot invest in city chantiers
- ❌ Cannot contribute resources to city chantiers
- ❌ Cannot eat from city food stocks

### Can Only Use Expedition Resources

- ✅ Can eat from expedition food stocks
- ✅ Can participate in expedition activities

---

## 🛠️ Capabilities System

Characters can perform various activities using their PA (action points). Capabilities are divided into categories:

### 🌾 HARVEST Capabilities

Gather raw resources from the environment:

| Capability               | Cost      | Output                       | Description                                    |
| ------------------------ | --------- | ---------------------------- | ---------------------------------------------- |
| **Pêcher** (Fish)        | 1 or 2 PA | Variable vivres/bois/minerai | Fish in nearby waters (fixed loot tables)      |
| **Chasser** (Hunt)       | 1-2 PA    | 0-10 Vivres (seasonal pool)  | Hunt animals for food (weighted by season)     |
| **Cueillir** (Gather)    | 1-2 PA    | 0-3 Vivres (seasonal pool)   | Gather berries and plants (weighted by season) |
| **Couper du bois** (Log) | 1-2 PA    | 2-3 Bois                     | Chop wood from trees                           |
| **Miner**                | 2 PA      | 2-6 Minerai                  | Mine ore from rocks                            |
| **Cuisiner** (Cook)      | 1-2 PA    | Variable Repas               | Transform Vivres into Repas (craft formula)    |

**Loot Details:**

**Pêcher (Fishing):**

- **1 PA:** 17 possible outcomes (0-4 vivres, 2 bois, 2 minerai)
- **2 PA:** 17 possible outcomes (1-10 vivres, 4-6 bois/minerai) + rare GRIGRI event

**Chasser (Hunting):**

- **Summer:** Weighted pool [2, 3, 4, 5, 6, 7, 8, 9, 10] Vivres
- **Winter:** Weighted pool [0, 1, 1, 1, 2, 2, 3, 3, 4] Vivres (higher chance of low yields)

**Cueillir (Gathering):**

- **Summer:** Weighted pool [1, 2, 2, 3] Vivres
- **Winter:** Weighted pool [0, 1, 1, 2] Vivres

**Cuisiner (Cooking):**

- **1 PA:** Can use max 2 Vivres as input
- **Output:** Random(0, Input × 2) Repas
- **2 PA:** Can use max 5 Vivres as input
- **Output:** Random(0, Input × 3) Repas

### 🔨 CRAFT Capabilities (Project-Based)

**IMPORTANT:** Tisser and Forger are implemented as **Project mechanics**, not individual character capabilities.

Transform raw resources through artisan **Projects** (not raw crafting):

| Craft Type   | Input   | Output   | How to Use                             |
| ------------ | ------- | -------- | -------------------------------------- |
| **Tisser**   | Bois    | Tissu    | Create Project with CraftType.TISSER   |
| **Forger**   | Minerai | Métal    | Create Project with CraftType.FORGER   |
| **Travailler le bois** | Bois    | Planches | Create Project with CraftType.MENUISER |

**Cuisiner** is a standalone character capability (see HARVEST section above)

**Project Craft Rules:**

- Projects require planning and resource investment
- Multiple characters can contribute to projects
- Projects complete when resource goals are met
- See `/projets-admin` and project system documentation for details

### 🔬 SCIENCE Capabilities

Special knowledge-based actions:

| Capability                | Cost      | Effect                         | Description                                                                                           |
| ------------------------- | --------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Soigner**               | 1 or 2 PA | Heal +1 HP OR Craft cataplasme | Two modes: heal target (1 PA) or create medicine (2 PA). Bonus: HEAL_EXTRA gives 20% chance for +2 HP |
| **Rechercher** (Research) | 1-2 PA    | Provides information           | Research capability for knowledge gathering                                                           |
| **Cartographier**         | 1-2 PA    | Map exploration                | Cartography capability for exploration                                                                |
| **Auspice**               | 1-2 PA    | Fortune telling                | Divination capability for insights                                                                    |

**Soigner Modes:**

- **Mode 1 (1 PA):** Heal a target character for +1 HP
  - 20% chance for +2 HP instead (with HEAL_EXTRA bonus)
  - Cannot heal if target already at 5 HP
- **Mode 2 (2 PA):** Craft 1 cataplasme (requires limit check: max 3 per town)

### 🩹 Cataplasme System

**Cataplasme** is a special science resource with strict limits:

- **Creation:** Use Soigner capability (2 PA)
- **Limit:** Maximum 3 cataplasmes per town (city + all expeditions combined)
- **Usage:** Use cataplasme via POST endpoint `/characters/:id/use-cataplasme` when HP < 5
- **Effect:** Restores 1 HP instantly
- **Storage:** Stored as ResourceStock with ResourceType "Cataplasme"

**Implementation Details:**

- Limit check in `/backend/src/services/capability/capabilities/soigner.capability.ts` (lines 106-113)
- Uses `getCataplasmeCount(townId)` to count across all locations in town
- The 3-cataplasme limit is shared across the entire town, not per expedition. This prevents stockpiling.

---

## 📝 Status Summary

### Character States

| Condition                | Restrictions                        | Visual Indicators |
| ------------------------ | ----------------------------------- | ----------------- |
| **Dead** (`isDead=true`) | Cannot do anything                  | 💀 HP: 🖤🖤🖤🖤🖤 |
| **Agonie** (HP=1)        | Cannot use PA                       | HP: ❤️‍🩹🖤🖤🖤🖤    |
| **Dépression** (PM=0)    | Cannot use PA, spreads to others    | PM: 💜🖤🖤🖤🖤    |
| **Déprime** (PM=1)       | Cannot use PA                       | PM: 💜🖤🖤🖤🖤    |
| **Affamé** (Hunger ≤1)   | Reduced PA regen (+1 instead of +2) | 😰 or 💀          |

---

## 🎯 Strategy Tips

1. **Maintain Satiété (Hunger=4)** to heal HP naturally
2. **Avoid PM=0** to prevent spreading depression to your team
3. **Use PA before daily reset** - They cap at 4 and don't accumulate
4. **Monitor expedition members** - Depression spreads faster in small groups
5. **Return expeditions early** if too many members are depressed or injured
6. **Keep 1-2 cataplasmes in stock** for emergencies (max 3 per town)
7. **Craft in bulk with 2 PA** - More input = more output (up to 5 inputs)
8. **Balance resource gathering** - Fish (1 PA) is cheaper than mining (2 PA)

---

**Last Updated:** 2025-10-27 (V3 - Verified with actual codebase)
**Version:** 3.0 - Verified mechanics, corrected capacity system, updated cron architecture

**Changes in V3:**

- ✅ Verified all game mechanics against actual implementation
- ✅ Corrected HARVEST capabilities (added Chasser, Cueillir, Cuisiner)
- ✅ Clarified Tisser/Forger are Project mechanics, not character capabilities
- ✅ Updated cron job architecture to reflect unified midnight orchestrator
- ✅ Added HEAL_EXTRA bonus for Soigner capability
- ✅ Corrected expedition member removal condition (pm ≤ 1, not pm ≤ 2)
- ✅ Added morning sequence timing (08:00:00 expeditions, 08:00:05 Discord messages)

# 🎮 FateWeaver - Game Mechanics

This document describes the core game mechanics for the FateWeaver Discord RPG bot.

---

## 📊 Character Stats Overview

Each character has four primary stats that govern their survival and actions:

| Stat | Range | Icon | Description |
|------|-------|------|-------------|
| **PA** (Points d'Action) | 0-4 | ⚡ | Action points for performing activities |
| **HP** (Points de Vie) | 0-5 | ❤️ | Health points |
| **PM** (Points Mentaux) | 0-5 | 💜 | Mental health points |
| **Hunger** (Faim) | 0-4 | 🍖 | Hunger level |

---

## 🍖 Hunger System (Faim)

### Hunger Levels

| Level | Name | Visual | Effects | Daily Update |
|-------|------|--------|---------|--------------|
| **4** | Satiété | 😊 | Heals +1 HP per day | -1 hunger |
| **3** | Faim | 🤤 | Normal state | -1 hunger |
| **2** | Faim | 😕 | Normal state | -1 hunger |
| **1** | Affamé | 😰 | Only +1 PA regen instead of +2 | -1 hunger |
| **0** | Agonie | 💀 | Sets HP to 1 (Agonie state) | Stays at 0 |

### Hunger Mechanics

- **Daily Decrease:** Hunger decreases by 1 point every day at midnight
- **Satiété Bonus:** At hunger level 4, characters heal 1 HP per day (before hunger decreases)
- **Affamé Penalty:** At hunger level ≤1, PA regeneration is reduced to +1 instead of +2
- **Starvation:** When hunger reaches 0, the character enters Agonie (HP drops to 1)

### Eating

Characters can eat to restore hunger:
- **Vivres (Food Supplies):** Restores hunger (exact amount varies)
- **Nourriture (Prepared Food):** Restores hunger (exact amount varies)
- **Location Matters:**
  - In city → Uses city stocks
  - In DEPARTED expedition → Uses expedition stocks

---

## ❤️ Health System (HP - Points de Vie)

### HP Levels

| Level | State | Visual | Effects |
|-------|-------|--------|---------|
| **5-2** | Normal | ❤️❤️❤️❤️❤️ | No restrictions |
| **1** | Agonie | ❤️‍🩹🖤🖤🖤🖤 | **Cannot use PA** |
| **0** | Mort | 🖤🖤🖤🖤🖤 | Character dies (`isDead=true`) |

### HP Mechanics

- **Death Check:** If HP reaches 0, character dies (`isDead=true`) during daily update
- **Agonie State:** At HP=1, character cannot use PA (any action blocked)
- **Healing:** HP is restored by eating at hunger level 4 (Satiété) → +1 HP per day
- **No Natural Regen:** HP does NOT regenerate on its own except through Satiété

---

## 💜 Mental Health System (PM - Points Mentaux)

### PM Levels

| Level | State | Visual | Effects |
|-------|-------|--------|---------|
| **5-2** | Normal | 💜💜💜💜💜 | No restrictions |
| **1** | Déprime | 😔🖤🖤🖤🖤 | **Cannot use PA** |
| **0** | Dépression | 🌧️🖤🖤🖤🖤 | **Cannot use PA + Contagious** |

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

Every day at **midnight (00:00 Europe/Paris)**, the following updates occur **in order**:

### Execution Order

1. **Heal HP (if Satiété)**
   - If `hungerLevel = 4` AND `hp < 5` → `hp + 1`

2. **Decrease Hunger**
   - All living characters → `hungerLevel - 1`
   - If hunger reaches 0 → Set `hp = 1` (Agonie)

3. **Check Death**
   - If `hp = 0` → Set `isDead = true`

4. **PM Contagion**
   - For each character with `pm = 0`:
     - Find eligible targets in same location
     - Randomly select ONE target
     - Decrease target's PM by 1

5. **PA Regeneration**
   - Calculate PA to add based on hunger:
     - `hungerLevel ≤ 1` → +1 PA
     - `hungerLevel > 1` → +2 PA
   - Add PA (max 4)

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

## 📝 Status Summary

### Character States

| Condition | Restrictions | Visual Indicators |
|-----------|--------------|-------------------|
| **Dead** (`isDead=true`) | Cannot do anything | 💀 HP: 🖤🖤🖤🖤🖤 |
| **Agonie** (HP=1) | Cannot use PA | HP: ❤️‍🩹🖤🖤🖤🖤 |
| **Dépression** (PM=0) | Cannot use PA, spreads to others | PM: 🌧️🖤🖤🖤🖤 |
| **Déprime** (PM=1) | Cannot use PA | PM: 😔🖤🖤🖤🖤 |
| **Affamé** (Hunger ≤1) | Reduced PA regen (+1 instead of +2) | 😰 or 💀 |

---

## 🎯 Strategy Tips

1. **Maintain Satiété (Hunger=4)** to heal HP naturally
2. **Avoid PM=0** to prevent spreading depression to your team
3. **Use PA before daily reset** - They cap at 4 and don't accumulate
4. **Monitor expedition members** - Depression spreads faster in small groups
5. **Return expeditions early** if too many members are depressed or injured

---

**Last Updated:** 2025-10-09
**Version:** 1.0 - Initial game mechanics documentation

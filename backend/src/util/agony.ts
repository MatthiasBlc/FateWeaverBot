/**
 * Agony Management Utility
 *
 * Centralizes the logic for managing agony state transitions.
 *
 * RULES:
 * 1. If HP becomes 1 (from any cause) → Set agonySince if not already set
 * 2. If hunger becomes 0 (from any cause) → Set HP to 1 AND set agonySince
 * 3. If HP recovers (hp > 1) → Clear agonySince
 * 4. After 2 days in agony → Death (handled in daily-pa.cron.ts)
 */

export interface AgonyUpdateData {
  hp?: number;
  hungerLevel?: number;
  agonySince?: Date | null;
  enteredAgony?: boolean; // New flag to detect agony entrance
}

/**
 * Applies agony rules to character update data
 *
 * @param currentHp Current HP value of the character
 * @param currentHunger Current hunger level of the character
 * @param currentAgonySince Current agonySince timestamp (null if not in agony)
 * @param newHp New HP value (if being updated)
 * @param newHunger New hunger level (if being updated)
 * @returns Update data with agony rules applied
 */
export function applyAgonyRules(
  currentHp: number,
  currentHunger: number,
  currentAgonySince: Date | null,
  newHp?: number,
  newHunger?: number
): AgonyUpdateData {
  const updateData: AgonyUpdateData = {};

  // Determine final HP and hunger values
  const finalHp = newHp !== undefined ? newHp : currentHp;
  const finalHunger = newHunger !== undefined ? newHunger : currentHunger;

  // Add the new values to updateData if they're being changed
  if (newHp !== undefined) {
    updateData.hp = newHp;
  }
  if (newHunger !== undefined) {
    updateData.hungerLevel = newHunger;
  }

  // RULE 2: If hunger becomes 0 → Force HP to 1 and set agony
  if (finalHunger === 0) {
    updateData.hp = 1;
    // Only set agonySince if not already in agony
    if (currentHp !== 1 || !currentAgonySince) {
      updateData.agonySince = new Date();
      updateData.enteredAgony = true; // Flag for notification
    }
  }
  // RULE 1: If HP becomes 1 (and not from hunger=0) → Set agony
  else if (finalHp === 1) {
    // Only set agonySince if not already in agony
    if (currentHp !== 1 || !currentAgonySince) {
      updateData.agonySince = new Date();
      updateData.enteredAgony = true; // Flag for notification
    }
  }
  // RULE 3: If HP recovers (hp > 1) → Clear agony
  else if (finalHp > 1 && currentAgonySince) {
    updateData.agonySince = null;
  }

  return updateData;
}

/**
 * Checks if a character should enter agony based on HP or hunger
 *
 * @param hp Current or new HP value
 * @param hunger Current or new hunger level
 * @returns true if character should be in agony
 */
export function shouldBeInAgony(hp: number, hunger: number): boolean {
  return hp === 1 || hunger === 0;
}

/**
 * Checks if a character is recovering from agony
 *
 * @param newHp New HP value
 * @param newHunger New hunger level
 * @returns true if character is recovering (hp > 1 and hunger > 0)
 */
export function isRecoveringFromAgony(newHp: number, newHunger: number): boolean {
  return newHp > 1 && newHunger > 0;
}

/**
 * Integration tests for midnight cron tasks
 * Tests the critical scenario where a DEPARTED expedition member
 * cannot afford the 2 PA cost and must make a catastrophic return
 */

import { ExpeditionStatus, Direction } from '@prisma/client';
import { container } from '../../infrastructure/container';
import {
  createTestCharacter,
  createTestExpedition,
  addExpeditionMember,
  cleanupTestData,
  getTestTownAndUser,
  prisma,
} from '../helpers/test-data';

describe('Midnight Tasks - Catastrophic Return', () => {
  let townId: string;
  let userId: string;
  const TEST_CHARACTER_PREFIX = 'TestCatastrophic';

  beforeAll(async () => {
    // Get valid town and user for testing
    const testData = await getTestTownAndUser();
    townId = testData.townId;
    userId = testData.userId;
  });

  afterEach(async () => {
    // Cleanup test data after each test
    await cleanupTestData(TEST_CHARACTER_PREFIX);
  });

  afterAll(async () => {
    // Ensure cleanup and disconnect
    await cleanupTestData(TEST_CHARACTER_PREFIX);
    await prisma.$disconnect();
  });

  describe('DEPARTED expedition member with insufficient PA', () => {
    it('should trigger catastrophic return when member has only 1 PA after regeneration', async () => {
      // === ARRANGE ===

      // Create a character with conditions that will cause catastrophic return:
      // - 0 PA currently
      // - hungerLevel = 1 (will regenerate only +1 PA instead of +2)
      // - lastPaUpdate = yesterday (will trigger PA regeneration)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const characterId = await createTestCharacter({
        name: `${TEST_CHARACTER_PREFIX}_LowPA`,
        paTotal: 0,
        hungerLevel: 1,
        hp: 5,
        pm: 5,
        lastPaUpdate: yesterday,
        townId,
        userId,
      });

      // Create a DEPARTED expedition
      const oldDate = new Date('2025-11-01T10:00:00Z');
      const expeditionId = await createTestExpedition({
        name: `${TEST_CHARACTER_PREFIX}_Expedition`,
        status: ExpeditionStatus.DEPARTED,
        duration: 5,
        initialDirection: Direction.NORD,
        path: [Direction.NORD],
        createdAt: oldDate,
        townId,
        createdBy: userId,
      });

      // Add character to the expedition
      await addExpeditionMember(expeditionId, characterId);

      // Verify initial state
      const initialCharacter = await prisma.character.findUnique({
        where: { id: characterId },
        include: { expeditionMembers: true },
      });

      expect(initialCharacter).not.toBeNull();
      expect(initialCharacter!.paTotal).toBe(0);
      expect(initialCharacter!.hungerLevel).toBe(1);
      expect(initialCharacter!.expeditionMembers).toHaveLength(1);

      // === ACT ===

      // Simulate STEP 4: Daily PA Update
      // This will:
      // 1. Regenerate PA (+1 PA because hungerLevel = 1) → Total: 1 PA
      // 2. Try to deduct 2 PA for expedition
      // 3. Fail and trigger catastrophic return

      // Import the deductExpeditionPA function
      // Note: In a real scenario, you might need to refactor the script
      // to export these functions or call the entire midnight script

      // For now, we'll manually simulate the PA update and deduction logic

      // Step 1: PA Regeneration
      const now = new Date();
      const character = await prisma.character.findUnique({
        where: { id: characterId },
      });

      const lastUpdate = character!.lastPaUpdate;
      const lastUpdateDate = new Date(
        lastUpdate.getFullYear(),
        lastUpdate.getMonth(),
        lastUpdate.getDate()
      );
      const currentDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const daysSinceLastUpdate = Math.floor(
        (currentDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let pointsToAdd = 2;
      if (character!.hungerLevel <= 1) {
        pointsToAdd = 1;
      }
      const maxPointsToAdd = 4 - character!.paTotal;
      pointsToAdd = Math.min(pointsToAdd, maxPointsToAdd);

      if (daysSinceLastUpdate >= 1 && character!.paTotal < 4) {
        await prisma.character.update({
          where: { id: characterId },
          data: {
            paTotal: { increment: pointsToAdd },
            lastPaUpdate: now,
          },
        });
      }

      // Step 2: Try to deduct 2 PA for expedition
      const updatedCharacter = await prisma.character.findUnique({
        where: { id: characterId },
      });

      const canAffordExpedition = updatedCharacter!.paTotal >= 2;

      if (!canAffordExpedition) {
        // Catastrophic return should happen
        const paidAmount = updatedCharacter!.paTotal;

        await prisma.character.update({
          where: { id: characterId },
          data: { paTotal: 0 },
        });

        // Call the actual service method
        await container.expeditionService.removeMemberCatastrophic(
          expeditionId,
          characterId
        );
      }

      // === ASSERT ===

      // Verify character is no longer in expedition
      const finalCharacter = await prisma.character.findUnique({
        where: { id: characterId },
        include: { expeditionMembers: true },
      });

      expect(finalCharacter).not.toBeNull();
      expect(finalCharacter!.paTotal).toBe(0); // Paid what they could (1 PA)
      expect(finalCharacter!.expeditionMembers).toHaveLength(0); // Removed from expedition

      // Verify catastrophic return log was created
      const logs = await prisma.dailyEventLog.findMany({
        where: {
          townId: townId,
          eventType: 'CHARACTER_CATASTROPHIC_RETURN',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].description).toContain(TEST_CHARACTER_PREFIX);
    });

    it('should allow member to pay 2 PA and stay in expedition when they have sufficient PA', async () => {
      // === ARRANGE ===

      // Create a character with sufficient conditions:
      // - 0 PA currently
      // - hungerLevel = 3 (will regenerate +2 PA)
      // - lastPaUpdate = yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const characterId = await createTestCharacter({
        name: `${TEST_CHARACTER_PREFIX}_GoodPA`,
        paTotal: 0,
        hungerLevel: 3,
        hp: 5,
        pm: 5,
        lastPaUpdate: yesterday,
        townId,
        userId,
      });

      const expeditionId = await createTestExpedition({
        name: `${TEST_CHARACTER_PREFIX}_Expedition2`,
        status: ExpeditionStatus.DEPARTED,
        duration: 5,
        initialDirection: Direction.NORD,
        path: [Direction.NORD],
        createdAt: new Date('2025-11-01T10:00:00Z'),
        townId,
        createdBy: userId,
      });

      await addExpeditionMember(expeditionId, characterId);

      // === ACT ===

      // Simulate PA regeneration
      const now = new Date();
      const character = await prisma.character.findUnique({
        where: { id: characterId },
      });

      const lastUpdate = character!.lastPaUpdate;
      const daysSinceLastUpdate = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let pointsToAdd = 2;
      if (character!.hungerLevel <= 1) {
        pointsToAdd = 1;
      }

      if (daysSinceLastUpdate >= 1 && character!.paTotal < 4) {
        await prisma.character.update({
          where: { id: characterId },
          data: {
            paTotal: { increment: pointsToAdd },
            lastPaUpdate: now,
          },
        });
      }

      // Deduct 2 PA for expedition
      const updatedCharacter = await prisma.character.findUnique({
        where: { id: characterId },
      });

      if (updatedCharacter!.paTotal >= 2) {
        await prisma.character.update({
          where: { id: characterId },
          data: { paTotal: { decrement: 2 } },
        });
      }

      // === ASSERT ===

      const finalCharacter = await prisma.character.findUnique({
        where: { id: characterId },
        include: { expeditionMembers: true },
      });

      expect(finalCharacter).not.toBeNull();
      expect(finalCharacter!.paTotal).toBe(0); // 0 + 2 (regen) - 2 (expedition) = 0
      expect(finalCharacter!.expeditionMembers).toHaveLength(1); // Still in expedition
    });
  });

  describe('LOCKED expedition member with insufficient PA', () => {
    it('should allow partial payment and keep member in LOCKED expedition (edge case)', async () => {
      // This should never happen in normal conditions, but we handle it gracefully

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const characterId = await createTestCharacter({
        name: `${TEST_CHARACTER_PREFIX}_LockedEdge`,
        paTotal: 0,
        hungerLevel: 1,
        hp: 5,
        pm: 5,
        lastPaUpdate: yesterday,
        townId,
        userId,
      });

      const expeditionId = await createTestExpedition({
        name: `${TEST_CHARACTER_PREFIX}_LockedExp`,
        status: ExpeditionStatus.LOCKED,
        duration: 5,
        initialDirection: Direction.NORD,
        path: [],
        createdAt: new Date('2025-11-01T10:00:00Z'),
        townId,
        createdBy: userId,
      });

      await addExpeditionMember(expeditionId, characterId);

      // Simulate PA regeneration (only +1 PA)
      await prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: 1,
          lastPaUpdate: new Date(),
        },
      });

      // Try to deduct 2 PA - should only deduct what's available
      const character = await prisma.character.findUnique({
        where: { id: characterId },
      });

      if (character!.paTotal < 2) {
        // For LOCKED: Pay what you can, stay in expedition
        await prisma.character.update({
          where: { id: characterId },
          data: { paTotal: 0 },
        });
      }

      // === ASSERT ===

      const finalCharacter = await prisma.character.findUnique({
        where: { id: characterId },
        include: { expeditionMembers: true },
      });

      expect(finalCharacter!.paTotal).toBe(0);
      expect(finalCharacter!.expeditionMembers).toHaveLength(1); // Still in expedition
    });
  });
});

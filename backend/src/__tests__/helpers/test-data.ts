/**
 * Test data helpers for creating test fixtures
 */

import { PrismaClient, Direction, ExpeditionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestCharacterData {
  name: string;
  paTotal: number;
  hungerLevel: number;
  hp: number;
  pm: number;
  lastPaUpdate: Date;
}

export interface TestExpeditionData {
  name: string;
  status: ExpeditionStatus;
  duration: number;
  initialDirection: Direction;
  path: Direction[];
  createdAt: Date;
}

/**
 * Creates a test character with specified attributes
 */
export async function createTestCharacter(
  data: Partial<TestCharacterData> & { townId: string; userId: string }
): Promise<string> {
  const character = await prisma.character.create({
    data: {
      name: data.name || 'Test Character',
      paTotal: data.paTotal ?? 2,
      hungerLevel: data.hungerLevel ?? 3,
      hp: data.hp ?? 5,
      pm: data.pm ?? 5,
      isDead: false,
      lastPaUpdate: data.lastPaUpdate || new Date(),
      townId: data.townId,
      userId: data.userId,
    },
  });

  return character.id;
}

/**
 * Creates a test expedition with specified attributes
 */
export async function createTestExpedition(
  data: Partial<TestExpeditionData> & { townId: string; createdBy: string }
): Promise<string> {
  const expedition = await prisma.expedition.create({
    data: {
      name: data.name || 'Test Expedition',
      status: data.status || ExpeditionStatus.PLANNING,
      duration: data.duration ?? 5,
      initialDirection: data.initialDirection || Direction.NORD,
      path: data.path || [],
      createdAt: data.createdAt || new Date(),
      townId: data.townId,
      createdBy: data.createdBy,
    },
  });

  return expedition.id;
}

/**
 * Adds a character as a member of an expedition
 */
export async function addExpeditionMember(
  expeditionId: string,
  characterId: string
): Promise<void> {
  await prisma.expeditionMember.create({
    data: {
      expeditionId,
      characterId,
    },
  });
}

/**
 * Cleans up test data by character name pattern
 */
export async function cleanupTestData(namePattern: string): Promise<void> {
  // Find characters matching the pattern
  const characters = await prisma.character.findMany({
    where: {
      name: {
        contains: namePattern,
      },
    },
    select: { id: true },
  });

  const characterIds = characters.map((c) => c.id);

  if (characterIds.length === 0) return;

  // Delete expedition members first (foreign key constraint)
  await prisma.expeditionMember.deleteMany({
    where: {
      characterId: { in: characterIds },
    },
  });

  // Delete expeditions created by these test characters
  await prisma.expedition.deleteMany({
    where: {
      createdBy: { in: characterIds.map((id) => id) },
    },
  });

  // Delete characters
  await prisma.character.deleteMany({
    where: {
      id: { in: characterIds },
    },
  });
}

/**
 * Gets a valid town and user for testing
 */
export async function getTestTownAndUser(): Promise<{
  townId: string;
  userId: string;
}> {
  const character = await prisma.character.findFirst({
    where: { isDead: false },
    select: {
      townId: true,
      userId: true,
    },
  });

  if (!character) {
    throw new Error('No character found for testing. Please seed the database first.');
  }

  return {
    townId: character.townId,
    userId: character.userId,
  };
}

export { prisma };

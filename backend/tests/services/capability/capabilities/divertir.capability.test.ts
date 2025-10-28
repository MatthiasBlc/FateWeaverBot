import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DivertirCapability } from '../../../../src/services/capability/capabilities/divertir.capability';
import { PrismaClient } from '@prisma/client';
import { CapabilityRepository } from '../../../../src/domain/repositories/capability.repository';

const prismaMock = {
  character: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

const repoMock = {} as CapabilityRepository;

vi.mock('../../../../src/util/character-validators', () => ({
  hasDivertExtraBonus: vi.fn(),
}));

describe('DivertirCapability', () => {
  let capability: DivertirCapability;

  beforeEach(() => {
    capability = new DivertirCapability(prismaMock, repoMock);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should have correct name and category', () => {
      expect(capability.name).toBe('Divertir');
      expect(capability.category).toBe('SPECIAL');
    });

    it('should increment divert counter when under 5 PA', async () => {
      const { hasDivertExtraBonus } = await import('../../../../src/util/character-validators');

      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'Artiste',
        divertCounter: 2, // Currently at 2/5
        townId: 'town-1',
        town: { id: 'town-1', name: 'TestTown' },
      });

      (hasDivertExtraBonus as any).mockResolvedValue(false);

      const result = await capability.execute('char-1', 'cap-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('3/5'); // Incremented to 3
      expect(result.paConsumed).toBe(1);
      expect(result.metadata?.divertCounter).toBe(3);
      expect(result.effects).toBeUndefined(); // No spectacle yet
    });

    it('should trigger spectacle at 5 PA', async () => {
      const { hasDivertExtraBonus } = await import('../../../../src/util/character-validators');

      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'Artiste',
        divertCounter: 4, // At 4/5, next use triggers
        townId: 'town-1',
        town: { id: 'town-1', name: 'TestTown' },
      });

      (prismaMock.character.findMany as any).mockResolvedValue([
        { id: 'char-2', pm: 3 },
        { id: 'char-3', pm: 4 },
        { id: 'char-4', pm: 5 }, // Already at max, should not be included
      ]);

      (hasDivertExtraBonus as any).mockResolvedValue(false);

      const result = await capability.execute('char-1', 'cap-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('remonte le moral');
      expect(result.metadata?.divertCounter).toBe(0); // Reset
      expect(result.metadata?.pmGained).toBe(1);
      expect(result.effects).toHaveLength(2); // Only char-2 and char-3
      expect(result.effects?.[0]).toEqual({
        targetCharacterId: 'char-2',
        pmChange: 1,
      });
    });

    it('should trigger instant spectacle with ENTERTAIN_BURST bonus', async () => {
      const { hasDivertExtraBonus } = await import('../../../../src/util/character-validators');

      // Mock Math.random to always succeed (roll 1)
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.01); // Roll = 1% (will succeed with 5% chance)

      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'Artiste',
        divertCounter: 0, // First PA
        townId: 'town-1',
        town: { id: 'town-1', name: 'TestTown' },
      });

      (prismaMock.character.findMany as any).mockResolvedValue([
        { id: 'char-2', pm: 3 },
      ]);

      (hasDivertExtraBonus as any).mockResolvedValue(true);

      const result = await capability.execute('char-1', 'cap-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Divert Extra');
      expect(result.message).toContain('instantané');
      expect(result.metadata?.bonusApplied).toContain('ENTERTAIN_BURST');
      expect(result.metadata?.divertCounter).toBe(0); // Reset by instant spectacle

      // Restore Math.random
      Math.random = originalRandom;
    });

    it('should NOT trigger instant spectacle if roll fails', async () => {
      const { hasDivertExtraBonus } = await import('../../../../src/util/character-validators');

      // Mock Math.random to fail
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.99); // Roll = 99% (will fail 5% chance)

      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'Artiste',
        divertCounter: 0,
        townId: 'town-1',
        town: { id: 'town-1', name: 'TestTown' },
      });

      (hasDivertExtraBonus as any).mockResolvedValue(true);

      const result = await capability.execute('char-1', 'cap-1');

      expect(result.success).toBe(true);
      expect(result.message).not.toContain('instantané');
      expect(result.metadata?.divertCounter).toBe(1); // Just incremented
      expect(result.effects).toBeUndefined(); // No spectacle

      Math.random = originalRandom;
    });

    it('should throw error if character not found', async () => {
      (prismaMock.character.findUnique as any).mockResolvedValue(null);

      await expect(
        capability.execute('invalid-char', 'cap-1')
      ).rejects.toThrow('Character');
    });
  });
});

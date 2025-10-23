import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChasserCapability } from '../../../../src/services/capability/capabilities/chasser.capability';
import { PrismaClient } from '@prisma/client';
import { CapabilityRepository } from '../../../../src/domain/repositories/capability.repository';

// Mock dependencies
const prismaMock = {
  character: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

const repoMock = {} as CapabilityRepository;

// Mock des fonctions de validation et random
vi.mock('../../../../src/util/character-validators', () => ({
  hasLuckyRollBonus: vi.fn(),
}));

vi.mock('../../../../src/util/capacityRandom', () => ({
  getHuntYield: vi.fn(),
}));

describe('ChasserCapability', () => {
  let capability: ChasserCapability;

  beforeEach(() => {
    capability = new ChasserCapability(prismaMock, repoMock);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should have correct name and category', () => {
      expect(capability.name).toBe('Chasser');
      expect(capability.category).toBe('HARVEST');
    });

    it('should execute successfully in summer without bonus', async () => {
      const { hasLuckyRollBonus } = await import('../../../../src/util/character-validators');
      const { getHuntYield } = await import('../../../../src/util/capacityRandom');

      // Mock character
      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'TestChar',
      });

      // Mock no bonus
      (hasLuckyRollBonus as any).mockResolvedValue(false);
      (getHuntYield as any).mockReturnValue(3);

      const result = await capability.execute('char-1', 'cap-1', { isSummer: true });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Vous avez chassé avec succès');
      expect(result.message).toContain('3 vivres');
      expect(result.message).not.toContain('Lucky Roll');
      expect(result.paConsumed).toBe(2);
      expect(result.loot).toEqual({ Vivres: 3 });
      expect(result.metadata?.bonusApplied).toEqual([]);
    });

    it('should execute successfully with LUCKY_ROLL bonus', async () => {
      const { hasLuckyRollBonus } = await import('../../../../src/util/character-validators');
      const { getHuntYield } = await import('../../../../src/util/capacityRandom');

      // Mock character
      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'TestChar',
      });

      // Mock bonus active
      (hasLuckyRollBonus as any).mockResolvedValue(true);
      (getHuntYield as any).mockReturnValue(5);

      const result = await capability.execute('char-1', 'cap-1', { isSummer: true });

      expect(result.success).toBe(true);
      expect(result.message).toContain('⭐ (Lucky Roll)');
      expect(result.publicMessage).toContain('⭐');
      expect(result.loot).toEqual({ Vivres: 5 });
      expect(result.metadata?.bonusApplied).toEqual(['LUCKY_ROLL']);
    });

    it('should work in winter', async () => {
      const { hasLuckyRollBonus } = await import('../../../../src/util/character-validators');
      const { getHuntYield } = await import('../../../../src/util/capacityRandom');

      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'TestChar',
      });

      (hasLuckyRollBonus as any).mockResolvedValue(false);
      (getHuntYield as any).mockReturnValue(2); // Less food in winter

      const result = await capability.execute('char-1', 'cap-1', { isSummer: false });

      expect(result.success).toBe(true);
      expect(result.loot).toEqual({ Vivres: 2 });
      expect(getHuntYield).toHaveBeenCalledWith(false, false);
    });

    it('should throw error if character not found', async () => {
      (prismaMock.character.findUnique as any).mockResolvedValue(null);

      await expect(
        capability.execute('invalid-char', 'cap-1', { isSummer: true })
      ).rejects.toThrow('Character');
    });

    it('should default to summer if isSummer not specified', async () => {
      const { hasLuckyRollBonus } = await import('../../../../src/util/character-validators');
      const { getHuntYield } = await import('../../../../src/util/capacityRandom');

      (prismaMock.character.findUnique as any).mockResolvedValue({
        id: 'char-1',
        name: 'TestChar',
      });

      (hasLuckyRollBonus as any).mockResolvedValue(false);
      (getHuntYield as any).mockReturnValue(3);

      await capability.execute('char-1', 'cap-1');

      expect(getHuntYield).toHaveBeenCalledWith(true, false); // Default to summer
    });
  });
});

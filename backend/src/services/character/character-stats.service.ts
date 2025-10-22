import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CharacterStatsService {
  constructor() {
    // TODO: Implement character stats management methods
    // - HP/PM/PA management
    // - Hunger management
    // - Health calculations
  }
}

// Export singleton instance for backward compatibility
export const characterStatsService = new CharacterStatsService();

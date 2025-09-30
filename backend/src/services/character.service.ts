import { PrismaClient, Character, User, Town, Guild } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateCharacterData {
  name: string;
  userId: string;
  townId: string;
}

export interface CharacterWithDetails extends Character {
  user: Pick<
    User,
    | "id"
    | "discordId"
    | "username"
    | "discriminator"
    | "globalName"
    | "avatar"
    | "createdAt"
    | "updatedAt"
  >;
  town: Town & { guild: Pick<Guild, "id" | "discordGuildId" | "name"> };
}

export class CharacterService {
  /**
   * Get active character for a user in a town (most recently created)
   */
  async getActiveCharacter(
    userId: string,
    townId: string
  ): Promise<CharacterWithDetails | null> {
    return await prisma.character.findFirst({
      where: {
        userId,
        townId,
      },
      include: {
        user: true,
        town: {
          include: {
            guild: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Le personnage le plus récent créé
      },
    });
  }

  /**
   * Get all characters for a user in a town
   */
  async getUserCharacters(
    userId: string,
    townId: string
  ): Promise<CharacterWithDetails[]> {
    return await prisma.character.findMany({
      where: {
        userId,
        townId,
      },
      include: {
        user: true,
        town: {
          include: {
            guild: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { isDead: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Create first character for a user in a town
   */
  async createCharacter(data: CreateCharacterData): Promise<Character> {
    return await prisma.character.create({
      data: {
        name: data.name,
        userId: data.userId,
        townId: data.townId,
        isActive: true,
        isDead: false,
        canReroll: false,
        hungerLevel: 4,
        paTotal: 2,
      },
    });
  }

  /**
   * Create reroll character after death
   */
  async createRerollCharacter(
    userId: string,
    townId: string,
    name: string
  ): Promise<Character> {
    // Verify user has reroll permission
    const deadCharacter = await prisma.character.findFirst({
      where: {
        userId,
        townId,
        isDead: true,
        canReroll: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!deadCharacter) {
      throw new Error("No reroll permission found");
    }

    // Create new character
    const newCharacter = await prisma.character.create({
      data: {
        name,
        userId,
        townId,
        isActive: true,
        isDead: false,
        canReroll: false,
        hungerLevel: 4,
        paTotal: 2,
      },
    });

    // Revoke reroll permission
    await prisma.character.update({
      where: { id: deadCharacter.id },
      data: { canReroll: false },
    });

    return newCharacter;
  }

  /**
   * Kill a character (death)
   */
  async killCharacter(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: {
        isDead: true,
        hungerLevel: 0,
        paTotal: 0, // Les personnages morts n'ont plus de PA
        lastPaUpdate: new Date(),
      },
    });
  }

  /**
   * Grant reroll permission to a dead character
   */
  async grantRerollPermission(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: { canReroll: true },
    });
  }

  /**
   * Revoke reroll permission
   */
  async revokeRerollPermission(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: { canReroll: false },
    });
  }

  /**
   * Switch active character for a user in a town
   */
  async switchActiveCharacter(
    userId: string,
    townId: string,
    characterId: string
  ): Promise<Character> {
    // Use transaction to ensure only one active character
    return await prisma.$transaction(async (tx) => {
      // Deactivate all characters for this user in this town
      await tx.character.updateMany({
        where: {
          userId,
          townId,
          isActive: true,
        },
        data: { isActive: false },
      });

      // Activate the new character
      return await tx.character.update({
        where: {
          id: characterId,
          userId, // Security: ensure user owns this character
          townId,
          isDead: false, // Cannot activate dead character
        },
        data: { isActive: true },
      });
    });
  }

  /**
   * Update character hunger and PA
   */
  async updateCharacterStats(
    characterId: string,
    hungerChange: number,
    paChange: number
  ): Promise<Character> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const newHunger = Math.max(
      0,
      Math.min(4, character.hungerLevel + hungerChange)
    );
    const newPa = Math.max(0, Math.min(4, character.paTotal + paChange));

    return await prisma.character.update({
      where: { id: characterId },
      data: {
        hungerLevel: newHunger,
        paTotal: newPa,
        lastPaUpdate: new Date(),
      },
    });
  }

  /**
   * Get all characters in a town (admin function)
   */
  async getTownCharacters(townId: string): Promise<CharacterWithDetails[]> {
    return await prisma.character.findMany({
      where: { townId },
      include: {
        user: {
          select: {
            id: true,
            discordId: true,
            username: true,
            discriminator: true,
            globalName: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        town: {
          include: {
            guild: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { isDead: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Check if character should die from hunger
{{ ... }}
   */
  async checkHungerDeath(characterId: string): Promise<boolean> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character || character.isDead) {
      return false;
    }

    if (character.hungerLevel <= 0) {
      await this.killCharacter(characterId);
      return true;
    }

    return false;
  }

  /**
   * Get or create user (utility function)
   */
  async getOrCreateUser(
    discordId: string,
    username: string,
    discriminator?: string
  ): Promise<User> {
    let user = await prisma.user.findUnique({
      where: { discordId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId,
          username,
          discriminator: discriminator || "0000",
        },
      });
    }

    return user;
  }

  /**
   * Get town by guild ID
   */
  async getTownByGuildId(guildId: string): Promise<Town | null> {
    return await prisma.town.findUnique({
      where: { guildId },
    });
  }

  /**
   * Ensure guild has a town
   */
  async ensureGuildHasTown(guildId: string, guildName: string): Promise<Town> {
    let town = await prisma.town.findUnique({
      where: { guildId },
    });

    if (!town) {
      town = await prisma.town.create({
        data: {
          name: `${guildName} - Ville`,
          guildId,
          foodStock: 100,
        },
      });
    }

    return town;
  }

  /**
   * Consume PA from character
   */
  async consumePA(characterId: string, amount: number): Promise<Character> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    if (character.paTotal < amount) {
      throw new Error("Not enough PA");
    }

    return await prisma.character.update({
      where: { id: characterId },
      data: {
        paTotal: character.paTotal - amount,
        lastPaUpdate: new Date(),
      },
    });
  }

  /**
   * Regenerate PA for character
   */
  async regeneratePA(characterId: string): Promise<Character | null> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character || character.isDead) {
      return character;
    }

    // Regenerate PA if enough time has passed
    const now = new Date();
    const hoursSinceLastUpdate =
      (now.getTime() - character.lastPaUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastUpdate >= 1 && character.paTotal < 4) {
      return await prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: Math.min(4, character.paTotal + 1),
          lastPaUpdate: now,
        },
      });
    }

    return character;
  }

  /**
   * Get dead characters eligible for reroll
   */
  async getRerollableCharacters(
    userId: string,
    townId: string
  ): Promise<Character[]> {
    return await prisma.character.findMany({
      where: {
        userId,
        townId,
        isDead: true,
        canReroll: true,
      },
    });
  }

  /**
   * Check if user needs to create character (no active character)
   */
  async needsCharacterCreation(
    userId: string,
    townId: string
  ): Promise<boolean> {
    const activeCharacter = await this.getActiveCharacter(userId, townId);
    return !activeCharacter;
  }

  /**
   * Get character by ID with full details
   */
  async getCharacterById(
    characterId: string
  ): Promise<CharacterWithDetails | null> {
    return await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        user: true,
        town: {
          include: {
            guild: true,
          },
        },
      },
    });
  }

  /**
   * Update character hunger (used by actions that affect hunger)
   */
  async updateHunger(
    characterId: string,
    newHungerLevel: number
  ): Promise<Character> {
    const hunger = Math.max(0, Math.min(4, newHungerLevel));

    return await prisma.character.update({
      where: { id: characterId },
      data: {
        hungerLevel: hunger,
        // Kill character if hunger reaches 0
        ...(hunger === 0 && { isDead: true, isActive: false }),
      },
    });
  }

  /**
   * Bulk update characters (for admin operations)
   */
  async bulkUpdateCharacters(
    filter: { userId?: string; townId?: string; isDead?: boolean },
    data: Partial<Character>
  ): Promise<number> {
    return await prisma.character
      .updateMany({
        where: filter,
        data,
      })
      .then((result) => result.count);
  }
}

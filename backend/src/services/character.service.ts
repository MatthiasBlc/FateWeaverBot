import { PrismaClient, Character, User, Town, Guild } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateCharacterData {
  name: string;
  userId: string;
  townId: string;
}

export type CharacterWithDetails = Character & { user: User; town: Town & { guild: Guild } };

export class CharacterService {
  async getActiveCharacter(userId: string, townId: string): Promise<CharacterWithDetails | null> {
    return await prisma.character.findFirst({
      where: { userId, townId, isActive: true, isDead: false },
      include: { user: true, town: { include: { guild: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRerollableCharacters(userId: string, townId: string): Promise<Character[]> {
    return await prisma.character.findMany({
      where: { userId, townId, isDead: true, canReroll: true, isActive: true },
      include: { user: true, town: { include: { guild: true } } },
    });
  }

  async createCharacter(data: CreateCharacterData): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      // Désactiver tous les autres personnages de l'utilisateur dans cette ville
      await tx.character.updateMany({
        where: { userId: data.userId, townId: data.townId },
        data: { isActive: false },
      });

      // Créer le nouveau personnage actif
      return await tx.character.create({
        data: {
          name: data.name,
          user: { connect: { id: data.userId } },
          town: { connect: { id: data.townId } },
          isActive: true,
          isDead: false,
          canReroll: false,
          hungerLevel: 4,
          paTotal: 2,
        },
      });
    });
  }

  async createRerollCharacter(userId: string, townId: string, name: string): Promise<Character> {
    return await prisma.$transaction(async (prisma) => {
      // Chercher un personnage mort avec permission de reroll (peu importe isActive)
      const deadCharacter = await prisma.character.findFirst({
        where: { userId, townId, isDead: true, canReroll: true },
      });

      if (!deadCharacter) {
        throw new Error("No reroll permission");
      }

      // Désactiver TOUS les personnages de l'utilisateur dans cette ville
      await prisma.character.updateMany({
        where: { userId, townId },
        data: { isActive: false },
      });

      // Créer le nouveau personnage actif
      const newCharacter = await prisma.character.create({
        data: {
          name,
          user: { connect: { id: userId } },
          town: { connect: { id: townId } },
          isActive: true,
          isDead: false,
          canReroll: false,
          hungerLevel: 4,
          paTotal: 2,
        },
      });

      // Retirer la permission de reroll du personnage mort
      await prisma.character.update({
        where: { id: deadCharacter.id },
        data: { canReroll: false },
      });

      return newCharacter;
    });
  }

  async killCharacter(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: { isDead: true, hungerLevel: 0, paTotal: 0 },
    });
  }

  async grantRerollPermission(characterId: string): Promise<Character> {
    return await prisma.character.update({ where: { id: characterId }, data: { canReroll: true } });
  }

  async switchActiveCharacter(userId: string, townId: string, characterId: string): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      await tx.character.updateMany({ where: { userId, townId, isActive: true }, data: { isActive: false } });
      return await tx.character.update({
        where: { id: characterId, userId, townId, isDead: false },
        data: { isActive: true },
      });
    });
  }

  async getTownCharacters(townId: string): Promise<CharacterWithDetails[]> {
    return await prisma.character.findMany({
      where: { townId },
      include: { user: true, town: { include: { guild: true } } },
    });
  }

  async needsCharacterCreation(userId: string, townId: string): Promise<boolean> {
    const activeCharacter = await this.getActiveCharacter(userId, townId);
    return !activeCharacter;
  }
}
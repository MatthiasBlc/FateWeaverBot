import { PrismaClient, Character, User, Town, Guild } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateCharacterData {
  name: string;
  userId: string;
  townId: string;
}

export type CharacterWithDetails = Character & {
  user: User;
  town: Town & { guild: Guild };
};

export class CharacterService {
  async getActiveCharacter(
    userId: string,
    townId: string
  ): Promise<CharacterWithDetails | null> {
    return await prisma.character.findFirst({
      where: { userId, townId, isActive: true, isDead: false },
      include: { user: true, town: { include: { guild: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRerollableCharacters(
    userId: string,
    townId: string
  ): Promise<Character[]> {
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
          hp: 5, // Points de vie initiaux
        },
      });
    });
  }

  async createRerollCharacter(
    userId: string,
    townId: string,
    name: string
  ): Promise<Character> {
    return await prisma.$transaction(async (prisma) => {
      console.log(
        `[createRerollCharacter] Début - userId: ${userId}, townId: ${townId}, name: ${name}`
      );

      // LOGIQUE SIMPLE : Trouver le personnage ACTIF actuel (mort ou vivant)
      // Il y a TOUJOURS un personnage actif par utilisateur par ville
      const currentActiveCharacter = await prisma.character.findFirst({
        where: { userId, townId, isActive: true },
      });

      if (!currentActiveCharacter) {
        throw new Error("No active character found - this should never happen");
      }

      console.log(
        `[createRerollCharacter] Personnage actif actuel: ${currentActiveCharacter.id}, isDead: ${currentActiveCharacter.isDead}, canReroll: ${currentActiveCharacter.canReroll}`
      );

      // SOLUTION ULTRA-SIMPLE : Utiliser la fonction createCharacter existante
      // qui gère déjà correctement la logique de désactivation/création
      const newCharacterData: CreateCharacterData = {
        userId,
        townId,
        name,
      };

      // Créer le nouveau personnage (désactive automatiquement l'ancien)
      const newCharacter = await this.createCharacter(newCharacterData);

      console.log(`[createRerollCharacter] ✅ Nouveau personnage créé: ${newCharacter.id}`);

      // Nettoyer la permission de reroll si l'ancien personnage était mort
      if (currentActiveCharacter.isDead && currentActiveCharacter.canReroll) {
        await prisma.character.update({
          where: { id: currentActiveCharacter.id },
          data: { canReroll: false },
        });
        console.log(
          `[createRerollCharacter] Permission de reroll nettoyée: ${currentActiveCharacter.id}`
        );
      }

      return newCharacter;
    });
  }

  async killCharacter(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: { isDead: true, hungerLevel: 0, paTotal: 0, hp: 0 },
    });
  }

  async grantRerollPermission(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: { canReroll: true },
    });
  }

  async switchActiveCharacter(
    userId: string,
    townId: string,
    characterId: string
  ): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      await tx.character.updateMany({
        where: { userId, townId, isActive: true },
        data: { isActive: false },
      });
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

  async needsCharacterCreation(
    userId: string,
    townId: string
  ): Promise<boolean> {
    const activeCharacter = await this.getActiveCharacter(userId, townId);
    return !activeCharacter;
  }
}

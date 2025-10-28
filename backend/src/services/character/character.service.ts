import {
  Prisma,
  PrismaClient,
  Character,
  User,
  Town,
  Guild,
} from "@prisma/client";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";
import { CharacterRepository } from "../../domain/repositories/character.repository";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../../shared/errors';

const prisma = new PrismaClient();

/**
 * Interface pour les données de création d'un personnage
 */
export interface CreateCharacterData {
  name: string;
  userId: string;
  townId: string;
  jobId?: number;
}

/**
 * Type pour un personnage avec ses détails complets
 */
export type CharacterWithDetails = Character & {
  user: User;
  town: Town & { guild: Guild };
  characterRoles: Array<{
    id: string;
    characterId: string;
    roleId: string;
    assignedAt: Date;
    role: {
      id: string;
      discordId: string;
      name: string;
      color: string | null;
    };
  }>;
};

export class CharacterService {
  private characterRepo: CharacterRepository;

  constructor(characterRepo?: CharacterRepository) {
    // For backward compatibility, create a new repository if not provided
    this.characterRepo = characterRepo || new CharacterRepository(prisma);
  }

  async getActiveCharacter(
    userId: string,
    townId: string
  ): Promise<CharacterWithDetails | null> {
    return await this.characterRepo.findActiveCharacterAlive(userId, townId);
  }

  async getRerollableCharacters(
    userId: string,
    townId: string
  ): Promise<Character[]> {
    return await this.characterRepo.findRerollableCharacters(userId, townId);
  }

  async createCharacter(data: CreateCharacterData): Promise<Character> {
    return await this.characterRepo.createCharacterWithCapabilities(data);
  }

  async createRerollCharacter(
    userId: string,
    townId: string,
    name: string
  ): Promise<Character> {
    console.log(
      `[createRerollCharacter] Début - userId: ${userId}, townId: ${townId}, name: ${name}`
    );

    // Find current active character
    const currentActiveCharacter = await this.characterRepo.findActiveCharacter(userId, townId);

    if (!currentActiveCharacter) {
      throw new NotFoundError("Active character", userId);
    }

    console.log(
      `[createRerollCharacter] Personnage actif actuel: ${currentActiveCharacter.id}, isDead: ${currentActiveCharacter.isDead}, canReroll: ${currentActiveCharacter.canReroll}`
    );

    // Create new character (automatically deactivates old one)
    const newCharacterData: CreateCharacterData = {
      userId,
      townId,
      name,
    };

    const newCharacter = await this.createCharacter(newCharacterData);

    console.log(
      `[createRerollCharacter] ✅ Nouveau personnage créé: ${newCharacter.id}`
    );

    // Clean up reroll permission if old character was dead
    if (currentActiveCharacter.isDead && currentActiveCharacter.canReroll) {
      await this.characterRepo.update(currentActiveCharacter.id, { canReroll: false });
      console.log(
        `[createRerollCharacter] Permission de reroll nettoyée: ${currentActiveCharacter.id}`
      );
    }

    return newCharacter;
  }

  async killCharacter(characterId: string): Promise<Character> {
    return await this.characterRepo.killCharacter(characterId);
  }

  async grantRerollPermission(characterId: string): Promise<Character> {
    return await this.characterRepo.grantRerollPermission(characterId);
  }

  async switchActiveCharacter(
    userId: string,
    townId: string,
    characterId: string
  ): Promise<Character> {
    return await this.characterRepo.switchActiveCharacterTransaction(userId, townId, characterId);
  }

  async getTownCharacters(townId: string): Promise<CharacterWithDetails[]> {
    return await this.characterRepo.findAllByTownWithDetails(townId);
  }

  async needsCharacterCreation(
    userId: string,
    townId: string
  ): Promise<boolean> {
    const activeCharacter = await this.characterRepo.findActiveCharacter(userId, townId);
    return !activeCharacter;
  }

  async changeCharacterJob(
    characterId: string,
    newJobId: number
  ): Promise<Character> {
    return await this.characterRepo.changeJobWithCapabilities(characterId, newJobId);
  }
}

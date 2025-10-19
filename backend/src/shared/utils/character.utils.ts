import { prisma } from "../../util/db";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";
import { Character } from "@prisma/client";

export class CharacterUtils {
  static async getActiveCharacter(userId: string, townId: string) {
    return await prisma.character.findFirst({
      where: { userId, townId, isActive: true, isDead: false },
      ...CharacterQueries.fullInclude()
    });
  }

  static async getActiveCharacterOrThrow(userId: string, townId: string) {
    const character = await this.getActiveCharacter(userId, townId);

    if (!character) {
      throw new Error(
        `Aucun personnage actif trouvé pour userId=${userId}, townId=${townId}`
      );
    }

    return character;
  }

  static async getUserByDiscordId(discordId: string) {
    return await prisma.user.findUnique({
      where: { discordId }
    });
  }

  static async getUserByDiscordIdOrThrow(discordId: string) {
    const user = await this.getUserByDiscordId(discordId);

    if (!user) {
      throw new Error(`Utilisateur avec discordId=${discordId} introuvable`);
    }

    return user;
  }

  static async getCharacterById(id: string) {
    return await prisma.character.findUnique({
      where: { id },
      ...CharacterQueries.fullInclude()
    });
  }

  static async getCharacterByIdOrThrow(id: string) {
    const character = await this.getCharacterById(id);

    if (!character) {
      throw new Error(`Personnage avec id=${id} introuvable`);
    }

    return character;
  }

  static async validateCanUsePA(character: Character, paRequired: number): Promise<void> {
    if (character.hp <= 1) {
      throw new Error("Personnage en agonie : impossible d'utiliser des PA");
    }

    if (character.pm <= 1 && character.paUsedToday + paRequired > 1) {
      throw new Error("Déprime : vous ne pouvez utiliser qu'1 PA par jour");
    }

    if (character.paTotal < paRequired) {
      throw new Error(
        `Pas assez de points d'action (requis: ${paRequired}, disponible: ${character.paTotal})`
      );
    }
  }

  static async deductPA(characterId: string, paAmount: number) {
    return await prisma.character.update({
      where: { id: characterId },
      data: {
        paTotal: { decrement: paAmount },
        paUsedToday: { increment: paAmount }
      }
    });
  }

  static async hasCapability(characterId: string, capabilityId: string): Promise<boolean> {
    const capability = await prisma.characterCapability.findUnique({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId
        }
      }
    });

    return capability !== null;
  }

  static async getCapabilities(characterId: string) {
    return await prisma.characterCapability.findMany({
      where: { characterId },
      include: { capability: true },
      orderBy: { capability: { name: "asc" } }
    });
  }
}

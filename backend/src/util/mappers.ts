import { CharacterDto } from "../interfaces/character.dto";
import { Prisma } from "@prisma/client";

type CharacterWithRelations = Prisma.CharacterGetPayload<{
  include: {
    user: true;
    town: {
      include: {
        guild: true;
      };
    };
    characterRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

type TransactionCharacter = Prisma.CharacterGetPayload<{ include: { user: true, town: { include: { guild: true } }, characterRoles: { include: { role: true } } } }>;

export function toCharacterDto(
  character: CharacterWithRelations | TransactionCharacter
): CharacterDto | null {
  if (!character) return null;

  // Create a properly typed object that matches CharacterDto
  const result: CharacterDto = {
    id: character.id,
    name: character.name,
    userId: character.userId,
    guildId: character.town.guildId,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
    paTotal: character.paTotal || 2,
    lastPaUpdate: character.lastPaUpdate || character.createdAt,
    hungerLevel: character.hungerLevel || 0,
    user: {
      id: character.user.id,
      discordId: character.user.discordId,
      username: character.user.username,
      discriminator: character.user.discriminator,
      globalName: character.user.globalName,
      avatar: character.user.avatar,
    },
    guild: {
      id: character.town.guild.id,
      discordId: character.town.guild.discordGuildId,
      name: character.town.guild.name,
    },
  };

  // Add roles if they exist
  if (character.characterRoles && character.characterRoles.length > 0) {
    result.roles = character.characterRoles
      .filter((cr) => cr.role)
      .map((cr) => ({
        id: cr.role.id,
        discordId: cr.role.discordId,
        name: cr.role.name,
        color: cr.role.color,
      }));
  }

  return result;
}

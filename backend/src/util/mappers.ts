import { CharacterDto } from "../interfaces/character.dto";
import { Prisma } from "@prisma/client";

type CharacterWithRelations = Prisma.CharacterGetPayload<{
  include: {
    user: true;
    guild: true;
    characterRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

type TransactionCharacter = {
  id: string;
  name: string | null;
  userId: string;
  guildId: string;
  paTotal: number;
  lastPaUpdate: Date;
  hungerLevel: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    globalName: string | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  guild: {
    id: string;
    discordGuildId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  characterRoles: Array<{
    id: string;
    characterId: string;
    roleId: string;
    assignedAt: Date;
    username: string;
    roleName: string;
    createdAt: Date;
    updatedAt: Date;
    role: {
      id: string;
      discordId: string;
      name: string;
      color: string | null;
    };
  }>;
};

export function toCharacterDto(
  character: CharacterWithRelations | TransactionCharacter
): CharacterDto | null {
  if (!character) return null;

  // Create a properly typed object that matches CharacterDto
  const result: CharacterDto = {
    id: character.id,
    name: character.name,
    userId: character.userId,
    guildId: character.guildId,
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
      id: character.guild.id,
      discordId: character.guild.discordGuildId,
      name: character.guild.name,
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

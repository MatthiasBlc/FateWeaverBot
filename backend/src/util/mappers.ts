import { CharacterDto } from "../interfaces/character.dto";
import { Prisma } from "@prisma/client";

type CharacterWithRelations = Prisma.CharacterGetPayload<{
  include: {
    user: true;
    server: true;
    characterRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

export function toCharacterDto(
  character: CharacterWithRelations
): CharacterDto | null {
  if (!character) return null;

  return {
    id: character.id,
    name: character.name,
    userId: character.userId,
    serverId: character.serverId,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
    ...(character.user && {
      user: {
        id: character.user.id,
        discordId: character.user.discordId,
        username: character.user.username,
        discriminator: character.user.discriminator,
        globalName: character.user.globalName,
        avatar: character.user.avatar,
      },
    }),
    ...(character.server && {
      server: {
        id: character.server.id,
        discordId: character.server.discordGuildId,
        name: character.server.name,
      },
    }),
    ...(character.characterRoles &&
      character.characterRoles.length > 0 && {
        roles: character.characterRoles.map(
          (
            cr: Prisma.CharacterRoleGetPayload<{ include: { role: true } }>
          ) => ({
            id: cr.role.id,
            name: cr.role.name,
            color: cr.role.color,
          })
        ),
      }),
  };
}

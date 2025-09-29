import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";
import { toCharacterDto } from "../util/mappers";

// Interface pour les données de création/mise à jour d'un personnage
interface CharacterInput {
  userId: string;
  guildId: string;
  name?: string | null;
  roleIds?: string[];
}

// Crée ou met à jour un personnage
export const upsertCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, guildId, name, roleIds } = req.body as CharacterInput;

    if (!userId || !guildId) {
      throw createHttpError(400, "Les champs userId et guildId sont requis");
    }

    // Vérifier si l'utilisateur et la guilde existent
    const [user, guild] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.guild.findUnique({ where: { id: guildId } }),
    ]);

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    // Utiliser le nom fourni ou le nom d'utilisateur comme valeur par défaut
    const characterName = name || user.username;

    // Vérifier si un personnage existe déjà pour cet utilisateur et cette guilde
    const existingCharacter = await prisma.character.findFirst({
      where: {
        userId,
        guildId,
      },
      include: {
        user: true,
        guild: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Récupérer les rôles de la guilde qui correspondent aux rôles Discord fournis
    const guildRoles =
      roleIds && roleIds.length > 0
        ? await prisma.role.findMany({
            where: {
              guildId,
              discordId: {
                in: roleIds,
              },
            },
            select: {
              id: true,
            },
          })
        : [];

    // Mettre à jour ou créer le personnage avec les rôles
    const upsertedCharacter = await prisma.$transaction(async (prisma) => {
      // 1. Créer ou mettre à jour le personnage
      const character = await prisma.character.upsert({
        where: {
          id: existingCharacter?.id ?? "",
        },
        update: {
          name: characterName,
        },
        create: {
          name: characterName,
          userId,
          guildId,
        },
        include: {
          user: true,
          guild: true,
          characterRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // 2. Mettre à jour les associations de rôles
      // Supprimer d'abord toutes les associations existantes
      await prisma.characterRole.deleteMany({
        where: { characterId: character.id },
      });

      // Puis créer les nouvelles associations si des rôles sont fournis
      if (guildRoles.length > 0) {
        // Récupérer les noms des rôles
        const rolesWithNames = await prisma.role.findMany({
          where: {
            id: { in: guildRoles.map((r) => r.id) },
          },
          select: {
            id: true,
            name: true,
          },
        });

        const roleMap = new Map(rolesWithNames.map((r) => [r.id, r.name]));

        // Préparer les données des rôles avec tous les champs requis
        const characterRolesData = guildRoles.map((role) => ({
          characterId: character.id,
          roleId: role.id,
          assignedAt: new Date(),
          username: user?.username || "Inconnu",
          roleName: roleMap.get(role.id) || "Rôle inconnu",
        }));

        // Créer les associations de rôles
        await prisma.characterRole.createMany({
          data: characterRolesData,
          skipDuplicates: true,
        });
      }

      // Recharger le personnage avec les relations mises à jour
      const updatedCharacter = await prisma.character.findUniqueOrThrow({
        where: { id: character.id },
        include: {
          user: true,
          guild: true,
          characterRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  discordId: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      });
      return updatedCharacter;
    });

    // Utiliser le mapper pour transformer la réponse
    const characterDto = toCharacterDto(upsertedCharacter);
    return res.status(200).json(characterDto);
  } catch (error) {
    next(error);
  }
};

// Récupère un personnage par son ID
export const getCharacterById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        user: true,
        guild: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    // Utiliser le mapper pour transformer la réponse
    const characterDto = toCharacterDto(character);
    res.status(200).json(characterDto);
  } catch (error) {
    next(error);
  }
};

// Récupère un personnage par l'ID Discord de l'utilisateur et l'ID Discord du serveur
export const getCharacterByDiscordIds: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { userId, guildId } = req.params;

    const character = await prisma.character.findFirst({
      where: {
        user: {
          discordId: userId,
        },
        guild: {
          discordGuildId: guildId,
        },
      },
      include: {
        user: true,
        guild: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

// Récupère tous les personnages d'une guilde
export const getGuildCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { guildId } = req.params;

    const characters = await prisma.character.findMany({
      where: {
        guildId,
      },
      include: {
        user: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

// Supprime un personnage
export const deleteCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier d'abord si le personnage existe
    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    // Supprimer d'abord les références dans character_roles
    await prisma.characterRole.deleteMany({
      where: { characterId: id },
    });

    // Puis supprimer le personnage
    await prisma.character.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

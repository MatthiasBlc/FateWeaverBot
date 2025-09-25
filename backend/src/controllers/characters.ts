import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";
import { toCharacterDto } from "../util/mappers";

// Interface pour les données de création/mise à jour d'un personnage
interface CharacterInput {
  userId: string;
  serverId: string;
  name?: string | null;
  roleIds?: string[];
}

// Crée ou met à jour un personnage
export const upsertCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, serverId, name, roleIds } = req.body as CharacterInput;

    if (!userId || !serverId) {
      throw createHttpError(400, "Les champs userId et serverId sont requis");
    }

    // Vérifier si l'utilisateur et le serveur existent
    const [user, server] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.server.findUnique({ where: { id: serverId } }),
    ]);

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    if (!server) {
      throw createHttpError(404, "Serveur non trouvé");
    }

    // Utiliser le nom fourni ou le nom d'utilisateur comme valeur par défaut
    const characterName = name || user.username;

    // Vérifier si un personnage existe déjà pour cet utilisateur et ce serveur
    const existingCharacter = await prisma.character.findFirst({
      where: {
        userId,
        serverId,
      },
      include: {
        user: true,
        server: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Récupérer les rôles du serveur qui correspondent aux rôles Discord fournis
    const serverRoles =
      roleIds && roleIds.length > 0
        ? await prisma.role.findMany({
            where: {
              serverId,
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
          serverId,
        },
        include: {
          user: true,
          server: true,
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
      if (serverRoles.length > 0) {
        // Récupérer les noms des rôles
        const rolesWithNames = await prisma.role.findMany({
          where: {
            id: { in: serverRoles.map((r) => r.id) },
          },
          select: {
            id: true,
            name: true,
          },
        });

        const roleMap = new Map(rolesWithNames.map((r) => [r.id, r.name]));

        // Récupérer le nom d'utilisateur
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });

        // Préparer les données des rôles avec tous les champs requis
        const characterRolesData = serverRoles.map((role) => ({
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
          server: true,
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
        server: true,
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
    const { userId, serverId } = req.params;

    const character = await prisma.character.findFirst({
      where: {
        user: {
          discordId: userId,
        },
        server: {
          discordGuildId: serverId,
        },
      },
      include: {
        user: true,
        server: true,
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

// Récupère tous les personnages d'un serveur
export const getServerCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { serverId } = req.params;

    const characters = await prisma.character.findMany({
      where: {
        serverId,
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

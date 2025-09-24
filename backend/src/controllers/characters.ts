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

    // Définir les relations à inclure pour les requêtes
    const includeRelations = {
      user: true,
      server: true,
      characterRoles: {
        include: {
          role: true,
        },
      },
    };

    // Mettre à jour ou créer le personnage
    const upsertedCharacter = await prisma.character.upsert({
      where: {
        id: existingCharacter?.id ?? "",
      },
      update: {
        name: name ?? null,
      },
      create: {
        name: name ?? null,
        userId,
        serverId,
      },
      include: includeRelations,
    });

    // Vérifier que le personnage a bien été créé/mis à jour
    if (!upsertedCharacter) {
      throw createHttpError(
        500,
        "Le personnage n'a pas pu être créé ou mis à jour"
      );
    }

    // Si des rôles sont fournis, mettre à jour les associations
    if (roleIds && roleIds.length > 0) {
      // Supprimer les associations de rôles existantes
      await prisma.characterRole.deleteMany({
        where: { characterId: upsertedCharacter.id },
      });

      // Créer les nouvelles associations de rôles
      await prisma.characterRole.createMany({
        data: roleIds.map((roleId) => ({
          characterId: upsertedCharacter.id,
          roleId,
          assignedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      // Recharger le personnage avec les rôles mis à jour
      const updatedCharacter = await prisma.character.findUnique({
        where: { id: upsertedCharacter.id },
        include: includeRelations,
      });

      if (!updatedCharacter) {
        throw createHttpError(500, "Erreur lors du rechargement du personnage");
      }

      // Utiliser le mapper pour transformer la réponse
      const characterDto = toCharacterDto(updatedCharacter);
      return res.status(200).json(characterDto);
    }

    // Si pas de rôles à mettre à jour, retourner le personnage tel quel
    const characterDto = toCharacterDto(upsertedCharacter);
    res.status(200).json(characterDto);
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

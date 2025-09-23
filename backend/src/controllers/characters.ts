import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

// Interface pour la création/mise à jour d'un personnage
interface CharacterInput {
  userId: string;
  serverId: string;
  nickname?: string | null;
  roles: string[];
}

// Crée ou met à jour un personnage
export const upsertCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, serverId, nickname, roles } = req.body as CharacterInput;

    if (!userId || !serverId) {
      throw createHttpError(400, "Les champs userId et serverId sont requis");
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    // Vérifier si le serveur existe
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw createHttpError(404, "Serveur non trouvé");
    }

    // Vérifier si le personnage existe déjà
    const existingCharacter = await prisma.character.findFirst({
      where: {
        userId,
        serverId,
      },
    });

    let character;

    if (existingCharacter) {
      // Mettre à jour le personnage existant
      character = await prisma.character.update({
        where: { id: existingCharacter.id },
        data: {
          name: nickname,
          role: roles[0],
        },
        include: {
          user: true,
          server: true,
        },
      });
    } else {
      // Créer un nouveau personnage
      character = await prisma.character.create({
        data: {
          userId,
          serverId,
          name: nickname,
          role: roles[0],
        },
        include: {
          user: true,
          server: true,
        },
      });
    }

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

// Récupère un personnage par son ID
export const getCharacterById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID du personnage est requis");
    }

    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        user: true,
        server: true,
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

// Récupère un personnage par son ID utilisateur et ID serveur
export const getCharacterByUserAndServer: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { userId, serverId } = req.params;

    if (!userId || !serverId) {
      throw createHttpError(
        400,
        "Les paramètres userId et serverId sont requis"
      );
    }

    const character = await prisma.character.findFirst({
      where: {
        userId,
        serverId,
      },
      include: {
        user: true,
        server: true,
      },
    });

    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

// Récupère tous les personnages d'un utilisateur
export const getUserCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw createHttpError(400, "L'ID de l'utilisateur est requis");
    }

    const characters = await prisma.character.findMany({
      where: { userId },
      include: {
        server: true,
      },
    });

    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

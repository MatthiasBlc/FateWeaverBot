import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
// import bcrypt from "bcrypt";
// import crypto from "crypto";

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.session.userId,
      },
      select: {
        discordId: true,
        globalName: true,
        avatar: true,
      },
    });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

interface SignUpBody {
  username?: string;
  password?: string;
  discriminator?: string;
}

export const signUp: RequestHandler<
  unknown,
  unknown,
  SignUpBody,
  unknown
> = async (req, res, next) => {
  const { username, discriminator } = req.body as SignUpBody;
  const passwordRaw = req.body.password;

  try {
    if (!username || !passwordRaw) {
      throw createHttpError(400, "Username and password are required.");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [{ username: username }, { discriminator: discriminator }],
      },
      select: {
        username: true,
        discriminator: true,
      },
    });

    if (existingUser) {
      throw createHttpError(
        409,
        "Username already taken. Please choose a different one or log in instead."
      );
    }

    const newUser = await prisma.user.create({
      data: {
        discordId: "",
        username,
        discriminator: discriminator || "0000",
        // password: passwordHashed,
        globalName: null,
        avatar: null,
      },
      select: {
        id: true,
        discordId: true,
        username: true,
        discriminator: true,
        globalName: true,
        avatar: true,
        createdAt: true,
      },
    });

    req.session.userId = newUser.id;

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

interface LoginBody {
  username?: string;
  password?: string;
}

export const login: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    if (!username || !password) {
      throw createHttpError(400, "Parameters missing");
    }

    const user = await prisma.user.findUnique({
      where: {
        discordId: username,
      },
      select: {
        id: true,
        discordId: true,
        globalName: true,
        avatar: true,
      },
    });

    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }

    // const passwordMatch = await bcrypt.compare(password, user.password);

    // if (!passwordMatch) {
    //   throw createHttpError(401, "Invalid credentials");
    // }

    req.session.userId = user.id;
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(200);
    }
  });
};

// Interfaces pour les requêtes

/**
 * Récupère un utilisateur par son ID Discord
 */
export const getUserByDiscordId: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;

    if (!discordId) {
      throw createHttpError(400, "L'ID Discord est requis");
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { discordId },
    });

    // Si l'utilisateur n'existe pas, le créer avec des valeurs par défaut
    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId,
          username: `user-${discordId}`,
          discriminator: "0", // Discord a supprimé les discriminants
          globalName: null,
          avatar: null,
        },
      });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Crée ou met à jour un utilisateur
 */
export const upsertUser: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, username, discriminator, globalName, avatar } = req.body;

    if (!discordId) {
      throw createHttpError(400, "L'ID Discord est requis");
    }

    const user = await prisma.user.upsert({
      where: { discordId },
      update: {
        username: username || undefined,
        discriminator: discriminator || "0", // Discord a supprimé les discriminants
        globalName: globalName || null,
        avatar: avatar || null,
      },
      create: {
        discordId,
        username: username || `user-${discordId}`,
        discriminator: discriminator || "0",
        globalName: globalName || null,
        avatar: avatar || null,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère tous les utilisateurs
 */
export const getAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            characters: true,
          },
        },
      },
      orderBy: {
        username: "asc",
      },
    });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Supprime un utilisateur et toutes ses données associées
 */
export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID de l'utilisateur est requis");
    }

    // Vérifier d'abord si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        characters: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    // Récupérer les IDs des personnages
    const characterIds = user.characters.map((c) => c.id);

    // Supprimer d'abord les associations de rôles des personnages
    await prisma.characterRole.deleteMany({
      where: { characterId: { in: characterIds } },
    });

    // Supprimer les personnages de l'utilisateur
    await prisma.character.deleteMany({
      where: { id: { in: characterIds } },
    });

    // Enfin, supprimer l'utilisateur
    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Met à jour un utilisateur Discord existant
 */
export const updateDiscordUser: RequestHandler = async (req, res, next) => {
  try {
    const discordId = req.params.discordId;
    const { globalName, avatar } = req.body as {
      globalName?: string;
      avatar?: string;
    };

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { discordId },
    });

    if (!existingUser) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { discordId },
      data: {
        globalName,
        avatar,
      },
      select: {
        id: true,
        discordId: true,
        globalName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Met à jour un utilisateur par son ID Discord
 */
export const updateUserByDiscordId: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;
    const { username, discriminator, globalName, avatar } = req.body;

    if (!discordId) {
      throw createHttpError(400, "L'ID Discord est requis");
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { discordId },
    });

    if (!existingUser) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { discordId },
      data: {
        username: username || existingUser.username,
        discriminator: discriminator || existingUser.discriminator,
        globalName:
          globalName !== undefined ? globalName : existingUser.globalName,
        avatar: avatar !== undefined ? avatar : existingUser.avatar,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return next(createHttpError(404, "Utilisateur non trouvé"));
      }
    }
    next(error);
  }
};

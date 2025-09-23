import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";
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
        email: true,
      },
    });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

interface SignUpBody {
  username?: string;
  email?: string;
  password?: string;
}

export const signUp: RequestHandler<
  unknown,
  unknown,
  SignUpBody,
  unknown
> = async (req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;
  const passwordRaw = req.body.password;

  try {
    if (!username || !email || !passwordRaw) {
      throw createHttpError(400, "Parameters missing.");
    }

    const existingUsername = await prisma.user.findUnique({
      where: {
        discordId: username,
      },
      select: {
        discordId: true,
      },
    });

    if (existingUsername) {
      throw createHttpError(
        409,
        "Username already taken. Please choose a different one or log in instead."
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        email: true,
      },
    });

    if (existingEmail) {
      throw createHttpError(
        409,
        "A user with this email adress already exist. Please log in instead."
      );
    }

    // const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await prisma.user.create({
      data: {
        discordId: "",
        email,
        // password: passwordHashed,
        globalName: null,
        avatar: null,
      },
      select: {
        id: true,
        discordId: true,
        globalName: true,
        avatar: true,
        email: true,
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
        email: true,
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
export interface DiscordUserInput {
  discordId: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
}

/**
 * Crée ou met à jour un utilisateur Discord
 */
export const upsertDiscordUser: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, username, globalName, avatar }: DiscordUserInput =
      req.body;

    if (!discordId || !username) {
      throw createHttpError(
        400,
        "Les champs discordId et username sont obligatoires"
      );
    }

    const user = await prisma.user.upsert({
      where: { discordId },
      update: {
        discordId,
        globalName,
        avatar,
      },
      create: {
        discordId,
        globalName,
        avatar,
        email: `${discordId}@discord.app`, // Email temporaire unique
        // password: crypto.randomBytes(16).toString("hex"), // Mot de passe temporaire
      },
      select: {
        id: true,
        discordId: true,
        globalName: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère le profil d'un utilisateur par son ID Discord
 */
export const getDiscordUserProfile: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;

    if (!discordId) {
      throw createHttpError(400, "L'ID Discord est requis");
    }

    const user = await prisma.user.findUnique({
      where: { discordId },
      select: {
        id: true,
        discordId: true,
        globalName: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Met à jour un utilisateur Discord existant
export const updateDiscordUser: RequestHandler = async (req, res, next) => {
  try {
    const discordId = req.params.discordId;
    const { globalName, avatar, email } = req.body as {
      globalName?: string;
      avatar?: string;
      email?: string;
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
        email,
      },
      select: {
        id: true,
        discordId: true,
        globalName: true,
        avatar: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

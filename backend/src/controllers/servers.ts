import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

// Interface pour les données de création/serveur
interface ServerInput {
  discordId: string;
  name: string;
  memberCount?: number;
}

// Crée ou met à jour un serveur Discord
export const upsertServer: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, name, memberCount } = req.body as ServerInput;

    if (!discordId || !name) {
      throw createHttpError(400, "Les champs discordId et name sont requis");
    }

    // Vérifier si le serveur existe déjà
    const existingServer = await prisma.server.findUnique({
      where: { discordGuildId: discordId },
    });

    let server;

    if (existingServer) {
      // Mettre à jour le serveur existant
      server = await prisma.server.update({
        where: { discordGuildId: discordId },
        data: {
          name,
          memberCount:
            memberCount !== undefined
              ? memberCount
              : existingServer.memberCount,
        },
      });
    } else {
      // Créer un nouveau serveur
      server = await prisma.server.create({
        data: {
          discordGuildId: discordId,
          name,
          memberCount: memberCount || 0,
        },
      });
    }

    res.status(200).json(server);
  } catch (error) {
    next(error);
  }
};

// Récupère un serveur par son ID Discord
export const getServerByDiscordId: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;

    if (!discordId) {
      throw createHttpError(400, "L'ID Discord est requis");
    }

    const server = await prisma.server.findUnique({
      where: { discordGuildId: discordId },
    });

    if (!server) {
      throw createHttpError(404, "Serveur non trouvé");
    }

    res.status(200).json(server);
  } catch (error) {
    next(error);
  }
};

import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

// Interface pour les données de création/mise à jour d'un serveur
interface ServerInput {
  discordId: string;
  name: string;
  memberCount?: number;
}

// Crée ou met à jour un serveur
export const upsertServer: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, name, memberCount } = req.body as ServerInput;

    if (!discordId || !name) {
      throw createHttpError(400, "Les champs discordId et name sont requis");
    }

    // Vérifier si le serveur existe déjà
    const existingServer = await prisma.server.findUnique({
      where: { discordGuildId: discordId },
      include: {
        roles: true,
      },
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
        include: {
          roles: true,
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
        include: {
          roles: true,
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
      throw createHttpError(400, "Le paramètre discordId est requis");
    }

    const server = await prisma.server.findUnique({
      where: { discordGuildId: discordId },
      include: {
        roles: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!server) {
      throw createHttpError(404, "Serveur non trouvé");
    }

    res.status(200).json(server);
  } catch (error) {
    next(error);
  }
};

// Récupère tous les serveurs
export const getAllServers: RequestHandler = async (req, res, next) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        _count: {
          select: {
            characters: true,
            roles: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(servers);
  } catch (error) {
    next(error);
  }
};

// Supprime un serveur et toutes ses données associées
export const deleteServer: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID du serveur est requis");
    }

    // Vérifier d'abord si le serveur existe
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });

    if (!server) {
      throw createHttpError(404, "Serveur non trouvé");
    }

    // Supprimer d'abord les personnages et leurs rôles
    const characters = await prisma.character.findMany({
      where: { serverId: id },
      select: { id: true },
    });

    const characterIds = characters.map((c) => c.id);

    // Supprimer les associations de rôles des personnages
    await prisma.characterRole.deleteMany({
      where: { characterId: { in: characterIds } },
    });

    // Supprimer les personnages
    await prisma.character.deleteMany({
      where: { id: { in: characterIds } },
    });

    // Supprimer les rôles du serveur
    await prisma.role.deleteMany({
      where: { serverId: id },
    });

    // Enfin, supprimer le serveur
    await prisma.server.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

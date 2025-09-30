import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

// Interface pour les données de création/mise à jour d'une guilde
interface GuildInput {
  discordId: string;
  name: string;
  memberCount?: number;
}

// Crée ou met à jour un serveur
export const upsertGuild: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, name, memberCount } = req.body as GuildInput;

    if (!discordId || !name) {
      throw createHttpError(400, "Les champs discordId et name sont requis");
    }

    // Vérifier si la guilde existe déjà
    const existingGuild = await prisma.guild.findUnique({
      where: { discordGuildId: discordId },
      include: {
        roles: true,
      },
    });

    let guild;

    if (existingGuild) {
      // Mettre à jour la guilde existante
      guild = await prisma.guild.update({
        where: { discordGuildId: discordId },
        data: {
          name,
          memberCount:
            memberCount !== undefined
              ? memberCount
              : existingGuild.memberCount,
        },
        include: {
          roles: true,
          town: true,
        },
      });
    } else {
      // Créer une nouvelle guilde avec sa ville par défaut
      guild = await prisma.$transaction(async (prisma) => {
        // Créer d'abord la guilde
        const newGuild = await prisma.guild.create({
          data: {
            discordGuildId: discordId,
            name,
            memberCount: memberCount || 0,
          },
        });

        // Puis créer la ville avec la bonne guildId
        const town = await prisma.town.create({
          data: {
            name: `${name} City`, // Nom par défaut de la ville
            guildId: newGuild.id,
          },
        });

        // Mettre à jour la guilde pour inclure la ville
        const updatedGuild = await prisma.guild.update({
          where: { id: newGuild.id },
          data: {
            town: { connect: { id: town.id } },
          },
          include: {
            roles: true,
            town: true,
          },
        });

        return updatedGuild;
      });
    }

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

// Récupère une guilde par son ID Discord
export const getGuildByDiscordId: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;

    if (!discordId) {
      throw createHttpError(400, "Le paramètre discordId est requis");
    }

    const guild = await prisma.guild.findUnique({
      where: { discordGuildId: discordId },
      include: {
        roles: {
          orderBy: {
            name: "asc",
          },
        },
        town: true,
      },
    });

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

// Récupère une guilde par son ID interne
export const getGuildById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "Le paramètre id est requis");
    }

    const guild = await prisma.guild.findUnique({
      where: { id },
      include: {
        roles: {
          orderBy: {
            name: "asc",
          },
        },
        town: true,
      },
    });

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

// Récupère toutes les guildes
export const getAllGuilds: RequestHandler = async (req, res, next) => {
  try {
    const guilds = await prisma.guild.findMany({
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
        town: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(guilds);
  } catch (error) {
    next(error);
  }
};

// Met à jour le salon de logs d'une guilde
export const updateGuildLogChannel: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;
    const { logChannelId } = req.body as { logChannelId: string | null };

    if (!discordId) {
      throw createHttpError(400, "Le paramètre discordId est requis");
    }

    // Vérifier si la guilde existe
    const existingGuild = await prisma.guild.findUnique({
      where: { discordGuildId: discordId },
    });

    if (!existingGuild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    // Mettre à jour la guilde avec le nouveau logChannelId
    const guild = await prisma.guild.update({
      where: { discordGuildId: discordId },
      data: {
        logChannelId,
      },
      include: {
        roles: true,
      },
    });

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

// Supprime une guilde et toutes ses données associées
export const deleteGuild: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID de la guilde est requis");
    }

    // Vérifier d'abord si la guilde existe
    const guild = await prisma.guild.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    // Supprimer d'abord les personnages et leurs rôles
    const characters = await prisma.character.findMany({
      where: {
        town: {
          guildId: id,
        },
      },
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

    // Supprimer les rôles de la guilde
    await prisma.role.deleteMany({
      where: { guildId: id },
    });

    // Enfin, supprimer la guilde
    await prisma.guild.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

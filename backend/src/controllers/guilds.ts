import { RequestHandler } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { prisma } from "../util/db";

export const upsertGuild: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, name, memberCount } = req.body;

    if (!discordId || !name) {
      throw new BadRequestError("Les champs discordId et name sont requis");
    }

    const existingGuild = await prisma.guild.findUnique({
      where: { discordGuildId: discordId },
    });

    let guild;
    if (existingGuild) {
      guild = await prisma.guild.update({
        where: { discordGuildId: discordId },
        data: { name, memberCount: memberCount ?? existingGuild.memberCount },
        include: { roles: true, town: true },
      });
    } else {
      guild = await prisma.guild.create({
        data: {
          discordGuildId: discordId,
          name,
          memberCount: memberCount || 0,
          town: {
            create: {
              name: `${name} City`,
            },
          },
        },
        include: { roles: true, town: true },
      });
    }

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

export const getGuildByDiscordId: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;
    const guild = await prisma.guild.findUnique({
      where: { discordGuildId: discordId },
      include: { roles: { orderBy: { name: "asc" } }, town: true },
    });

    if (!guild) {
      throw new NotFoundError("Guilde non trouvée");
    }

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

export const getGuildById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const guild = await prisma.guild.findUnique({
      where: { id },
      include: { roles: { orderBy: { name: "asc" } }, town: true },
    });

    if (!guild) {
      throw new NotFoundError("Guilde non trouvée");
    }

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

export const getAllGuilds: RequestHandler = async (req, res, next) => {
  try {
    const guilds = await prisma.guild.findMany({
      include: { _count: { select: { roles: true } }, town: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json(guilds);
  } catch (error) {
    next(error);
  }
};

export const updateGuildLogChannel: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;
    const { logChannelId } = req.body;

    const guild = await prisma.guild.update({
      where: { discordGuildId: discordId },
      data: { logChannelId },
      include: { roles: true },
    });

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

export const updateGuildDailyMessageChannel: RequestHandler = async (req, res, next) => {
  try {
    const { discordId } = req.params;
    const { dailyMessageChannelId } = req.body;

    const guild = await prisma.guild.update({
      where: { discordGuildId: discordId },
      data: { dailyMessageChannelId },
      include: { roles: true },
    });

    res.status(200).json(guild);
  } catch (error) {
    next(error);
  }
};

export const deleteGuild: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.guild.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
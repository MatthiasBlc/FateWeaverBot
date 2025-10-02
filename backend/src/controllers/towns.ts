import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

export const upsertTown: RequestHandler = async (req, res, next) => {
  try {
    const { name, foodStock, guildId } = req.body;

    if (!name || !guildId) {
      throw createHttpError(400, "Les champs name et guildId sont requis");
    }

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    const existingTown = await prisma.town.findUnique({ where: { guildId } });

    const town = existingTown
      ? await prisma.town.update({
          where: { guildId },
          data: { name, foodStock: foodStock ?? existingTown.foodStock },
        })
      : await prisma.town.create({
          data: { name, foodStock, guild: { connect: { id: guildId } } },
        });

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};

export const getTownByGuildId: RequestHandler = async (req, res, next) => {
  try {
    const { guildId } = req.params;
    const guild = await prisma.guild.findUnique({ where: { discordGuildId: guildId } });

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    const town = await prisma.town.findUnique({
      where: { guildId: guild.id },
      include: { guild: true, chantiers: { orderBy: { updatedAt: "desc" } } },
    });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};

export const getTownById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({
      where: { id },
      include: { guild: true, chantiers: { orderBy: { updatedAt: "desc" } } },
    });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};

export const getAllTowns: RequestHandler = async (req, res, next) => {
  try {
    const towns = await prisma.town.findMany({
      include: {
        guild: { select: { id: true, name: true, discordGuildId: true } },
        _count: { select: { chantiers: true } },
      },
      orderBy: { name: "asc" },
    });
    res.status(200).json(towns);
  } catch (error) {
    next(error);
  }
};

export const updateTownFoodStock: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { foodStock } = req.body;

    if (foodStock === undefined || foodStock < 0) {
      throw createHttpError(400, "Le stock de vivres doit être un nombre positif");
    }

    const town = await prisma.town.update({ where: { id }, data: { foodStock } });

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};


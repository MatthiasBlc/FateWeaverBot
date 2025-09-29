import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

// Interface pour les données de création/mise à jour d'une ville
interface TownInput {
  name: string;
  foodStock?: number;
  guildId: string;
}

// Crée ou met à jour une ville
export const upsertCity: RequestHandler = async (req, res, next) => {
  try {
    const { name, foodStock, guildId } = req.body as TownInput;

    if (!name || !guildId) {
      throw createHttpError(400, "Les champs name et guildId sont requis");
    }

    // Vérifier si la guilde existe
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
    });

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    // Vérifier si une ville existe déjà pour cette guilde
    const existingTown = await prisma.town.findUnique({
      where: { guildId },
    });

    let town;

    if (existingTown) {
      // Mettre à jour la ville existante
      town = await prisma.town.update({
        where: { guildId },
        data: {
          name,
          foodStock:
            foodStock !== undefined ? foodStock : existingTown.foodStock,
        },
      });
    } else {
      throw createHttpError(
        400,
        "Une ville devrait déjà exister pour cette guilde. Utilisez la création automatique via upsertGuild."
      );
    }

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};

// Récupère une ville par l'ID Discord de sa guilde
export const getTownByGuildId: RequestHandler = async (req, res, next) => {
  try {
    const { guildId } = req.params;

    if (!guildId) {
      throw createHttpError(400, "Le paramètre guildId est requis");
    }

    // D'abord, trouver la guilde par son ID Discord
    const guild = await prisma.guild.findUnique({
      where: { discordGuildId: guildId },
    });

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    const town = await prisma.town.findUnique({
      where: { guildId: guild.id },
      include: {
        guild: true,
        chantiers: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};

// Récupère une ville par son ID
export const getTownById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "Le paramètre id est requis");
    }

    const town = await prisma.town.findUnique({
      where: { id },
      include: {
        guild: true,
        chantiers: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};

// Récupère toutes les villes
export const getAllTowns: RequestHandler = async (req, res, next) => {
  try {
    const towns = await prisma.town.findMany({
      include: {
        guild: {
          select: {
            id: true,
            name: true,
            discordGuildId: true,
          },
        },
        _count: {
          select: {
            chantiers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(towns);
  } catch (error) {
    next(error);
  }
};

// Met à jour le stock de foodstock d'une ville
export const updateTownFoodStock: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { foodStock } = req.body as { foodStock: number };

    if (!id) {
      throw createHttpError(400, "Le paramètre id est requis");
    }

    if (foodStock === undefined || foodStock < 0) {
      throw createHttpError(
        400,
        "Le stock de vivres doit être un nombre positif"
      );
    }

    // Vérifier si la ville existe
    const existingTown = await prisma.town.findUnique({
      where: { id },
    });

    if (!existingTown) {
      throw createHttpError(404, "Ville non trouvée");
    }

    // Mettre à jour la ville avec le nouveau stock de foodstock
    const town = await prisma.town.update({
      where: { id },
      data: {
        foodStock,
      },
    });

    res.status(200).json(town);
  } catch (error) {
    next(error);
  }
};

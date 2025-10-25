import { RequestHandler } from "express";
import { NotFoundError, BadRequestError } from '../shared/errors';
import { prisma } from "../util/db";
import { HUNGER } from "@shared/constants/emojis";
import { ResourceUtils } from "../shared/utils";
import { ResourceQueries } from "../infrastructure/database/query-builders";
import { dailyMessageService } from "../services/daily-message.service";

export const upsertTown: RequestHandler = async (req, res, next) => {
  try {
    const { name, foodStock, guildId } = req.body;

    if (!name || !guildId) {
      throw new BadRequestError("Les champs name et guildId sont requis");
    }

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) {
      throw new NotFoundError("Guilde non trouvée");
    }

    // Chercher la ville par l'ID de guilde Discord
    const existingTown = await prisma.town.findFirst({
      where: { guild: { discordGuildId: guildId } },
      include: {
        guild: true,
        chantiers: { orderBy: { updatedAt: "desc" } },
      },
    });

    let town;
    if (existingTown) {
      // Mettre à jour la ville existante
      town = await prisma.town.update({
        where: { id: existingTown.id },
        data: { name },
        include: {
          guild: true,
          chantiers: { orderBy: { updatedAt: "desc" } },
        },
      });

      // Mettre à jour le stock de vivres si spécifié
      if (foodStock !== undefined && foodStock >= 0) {
        const vivresType = await ResourceUtils.getResourceTypeByNameOrNull(
          "Vivres"
        );
        if (vivresType) {
          await prisma.resourceStock.upsert({
            where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
            update: { quantity: foodStock },
            create: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: vivresType.id,
              quantity: foodStock,
            },
          });
        }
      }
    } else {
      // Créer une nouvelle ville
      town = await prisma.town.create({
        data: {
          name,
          guild: { connect: { id: guild.id } },
        },
        include: {
          guild: true,
          chantiers: { orderBy: { updatedAt: "desc" } },
        },
      });

      // Créer le stock de vivres par défaut ou avec la valeur spécifiée
      const initialFoodStock = foodStock !== undefined ? foodStock : 50;
      if (initialFoodStock >= 0) {
        const vivresType = await ResourceUtils.getResourceTypeByNameOrNull(
          "Vivres"
        );

        if (vivresType) {
          await prisma.resourceStock.upsert({
            where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
            update: { quantity: initialFoodStock },
            create: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: vivresType.id,
              quantity: initialFoodStock,
            },
          });
        } else {
          // Créer le type Vivres s'il n'existe pas
          const newVivresType = await prisma.resourceType.create({
            data: {
              name: "Vivres",
              description: "Ressource alimentaire de base",
              emoji: HUNGER.ICON,
              category: "BASE",
            },
          });

          await prisma.resourceStock.create({
            data: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: newVivresType.id,
              quantity: initialFoodStock,
            },
          });
        }
      }
    }

    // Récupérer le stock de vivres pour compatibilité avec l'interface existante
    const vivresType = await ResourceUtils.getResourceTypeByNameOrNull(
      "Vivres"
    );
    let foodStockValue = 0;
    if (vivresType) {
      const vivresStock = await prisma.resourceStock.findUnique({
        where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
      });
      foodStockValue = vivresStock?.quantity || 0;
    }

    const townWithVivres = {
      ...town,
      foodStock: foodStockValue,
    };

    res.status(200).json(townWithVivres);
  } catch (error) {
    next(error);
  }
};

export const getTownByGuildId: RequestHandler = async (req, res, next) => {
  try {
    const { guildId } = req.params;
    const guild = await prisma.guild.findUnique({
      where: { discordGuildId: guildId },
    });

    if (!guild) {
      throw new NotFoundError("Guilde non trouvée");
    }

    const town = await prisma.town.findUnique({
      where: { guildId: guild.id },
      include: {
        guild: true,
        chantiers: { orderBy: { updatedAt: "desc" } },
      },
    });

    if (!town) {
      throw new NotFoundError("Ville non trouvée");
    }

    // Vérifier et créer automatiquement le stock de vivres si nécessaire
    const vivresType = await ResourceUtils.getResourceTypeByNameOrNull(
      "Vivres"
    );
    let vivresStock = null;
    if (vivresType) {
      vivresStock = await prisma.resourceStock.findUnique({
        where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
      });
    }

    if (!vivresStock) {
      console.log(
        `Création automatique du stock de vivres pour la ville ${town.id}`
      );

      try {
        if (vivresType) {
          await prisma.resourceStock.upsert({
            where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
            update: { quantity: 50 },
            create: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: vivresType.id,
              quantity: 50,
            },
          });
        } else {
          // Créer le type Vivres s'il n'existe pas
          const newVivresType = await prisma.resourceType.create({
            data: {
              name: "Vivres",
              description: "Ressource alimentaire de base",
              emoji: HUNGER.ICON,
              category: "BASE",
            },
          });

          await prisma.resourceStock.create({
            data: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: newVivresType.id,
              quantity: 50,
            },
          });
        }
      } catch (error) {
        console.error("Erreur lors de la création du ResourceStock:", error);
      }
    }

    // Récupérer le stock de vivres final pour l'interface
    if (vivresType && !vivresStock) {
      vivresStock = await prisma.resourceStock.findUnique({
        where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
      });
    }

    const townWithVivres = {
      ...town,
      foodStock: vivresStock?.quantity || 0,
    };

    res.status(200).json(townWithVivres);
  } catch (error) {
    next(error);
  }
};

export const getTownById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({
      where: { id },
      include: {
        guild: true,
        chantiers: { orderBy: { updatedAt: "desc" } },
      },
    });

    if (!town) {
      throw new NotFoundError("Ville non trouvée");
    }

    // Récupérer le stock de vivres pour compatibilité avec l'interface existante
    const vivresType = await ResourceUtils.getResourceTypeByNameOrNull(
      "Vivres"
    );
    let foodStockValue = 0;
    if (vivresType) {
      const vivresStock = await prisma.resourceStock.findUnique({
        where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
      });
      foodStockValue = vivresStock?.quantity || 0;
    }

    const townWithVivres = {
      ...town,
      foodStock: foodStockValue,
    };

    res.status(200).json(townWithVivres);
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

    // Get Vivres type
    const vivresType = await ResourceUtils.getResourceTypeByNameOrNull(
      "Vivres"
    );

    // For each town, fetch vivres stock
    const townsWithVivres = await Promise.all(
      towns.map(async (town) => {
        let foodStock = 0;
        if (vivresType) {
          const vivresStock = await prisma.resourceStock.findUnique({
            where: ResourceQueries.stockWhere("CITY", town.id, vivresType.id),
          });
          foodStock = vivresStock?.quantity || 0;
        }
        return {
          ...town,
          foodStock,
        };
      })
    );

    res.status(200).json(townsWithVivres);
  } catch (error) {
    next(error);
  }
};

export const updateTownFoodStock: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { foodStock } = req.body;

    if (foodStock === undefined || foodStock < 0) {
      throw new BadRequestError(
        "Le stock de vivres doit être un nombre positif"
      );
    }

    // Récupérer le type de ressource "Vivres"
    const vivresType = await ResourceUtils.getResourceTypeByName("Vivres");

    const resourceStock = await prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere("CITY", id, vivresType.id),
      update: { quantity: foodStock },
      create: {
        locationType: "CITY",
        locationId: id,
        resourceTypeId: vivresType.id,
        quantity: foodStock,
      },
    });

    res.status(200).json(resourceStock);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère la météo du jour pour une ville
 * TODO: Pour l'instant, retourne un message basique basé sur la saison
 */
export const getTownWeather: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({ where: { id } });

    if (!town) {
      throw new NotFoundError("Ville non trouvée");
    }

    // TODO: Implémenter un système de météo dynamique basé sur la saison actuelle
    const weather = "Temps clair et ensoleillé ☀️";

    res.status(200).json({ weather });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère le récapitulatif des activités de la veille pour une ville
 */
export const getTownActionsRecap: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({ where: { id } });

    if (!town) {
      throw new NotFoundError("Ville non trouvée");
    }

    const recap = await dailyMessageService.getActionRecap(id);

    res.status(200).json({ recap });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère un résumé des stocks de la ville
 */
export const getTownStocksSummary: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({
      where: { id },
    });

    if (!town) {
      throw new NotFoundError("Ville non trouvée");
    }

    // Fetch resourceStocks separately
    const resourceStocks = await prisma.resourceStock.findMany({
      where: {
        locationType: "CITY",
        locationId: id,
      },
      include: { resourceType: true },
      orderBy: { resourceType: { name: "asc" } },
    });

    if (resourceStocks.length === 0) {
      res.status(200).json({ summary: "Aucune ressource en stock." });
      return;
    }

    // Créer un résumé lisible des stocks
    const summary = resourceStocks
      .map(
        (stock) =>
          `${stock.resourceType.emoji || "📦"} **${
            stock.resourceType.name
          }**: ${stock.quantity}`
      )
      .join("\n");

    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère un résumé des expéditions (mouvements d'hier: départs, retours, retraits catastrophiques)
 */
export const getTownExpeditionsSummary: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({ where: { id } });

    if (!town) {
      throw new NotFoundError("Ville non trouvée");
    }

    const summary = await dailyMessageService.getExpeditionSummary(id);

    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};

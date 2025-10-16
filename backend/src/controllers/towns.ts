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

    // Chercher la ville par l'ID de guilde Discord
    const existingTown = await prisma.town.findFirst({
      where: { guild: { discordGuildId: guildId } },
      include: {
        guild: true,
        chantiers: { orderBy: { updatedAt: "desc" } },
        resourceStocks: {
          include: { resourceType: true }
        }
      }
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
          resourceStocks: {
            include: { resourceType: true }
          }
        }
      });

      // Mettre à jour le stock de vivres si spécifié
      if (foodStock !== undefined && foodStock >= 0) {
        const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });
        if (vivresType) {
          await prisma.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: town.id,
                resourceTypeId: vivresType.id
              }
            },
            update: { quantity: foodStock },
            create: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: vivresType.id,
              quantity: foodStock,
              townId: town.id
            }
          });
        }
      }
    } else {
      // Créer une nouvelle ville
      town = await prisma.town.create({
        data: {
          name,
          guild: { connect: { id: guild.id } }
        },
        include: {
          guild: true,
          chantiers: { orderBy: { updatedAt: "desc" } },
          resourceStocks: {
            include: { resourceType: true }
          }
        }
      });

      // Créer le stock de vivres par défaut ou avec la valeur spécifiée
      const initialFoodStock = foodStock !== undefined ? foodStock : 50;
      if (initialFoodStock >= 0) {
        const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });

        if (vivresType) {
          await prisma.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: town.id,
                resourceTypeId: vivresType.id
              }
            },
            update: { quantity: initialFoodStock },
            create: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: vivresType.id,
              quantity: initialFoodStock,
              townId: town.id
            }
          });
        } else {
          // Créer le type Vivres s'il n'existe pas
          const newVivresType = await prisma.resourceType.create({
            data: {
              name: "Vivres",
              description: "Ressource alimentaire de base",
              emoji: "🍞",
              category: "BASE"
            }
          });

          await prisma.resourceStock.create({
            data: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: newVivresType.id,
              quantity: initialFoodStock,
              townId: town.id
            }
          });
        }
      }
    }

    // Ajouter le stock de vivres pour compatibilité avec l'interface existante
    const vivresStock = town.resourceStocks.find(stock => stock.resourceType.name === "Vivres");
    const townWithVivres = {
      ...town,
      foodStock: vivresStock?.quantity || 0
    };

    res.status(200).json(townWithVivres);
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
      include: {
        guild: true,
        chantiers: { orderBy: { updatedAt: "desc" } },
        resourceStocks: {
          include: { resourceType: true }
        }
      },
    });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    // Vérifier et créer automatiquement le stock de vivres si nécessaire
    const vivresStock = town.resourceStocks.find(stock => stock.resourceType.name === "Vivres");
    if (!vivresStock) {
      console.log(`Création automatique du stock de vivres pour la ville ${town.id}`);

      try {
        const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });

        if (vivresType) {
          await prisma.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: town.id,
                resourceTypeId: vivresType.id
              }
            },
            update: { quantity: 50 },
            create: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: vivresType.id,
              quantity: 50,
              townId: town.id
            }
          });
        } else {
          // Créer le type Vivres s'il n'existe pas
          const newVivresType = await prisma.resourceType.create({
            data: {
              name: "Vivres",
              description: "Ressource alimentaire de base",
              emoji: "🍞",
              category: "BASE"
            }
          });

          await prisma.resourceStock.create({
            data: {
              locationType: "CITY",
              locationId: town.id,
              resourceTypeId: newVivresType.id,
              quantity: 50,
              townId: town.id
            }
          });
        }
      } catch (error) {
        console.error("Erreur lors de la création du ResourceStock:", error);
      }
    }

    // Ajouter le stock de vivres pour compatibilité avec l'interface existante
    const vivresStockFinal = town.resourceStocks.find(stock => stock.resourceType.name === "Vivres");
    const townWithVivres = {
      ...town,
      foodStock: vivresStockFinal?.quantity || 0
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
        resourceStocks: {
          include: { resourceType: true }
        }
      },
    });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    // Ajouter le stock de vivres pour compatibilité avec l'interface existante
    const vivresStock = town.resourceStocks.find(stock => stock.resourceType.name === "Vivres");
    const townWithVivres = {
      ...town,
      foodStock: vivresStock?.quantity || 0
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
        resourceStocks: {
          where: {
            resourceType: { name: "Vivres" }
          },
          select: { quantity: true }
        }
      },
      orderBy: { name: "asc" },
    });

    // Ajouter le stock de vivres pour compatibilité avec l'interface existante
    const townsWithVivres = towns.map(town => ({
      ...town,
      foodStock: town.resourceStocks[0]?.quantity || 0
    }));

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
      throw createHttpError(400, "Le stock de vivres doit être un nombre positif");
    }

    // Récupérer le type de ressource "Vivres"
    const vivresType = await prisma.resourceType.findFirst({ where: { name: "Vivres" } });
    if (!vivresType) {
      throw createHttpError(404, "Type de ressource 'Vivres' non trouvé");
    }

    const resourceStock = await prisma.resourceStock.upsert({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: "CITY",
          locationId: id,
          resourceTypeId: vivresType.id
        }
      },
      update: { quantity: foodStock },
      create: {
        locationType: "CITY",
        locationId: id,
        resourceTypeId: vivresType.id,
        quantity: foodStock,
        townId: id
      }
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
      throw createHttpError(404, "Ville non trouvée");
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
 * TODO: Implémenter un système de logs d'activités
 */
export const getTownActionsRecap: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({ where: { id } });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    // TODO: Récupérer les actions des dernières 24h depuis une table de logs
    const recap = "Aucune activité notable pour le moment.";

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
      include: {
        resourceStocks: {
          include: { resourceType: true },
          orderBy: { resourceType: { name: "asc" } }
        }
      }
    });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    if (town.resourceStocks.length === 0) {
      res.status(200).json({ summary: "Aucune ressource en stock." });
      return;
    }

    // Créer un résumé lisible des stocks
    const summary = town.resourceStocks
      .map(stock => `${stock.resourceType.emoji || "📦"} **${stock.resourceType.name}**: ${stock.quantity}`)
      .join("\n");

    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère un résumé des expéditions en cours pour une ville
 */
export const getTownExpeditionsSummary: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const town = await prisma.town.findUnique({ where: { id } });

    if (!town) {
      throw createHttpError(404, "Ville non trouvée");
    }

    // Récupérer les expéditions en cours (non retournées)
    const activeExpeditions = await prisma.expedition.findMany({
      where: {
        townId: id,
        status: "DEPARTED" // Changed from "EN_COURS" to "DEPARTED" to match the enum
      },
      include: {
        members: true,
        _count: {
          select: { members: true }
        }
      }
    });

    if (activeExpeditions.length === 0) {
      res.status(200).json({ summary: "Aucune expédition en cours." });
      return;
    }

    // Créer un résumé lisible des expéditions
    const summary = activeExpeditions
      .map(exp => {
        if (!exp.returnAt) {
          return `🏕️ **${exp.name}** - ${exp._count?.members || 0} membre(s) - Date de retour inconnue`;
        }
        const daysRemaining = Math.ceil((exp.returnAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `🏕️ **${exp.name}** - ${exp._count?.members || 0} membre(s) - Retour dans ${daysRemaining} jour(s)`;
      })
      .join("\n");

    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};


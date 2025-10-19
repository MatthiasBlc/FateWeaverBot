import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { Prisma } from "@prisma/client";
import { prisma } from "../util/db";
import { toCharacterDto } from "../util/mappers";
import { CharacterService } from "../services/character.service";
import { CapabilityService } from "../services/capability.service";
import { logger } from "../services/logger";
import { CharacterQueries } from "../infrastructure/database/query-builders/character.queries";
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ResourceUtils, CharacterUtils } from "../shared/utils";

// Initialiser les services
const capabilityService = new CapabilityService(prisma);
const characterService = new CharacterService(capabilityService);

export const getActiveCharacterByDiscordId: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { discordId, townId } = req.params;

    if (!discordId || !townId) {
      throw createHttpError(
        400,
        "Les paramètres discordId et townId sont requis"
      );
    }

    // Trouver l'utilisateur par son ID Discord
    const user = await CharacterUtils.getUserByDiscordId(discordId);

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    // Récupérer le personnage actif
    const character = await characterService.getActiveCharacter(
      user.id,
      townId
    );

    if (!character) {
      throw createHttpError(
        404,
        "Aucun personnage actif trouvé pour cet utilisateur dans cette ville"
      );
    }

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

export const upsertCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId, name, roleIds, jobId } = req.body;

    if (!userId || !townId) {
      throw createHttpError(400, "Les champs userId et townId sont requis");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const town = await prisma.town.findUnique({
      where: { id: townId },
      include: { guild: true },
    });

    if (!user) throw createHttpError(404, "Utilisateur non trouvé");
    if (!town) throw createHttpError(404, "Ville non trouvée");

    const characterName = name || user.username;

    const existingCharacter = await prisma.character.findFirst({
      where: { userId, townId },
    });

    const guildRoles =
      roleIds && roleIds.length > 0
        ? await prisma.role.findMany({
          where: {
            guildId: town.guild.id,
            discordId: { in: roleIds },
          },
          select: { id: true },
        })
        : [];

    const upsertedCharacter = await prisma.$transaction(async (tx) => {
      // RÈGLE MÉTIER CRITIQUE : Un utilisateur ne peut avoir qu'UN SEUL personnage actif par ville
      // Désactiver TOUS les personnages actifs (morts ou vivants) sauf celui qu'on met à jour
      if (existingCharacter) {
        await tx.character.updateMany({
          where: {
            userId,
            townId,
            id: { not: existingCharacter.id },
            isActive: true,
            // Pas de filtre isDead : on désactive TOUS les personnages actifs
          },
          data: { isActive: false },
        });
      } else {
        await tx.character.updateMany({
          where: { userId, townId, isActive: true },
          data: { isActive: false },
        });
      }

      const character = await tx.character.upsert({
        where: { id: existingCharacter?.id ?? "" },
        update: { name: characterName },
        create: {
          name: characterName,
          user: { connect: { id: userId } },
          town: { connect: { id: townId } },
          ...(jobId && { job: { connect: { id: jobId } } }),
        },
        ...CharacterQueries.fullInclude(),
      });

      // Si c'est une nouvelle création (et non une mise à jour), on ajoute les compétences
      if (!existingCharacter) {
        // 1. Ajouter la capacité de base "Couper du bois"
        const couperDuBoisCapability = await tx.capability.findFirst({
          where: { name: "Couper du bois" },
        });

        if (couperDuBoisCapability) {
          await tx.characterCapability.create({
            data: {
              characterId: character.id,
              capabilityId: couperDuBoisCapability.id,
            },
          });
          console.log(
            `Capacité "Couper du bois" attribuée au personnage ${character.id}`
          );
        } else {
          console.error(
            'La capacité "Couper du bois" n\'a pas été trouvée dans la base de données'
          );
        }

        // 2. Si un métier est fourni, attribuer sa capacité de départ
        if (jobId && character.job?.startingAbility) {
          const startingAbilityId = character.job.startingAbility.id;

          // Vérifier si le personnage a déjà cette capacité
          const hasCapability = await tx.characterCapability.findUnique({
            where: {
              characterId_capabilityId: {
                characterId: character.id,
                capabilityId: startingAbilityId,
              },
            },
          });

          // Ajouter la capacité si elle n'existe pas déjà
          if (!hasCapability) {
            await tx.characterCapability.create({
              data: {
                characterId: character.id,
                capabilityId: startingAbilityId,
              },
            });
            console.log(
              `Capacité "${character.job.startingAbility.name}" attribuée au personnage ${character.id}`
            );
          }
        }
      }

      await tx.characterRole.deleteMany({
        where: { characterId: character.id },
      });

      if (guildRoles.length > 0) {
        await tx.characterRole.createMany({
          data: guildRoles.map((role) => ({
            characterId: character.id,
            roleId: role.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.character.findUniqueOrThrow({
        where: { id: character.id },
        ...CharacterQueries.fullInclude(),
      });
    });

    res.status(200).json(toCharacterDto(upsertedCharacter));
  } catch (error) {
    next(error);
  }
};

export const getCharacterById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await prisma.character.findUnique({
      where: { id },
      ...CharacterQueries.fullInclude(),
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    res.status(200).json(toCharacterDto(character));
  } catch (error) {
    next(error);
  }
};

export const getCharacterByDiscordIds: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { userId, guildId } = req.params;
    const character = await prisma.character.findFirst({
      where: {
        user: { discordId: userId },
        town: { guild: { discordGuildId: guildId } },
      },
      ...CharacterQueries.withCapabilities(),
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

export const getGuildCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { guildId } = req.params;
    const characters = await prisma.character.findMany({
      where: { town: { guild: { discordGuildId: guildId } } },
      ...CharacterQueries.withCapabilities(),
      orderBy: { name: "asc" },
    });
    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

export const deleteCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.characterRole.deleteMany({ where: { characterId: id } });
    await prisma.character.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const eatFood: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer le personnage avec ses informations d'expédition
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        town: true,
        expeditionMembers: {
          include: {
            expedition: true,
          },
        },
      },
    });

    if (!character) throw createHttpError(404, "Personnage non trouvé");
    if (character.isDead) throw createHttpError(400, "Ce personnage est mort");
    if (character.hungerLevel >= 4)
      throw createHttpError(400, "Tu n'as pas faim");

    const foodToConsume = character.hungerLevel === 1 ? 2 : 1;

    // Récupérer le type de ressource "Vivres"
    const vivresType = await ResourceUtils.getResourceTypeByName("Vivres");

    // Déterminer la source des vivres selon la logique demandée
    let locationType: "CITY" | "EXPEDITION";
    let locationId: string;
    let stockName: string;

    // Vérifier si le personnage est en expédition
    const activeExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    if (activeExpedition) {
      // Personnage en expédition DEPARTED → consommer de l'expédition
      locationType = "EXPEDITION";
      locationId = activeExpedition.expeditionId;
      stockName = `expédition "${activeExpedition.expedition.name}"`;
    } else {
      // Personnage en ville ou expédition LOCKED → consommer de la ville
      locationType = "CITY";
      locationId = character.townId;
      stockName = `ville "${character.town.name}"`;
    }

    // Récupérer le stock approprié
    const foodStock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType, locationId, vivresType.id),
    });

    if (!foodStock || foodStock.quantity < foodToConsume) {
      throw createHttpError(
        400,
        `${stockName} n'a que ${foodStock?.quantity || 0} vivres`
      );
    }

    const newHungerLevel = Math.min(4, character.hungerLevel + 1);

    const result = await prisma.$transaction(async (tx) => {
      const updatedCharacter = await tx.character.update({
        where: { id },
        data: { hungerLevel: newHungerLevel },
        include: { user: true },
      });

      // Retirer les vivres du stock approprié (ville ou expédition)
      await tx.resourceStock.update({
        where: ResourceQueries.stockWhere(locationType, locationId, vivresType.id),
        data: {
          quantity: { decrement: foodToConsume },
        },
      });

      // Récupérer le stock mis à jour pour la réponse
      const updatedStock = await tx.resourceStock.findUnique({
        where: ResourceQueries.stockWhere(locationType, locationId, vivresType.id),
      });

      return {
        character: updatedCharacter,
        stockQuantity: updatedStock?.quantity || 0,
        stockName,
      };
    });

    res.status(200).json({
      character: {
        id: result.character.id,
        name: result.character.name,
        hungerLevel: result.character.hungerLevel,
        user: { username: result.character.user.username },
      },
      town: {
        name: character.town.name,
        foodStock: result.stockQuantity,
      },
      foodConsumed: foodToConsume,
    });
  } catch (error) {
    next(error);
  }
};

export const getTownCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { townId } = req.params;
    const characters = await characterService.getTownCharacters(townId);
    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

export const eatFoodAlternative: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resourceTypeName } = req.body; // Nom du type de ressource à consommer

    if (!resourceTypeName) {
      throw createHttpError(400, "resourceTypeName est requis");
    }

    // Récupérer le personnage avec ses informations d'expédition
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        town: true,
        expeditionMembers: {
          include: {
            expedition: true,
          },
        },
      },
    });

    if (!character) throw createHttpError(404, "Personnage non trouvé");
    if (character.isDead) throw createHttpError(400, "Ce personnage est mort");
    if (character.hungerLevel >= 4)
      throw createHttpError(400, "Tu n'as pas faim");

    const foodToConsume = character.hungerLevel === 1 ? 2 : 1;

    // Récupérer le type de ressource demandé
    const resourceType = await ResourceUtils.getResourceTypeByName(resourceTypeName);

    // Déterminer la source des ressources selon la logique demandée
    let locationType: "CITY" | "EXPEDITION";
    let locationId: string;
    let stockName: string;

    // Vérifier si le personnage est en expédition DEPARTED
    const activeExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    if (activeExpedition) {
      // Personnage en expédition DEPARTED → consommer de l'expédition
      locationType = "EXPEDITION";
      locationId = activeExpedition.expeditionId;
      stockName = `expédition "${activeExpedition.expedition.name}"`;
    } else {
      // Personnage en ville ou expédition LOCKED → consommer de la ville
      locationType = "CITY";
      locationId = character.townId;
      stockName = `ville "${character.town.name}"`;
    }

    // Récupérer le stock approprié
    const foodStock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType, locationId, resourceType.id),
    });

    if (!foodStock || foodStock.quantity < foodToConsume) {
      throw createHttpError(
        400,
        `${stockName} n'a que ${foodStock?.quantity || 0} ${resourceType.name}`
      );
    }

    const newHungerLevel = Math.min(4, character.hungerLevel + 1);

    const result = await prisma.$transaction(async (tx) => {
      const updatedCharacter = await tx.character.update({
        where: { id },
        data: { hungerLevel: newHungerLevel },
        include: { user: true },
      });

      // Retirer les ressources du stock approprié (ville ou expédition)
      await tx.resourceStock.update({
        where: ResourceQueries.stockWhere(locationType, locationId, resourceType.id),
        data: {
          quantity: { decrement: foodToConsume },
        },
      });

      // Récupérer le stock mis à jour pour la réponse
      const updatedStock = await tx.resourceStock.findUnique({
        where: ResourceQueries.stockWhere(locationType, locationId, resourceType.id),
      });

      return {
        character: updatedCharacter,
        stockQuantity: updatedStock?.quantity || 0,
        stockName,
        resourceTypeName: resourceType.name,
      };
    });

    res.status(200).json({
      character: {
        id: result.character.id,
        name: result.character.name,
        hungerLevel: result.character.hungerLevel,
        user: { username: result.character.user.username },
      },
      town: {
        name: character.town.name,
        foodStock: result.stockQuantity,
      },
      foodConsumed: foodToConsume,
      resourceTypeConsumed: result.resourceTypeName,
    });
  } catch (error) {
    next(error);
  }
};

export const killCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await characterService.killCharacter(id);
    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

export const grantRerollPermission: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await characterService.grantRerollPermission(id);
    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

export const createRerollCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId, name } = req.body;
    const character = await characterService.createRerollCharacter(
      userId,
      townId,
      name
    );
    res.status(201).json(character);
  } catch (error) {
    next(error);
  }
};

export const switchActiveCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId, characterId } = req.body;
    const character = await characterService.switchActiveCharacter(
      userId,
      townId,
      characterId
    );
    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

export const getRerollableCharacters: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { userId, townId } = req.params;
    const characters = await characterService.getRerollableCharacters(
      userId,
      townId
    );
    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

export const needsCharacterCreation: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { userId, townId } = req.params;
    const needsCreation = await characterService.needsCharacterCreation(
      userId,
      townId
    );
    res.status(200).json({ needsCreation });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère toutes les capacités d'un personnage
 */
export const getCharacterCapabilities: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const capabilities = await characterService.getCharacterCapabilities(id);
    res.status(200).json(capabilities);
  } catch (error) {
    next(
      createHttpError(500, "Erreur lors de la récupération des capacités", {
        cause: error,
      })
    );
  }
};

/**
 * Récupère les capacités disponibles pour un personnage
 * (celles qu'il ne possède pas encore)
 */
export const getAvailableCapabilities: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const capabilities = await characterService.getAvailableCapabilities(id);
    res.status(200).json(capabilities);
  } catch (error) {
    next(
      createHttpError(
        500,
        "Erreur lors de la récupération des capacités disponibles",
        { cause: error }
      )
    );
  }
};

/**
 * Ajoute une capacité à un personnage
 */
export const addCharacterCapability: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id, capabilityId } = req.params;
    logger.info(
      `Tentative d'ajout de capacité ${capabilityId} au personnage ${id}`
    );
    const capability = await characterService.addCharacterCapability(
      id,
      capabilityId
    );
    res.status(201).json(capability);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `Erreur lors de l'ajout de capacité ${req.params.capabilityId} au personnage ${req.params.id}:`,
        { error: error.message }
      );
      if (
        error.message === "Personnage non trouvé" ||
        error.message === "Capacité non trouvée"
      ) {
        next(createHttpError(404, error.message));
      } else if (
        error.message === "Le personnage possède déjà cette capacité"
      ) {
        next(createHttpError(400, error.message));
      } else {
        next(
          createHttpError(500, "Erreur lors de l'ajout de la capacité", {
            cause: error,
          })
        );
      }
    } else {
      next(createHttpError(500, "Une erreur inconnue est survenue"));
    }
  }
};

/**
 * Retire une capacité d'un personnage
 */
export const removeCharacterCapability: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id, capabilityId } = req.params;
    await characterService.removeCharacterCapability(id, capabilityId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Personnage non trouvé" ||
        error.message === "Capacité non trouvée"
      ) {
        next(createHttpError(404, error.message));
      } else if (
        error.message === "Le personnage ne possède pas cette capacité"
      ) {
        next(createHttpError(400, error.message));
      } else {
        next(
          createHttpError(500, "Erreur lors de la suppression de la capacité", {
            cause: error,
          })
        );
      }
    } else {
      next(createHttpError(500, "Une erreur inconnue est survenue"));
    }
  }
};

/**
 * Utilise une capacité d'un personnage
 */
export const useCharacterCapability: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { capabilityId, capabilityName, isSummer, paToUse, inputQuantity } = req.body;

    // Utiliser le nom ou l'ID selon ce qui est fourni
    const capabilityIdentifier = capabilityId || capabilityName;

    if (!capabilityIdentifier) {
      throw createHttpError(400, "capabilityId ou capabilityName requis");
    }

    const result = await characterService.useCharacterCapability(
      id,
      capabilityIdentifier,
      isSummer,
      paToUse,
      inputQuantity
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Personnage non trouvé" ||
        error.message === "Capacité non trouvée"
      ) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("PA") || error.message.includes("vivres") || error.message.includes("Vivres")) {
        next(createHttpError(400, error.message));
      } else {
        next(
          createHttpError(500, "Erreur lors de l'utilisation de la capacité", {
            cause: error,
          })
        );
      }
    } else {
      next(createHttpError(500, "Une erreur inconnue est survenue"));
    }
  }
};

export const updateCharacterStats: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paTotal, hungerLevel, hp, pm, isDead, canReroll, isActive } =
      req.body;

    const updateData: Prisma.CharacterUpdateInput = { updatedAt: new Date() };

    if (paTotal !== undefined) updateData.paTotal = paTotal;
    if (hungerLevel !== undefined) updateData.hungerLevel = hungerLevel;
    if (hp !== undefined) updateData.hp = hp;
    if (pm !== undefined) updateData.pm = pm;
    if (isDead !== undefined) updateData.isDead = isDead;
    if (canReroll !== undefined) updateData.canReroll = canReroll;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Vérifier si le personnage doit mourir (PV = 0, PM = 0 ou Faim = 0)
    const shouldDie =
      (hp !== undefined && hp <= 0) ||
      (pm !== undefined && pm <= 0) ||
      (hungerLevel !== undefined && hungerLevel <= 0);

    if (shouldDie) {
      updateData.isDead = true;
      updateData.paTotal = 0;
      updateData.hungerLevel = 0;
      updateData.hp = 0;
      updateData.pm = 0;
    } else if (isDead === true) {
      // Cas où isDead est explicitement défini à true
      updateData.paTotal = 0;
      updateData.hungerLevel = 0;
      updateData.hp = 0;
      updateData.pm = 0;
    }

    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        town: { include: { guild: true } },
      },
    });

    res.status(200).json(updatedCharacter);
  } catch (error) {
    next(error);
  }
};
export const useCataplasme: RequestHandler = async (req, res, next) => {
  try {
    const { id: characterId } = req.params;

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        expeditionMembers: {
          include: { expedition: true },
        },
      },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    if (character.isDead) {
      throw createHttpError(400, "Personnage mort");
    }

    if (character.hp >= 5) {
      throw createHttpError(400, "PV déjà au maximum");
    }

    // Vérifier si le personnage est en agonie affamé (hungerLevel=0 ET hp=1)
    if (character.hungerLevel === 0 && character.hp === 1) {
      throw createHttpError(
        400,
        "Impossible d'utiliser un cataplasme sur un personnage en agonie affamé"
      );
    }

    // Determine location (city or DEPARTED expedition)
    const departedExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    const locationType = departedExpedition ? "EXPEDITION" : "CITY";
    const locationId = departedExpedition
      ? departedExpedition.expeditionId
      : character.townId;

    // Check cataplasme availability
    const cataplasmeType = await ResourceUtils.getResourceTypeByName("Cataplasme");

    const stock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType, locationId, cataplasmeType.id),
    });

    if (!stock || stock.quantity < 1) {
      throw createHttpError(400, "Aucun cataplasme disponible");
    }

    // Use cataplasme
    await prisma.$transaction(async (tx) => {
      // Remove 1 cataplasme
      await tx.resourceStock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: 1 } },
      });

      // Heal +1 HP
      await tx.character.update({
        where: { id: characterId },
        data: { hp: Math.min(5, character.hp + 1) },
      });
    });

    res.json({
      success: true,
      message: `${character.name} utilise un cataplasme et retrouve des forces (+1 PV).`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /characters/:id/job - Changer le métier d'un personnage
 */
export const changeCharacterJob: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { jobId } = req.body;

    if (!jobId) {
      throw createHttpError(400, "jobId is required");
    }

    const character = await characterService.changeCharacterJob(id, jobId);

    res.status(200).json(character);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Character not found" ||
        error.message === "Job not found"
      ) {
        next(createHttpError(404, error.message));
      } else {
        next(
          createHttpError(500, "Error changing character job", { cause: error })
        );
      }
    } else {
      next(createHttpError(500, "An unknown error occurred"));
    }
  }
};

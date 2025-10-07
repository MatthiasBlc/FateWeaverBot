import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { Prisma } from "@prisma/client";
import { prisma } from "../util/db";
import { toCharacterDto } from "../util/mappers";
import { CharacterService } from "../services/character.service";
import { logger } from "../services/logger";

const characterService = new CharacterService();

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
    const user = await prisma.user.findUnique({
      where: { discordId },
    });

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
    const { userId, townId, name, roleIds } = req.body;

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
      if (existingCharacter) {
        await tx.character.updateMany({
          where: {
            userId,
            townId,
            id: { not: existingCharacter.id },
            isDead: false,
          },
          data: { isActive: false },
        });
      } else {
        await tx.character.updateMany({
          where: { userId, townId, isDead: false },
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
        },
        include: {
          user: true,
          town: { include: { guild: true } },
          characterRoles: { include: { role: true } },
        },
      });

      await tx.characterRole.deleteMany({
        where: { characterId: character.id },
      });

      if (guildRoles.length > 0) {
        const rolesWithNames = await tx.role.findMany({
          where: { id: { in: guildRoles.map((r) => r.id) } },
          select: { id: true, name: true },
        });
        const roleMap = new Map(rolesWithNames.map((r) => [r.id, r.name]));
        const characterRolesData = guildRoles.map((role) => ({
          characterId: character.id,
          roleId: role.id,
          username: user.username,
          roleName: roleMap.get(role.id) || "Rôle inconnu",
        }));
        await tx.characterRole.createMany({
          data: characterRolesData,
          skipDuplicates: true,
        });
      }

      return tx.character.findUniqueOrThrow({
        where: { id: character.id },
        include: {
          user: true,
          town: { include: { guild: true } },
          characterRoles: { include: { role: true } },
        },
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
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
      },
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
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
      },
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
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
      },
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
    const character = await prisma.character.findUnique({
      where: { id },
      include: { town: true },
    });

    if (!character) throw createHttpError(404, "Personnage non trouvé");
    if (character.isDead) throw createHttpError(400, "Ce personnage est mort");
    if (character.hungerLevel >= 4)
      throw createHttpError(400, "Tu n'as pas faim");

    const foodToConsume = character.hungerLevel === 1 ? 2 : 1;

    // Récupérer le stock de vivres de la ville
    const vivresType = await prisma.resourceType.findFirst({
      where: { name: "Vivres" }
    });

    if (!vivresType) {
      throw createHttpError(500, "Type de ressource 'Vivres' non trouvé");
    }

    const townStock = await prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: vivresType.id
        }
      }
    });

    if (!townStock || townStock.quantity < foodToConsume) {
      throw createHttpError(
        400,
        `La ville n'a que ${townStock?.quantity || 0} vivres`
      );
    }

    const newHungerLevel = Math.min(4, character.hungerLevel + 1);

    const result = await prisma.$transaction(async (tx) => {
      const updatedCharacter = await tx.character.update({
        where: { id },
        data: { hungerLevel: newHungerLevel },
        include: { user: true },
      });

      // Retirer les vivres du stock de la ville
      await tx.resourceStock.update({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: vivresType.id
          }
        },
        data: {
          quantity: { decrement: foodToConsume }
        }
      });

      // Récupérer le stock mis à jour pour la réponse
      const updatedTownStock = await tx.resourceStock.findUnique({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: "CITY",
            locationId: character.townId,
            resourceTypeId: vivresType.id
          }
        }
      });

      return {
        character: updatedCharacter,
        townStock: updatedTownStock?.quantity || 0
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
        foodStock: result.townStock,
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

export const createCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { name, userId, townId } = req.body;
    const character = await characterService.createCharacter({
      name,
      userId,
      townId,
    });
    res.status(201).json(character);
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
    const { capabilityId, capabilityName, isSummer } = req.body;

    // Utiliser le nom ou l'ID selon ce qui est fourni
    const capabilityIdentifier = capabilityId || capabilityName;

    if (!capabilityIdentifier) {
      throw createHttpError(400, "capabilityId ou capabilityName requis");
    }

    const result = await characterService.useCharacterCapability(
      id,
      capabilityIdentifier,
      isSummer
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Personnage non trouvé" ||
        error.message === "Capacité non trouvée"
      ) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("PA")) {
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

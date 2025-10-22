import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { Prisma } from "@prisma/client";
import { prisma } from "../../util/db";
import { toCharacterDto } from "../../util/mappers";
import { characterService } from "../../services/character";
import { logger } from "../../services/logger";
import { notifyAgonyEntered } from "../../util/agony-notification";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";
import { ResourceQueries } from "../../infrastructure/database/query-builders/resource.queries";
import { ResourceUtils, CharacterUtils } from "../../shared/utils";

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

export const getTownCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { townId } = req.params;
    const characters = await characterService.getTownCharacters(townId);
    res.status(200).json(characters);
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

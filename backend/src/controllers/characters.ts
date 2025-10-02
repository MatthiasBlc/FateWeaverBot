import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { Prisma } from "@prisma/client";
import { prisma } from "../util/db";
import { toCharacterDto } from "../util/mappers";
import { CharacterService } from "../services/character.service";

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
    if (character.town.foodStock <= 0)
      throw createHttpError(400, "La ville n'a plus de vivres");

    const foodToConsume = character.hungerLevel === 1 ? 2 : 1;
    if (character.town.foodStock < foodToConsume) {
      throw createHttpError(
        400,
        `La ville n'a que ${character.town.foodStock} vivres`
      );
    }

    const newHungerLevel = Math.min(4, character.hungerLevel + 1);

    const result = await prisma.$transaction(async (tx) => {
      const updatedCharacter = await tx.character.update({
        where: { id },
        data: { hungerLevel: newHungerLevel },
        include: { user: true },
      });

      const updatedTown = await tx.town.update({
        where: { id: character.townId },
        data: { foodStock: { decrement: foodToConsume } },
      });

      return { character: updatedCharacter, town: updatedTown };
    });

    res.status(200).json({
      character: {
        id: result.character.id,
        name: result.character.name,
        hungerLevel: result.character.hungerLevel,
        user: { username: result.character.user.username },
      },
      town: {
        name: result.town.name,
        foodStock: result.town.foodStock,
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

export const updateCharacterStats: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paTotal, hungerLevel, hp, pm, isDead, canReroll, isActive } = req.body;

    const updateData: Prisma.CharacterUpdateInput = { updatedAt: new Date() };

    if (paTotal !== undefined) updateData.paTotal = paTotal;
    if (hungerLevel !== undefined) updateData.hungerLevel = hungerLevel;
    if (hp !== undefined) updateData.hp = hp;
    if (pm !== undefined) updateData.pm = pm;
    if (isDead !== undefined) updateData.isDead = isDead;
    if (canReroll !== undefined) updateData.canReroll = canReroll;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Vérifier si le personnage doit mourir (PV = 0, PM = 0 ou Faim = 0)
    const shouldDie = (hp !== undefined && hp <= 0) ||
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

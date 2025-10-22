import { RequestHandler } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { prisma } from "../util/db";

export const upsertRole: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, name, color, guildId } = req.body;

    if (!discordId || !name || !guildId) {
      throw new BadRequestError("Les champs discordId, name et guildId sont requis");
    }

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) {
      throw new NotFoundError("Guilde non trouvée");
    }

    const existingRole = await prisma.role.findFirst({ where: { discordId, guildId } });

    const role = existingRole
      ? await prisma.role.update({
          where: { id: existingRole.id },
          data: { name, color },
        })
      : await prisma.role.create({
          data: {
            discordId,
            name,
            color,
            guild: { connect: { id: guildId } },
          },
        });

    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

export const getRoleByDiscordId: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, guildId } = req.params;
    const role = await prisma.role.findFirst({ where: { discordId, guildId } });

    if (!role) {
      throw new NotFoundError("Rôle non trouvé");
    }

    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

export const getGuildRoles: RequestHandler = async (req, res, next) => {
  try {
    const { guildId } = req.params;
    const roles = await prisma.role.findMany({
      where: { guildId },
      orderBy: { name: "asc" },
    });
    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};

export const deleteRole: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.characterRole.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const updateCharacterRoles: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { roleIds } = req.body;

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { town: { include: { guild: true } } },
    });

    if (!character) {
      throw new NotFoundError("Personnage non trouvé");
    }

    if (roleIds && roleIds.length > 0) {
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds }, guildId: character.town.guildId },
      });
      if (roles.length !== roleIds.length) {
        throw new BadRequestError("Un ou plusieurs rôles sont invalides");
      }
    }

    await prisma.characterRole.deleteMany({ where: { characterId } });

    if (roleIds && roleIds.length > 0) {
      const [characterWithUser, roles] = await Promise.all([
        prisma.character.findUnique({ where: { id: characterId }, include: { user: true } }),
        prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } }),
      ]);

      if (!characterWithUser) {
        throw new NotFoundError("Personnage non trouvé");
      }

      await prisma.characterRole.createMany({
        data: roleIds.map((roleId: string) => ({
          characterId,
          roleId,
        })),
        skipDuplicates: true,
      });
    }

    const updatedCharacter = await prisma.character.findUnique({
      where: { id: characterId },
      include: { characterRoles: { include: { role: true } } },
    });

    res.status(200).json(updatedCharacter);
  } catch (error) {
    next(error);
  }
};


import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

// Interface pour les données de création/mise à jour d'un rôle
interface RoleInput {
  discordId: string;
  name: string;
  color?: string;
  serverId: string;
}

// Crée ou met à jour un rôle
// Si le rôle existe déjà pour ce serveur, il est mis à jour
// Sinon, un nouveau rôle est créé
export const upsertRole: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, name, color, serverId } = req.body as RoleInput;

    if (!discordId || !name || !serverId) {
      throw createHttpError(
        400,
        "Les champs discordId, name et serverId sont requis"
      );
    }

    // Vérifier si le serveur existe
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw createHttpError(404, "Serveur non trouvé");
    }

    // Vérifier si le rôle existe déjà pour ce serveur
    const existingRole = await prisma.role.findFirst({
      where: {
        discordId,
        serverId,
      },
    });

    let role;

    if (existingRole) {
      // Mettre à jour le rôle existant
      role = await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          name,
          color,
        },
      });
    } else {
      // Créer un nouveau rôle
      role = await prisma.role.create({
        data: {
          discordId,
          name,
          color,
          server: {
            connect: { id: serverId },
          },
        },
      });
    }

    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

// Récupère un rôle par son ID Discord et l'ID du serveur
export const getRoleByDiscordId: RequestHandler = async (req, res, next) => {
  try {
    const { discordId, serverId } = req.params;

    if (!discordId || !serverId) {
      throw createHttpError(
        400,
        "Les paramètres discordId et serverId sont requis"
      );
    }

    const role = await prisma.role.findFirst({
      where: {
        discordId,
        serverId,
      },
    });

    if (!role) {
      throw createHttpError(404, "Rôle non trouvé");
    }

    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

// Récupère tous les rôles d'un serveur
export const getServerRoles: RequestHandler = async (req, res, next) => {
  try {
    const { serverId } = req.params;

    if (!serverId) {
      throw createHttpError(400, "Le paramètre serverId est requis");
    }

    const roles = await prisma.role.findMany({
      where: {
        serverId,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};

// Supprime un rôle
export const deleteRole: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID du rôle est requis");
    }

    // Vérifier d'abord si le rôle existe
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw createHttpError(404, "Rôle non trouvé");
    }

    // Supprimer d'abord les références dans character_roles
    await prisma.characterRole.deleteMany({
      where: { roleId: id },
    });

    // Puis supprimer le rôle
    await prisma.role.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Met à jour les rôles d'un personnage
export const updateCharacterRoles: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { roleIds } = req.body as { roleIds: string[] };

    if (!characterId) {
      throw createHttpError(400, "L'ID du personnage est requis");
    }

    // Vérifier que le personnage existe
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { server: true },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    // Vérifier que les rôles existent et appartiennent au même serveur
    if (roleIds && roleIds.length > 0) {
      const roles = await prisma.role.findMany({
        where: {
          id: { in: roleIds },
          serverId: character.serverId,
        },
      });

      if (roles.length !== roleIds.length) {
        throw createHttpError(400, "Un ou plusieurs rôles sont invalides");
      }
    }

    // Supprimer les anciennes associations de rôles
    await prisma.characterRole.deleteMany({
      where: { characterId },
    });

    // Créer les nouvelles associations de rôles
    if (roleIds && roleIds.length > 0) {
      // Récupérer les informations du personnage et des rôles
      const [characterWithUser, roles] = await Promise.all([
        prisma.character.findUnique({
          where: { id: characterId },
          include: { user: true },
        }),
        prisma.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, name: true },
        }),
      ]);

      if (!characterWithUser) {
        throw createHttpError(404, "Personnage non trouvé");
      }

      // Créer un map des rôles pour un accès facile
      const roleMap = new Map(roles.map((role) => [role.id, role.name]));

      // Créer les entrées avec tous les champs requis
      await prisma.characterRole.createMany({
        data: roleIds.map((roleId) => ({
          characterId,
          roleId,
          assignedAt: new Date(),
          username: characterWithUser.user?.username || "Inconnu",
          roleName: roleMap.get(roleId) || "Rôle inconnu",
        })),
        skipDuplicates: true,
      });
    }

    // Récupérer le personnage avec ses rôles mis à jour
    const updatedCharacter = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.status(200).json(updatedCharacter);
  } catch (error) {
    next(error);
  }
};

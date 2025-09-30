import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";
import { toCharacterDto } from "../util/mappers";

// Interface pour les données de création/mise à jour d'un personnage
interface CharacterInput {
  userId: string;
  guildId: string;
  name?: string | null;
  roleIds?: string[];
}

// Crée ou met à jour un personnage
export const upsertCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, guildId, name, roleIds } = req.body as CharacterInput;

    if (!userId || !guildId) {
      throw createHttpError(400, "Les champs userId et guildId sont requis");
    }

    // Vérifier si l'utilisateur et la guilde existent
    const [user, guild] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.guild.findUnique({ where: { id: guildId } }),
    ]);

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    if (!guild) {
      throw createHttpError(404, "Guilde non trouvée");
    }

    // Utiliser le nom fourni ou le nom d'utilisateur comme valeur par défaut
    const characterName = name || user.username;

    // Vérifier si un personnage existe déjà pour cet utilisateur et cette guilde
    const existingCharacter = await prisma.character.findFirst({
      where: {
        userId,
        guildId,
      },
      include: {
        user: true,
        guild: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Récupérer les rôles de la guilde qui correspondent aux rôles Discord fournis
    const guildRoles =
      roleIds && roleIds.length > 0
        ? await prisma.role.findMany({
            where: {
              guildId,
              discordId: {
                in: roleIds,
              },
            },
            select: {
              id: true,
            },
          })
        : [];

    // Mettre à jour ou créer le personnage avec les rôles
    const upsertedCharacter = await prisma.$transaction(async (prisma) => {
      // 1. Créer ou mettre à jour le personnage
      const character = await prisma.character.upsert({
        where: {
          id: existingCharacter?.id ?? "",
        },
        update: {
          name: characterName,
        },
        create: {
          name: characterName,
          userId,
          guildId,
        },
        include: {
          user: true,
          guild: true,
          characterRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // 2. Mettre à jour les associations de rôles
      // Supprimer d'abord toutes les associations existantes
      await prisma.characterRole.deleteMany({
        where: { characterId: character.id },
      });

      // Puis créer les nouvelles associations si des rôles sont fournis
      if (guildRoles.length > 0) {
        // Récupérer les noms des rôles
        const rolesWithNames = await prisma.role.findMany({
          where: {
            id: { in: guildRoles.map((r) => r.id) },
          },
          select: {
            id: true,
            name: true,
          },
        });

        const roleMap = new Map(rolesWithNames.map((r) => [r.id, r.name]));

        // Préparer les données des rôles avec tous les champs requis
        const characterRolesData = guildRoles.map((role) => ({
          characterId: character.id,
          roleId: role.id,
          assignedAt: new Date(),
          username: user?.username || "Inconnu",
          roleName: roleMap.get(role.id) || "Rôle inconnu",
        }));

        // Créer les associations de rôles
        await prisma.characterRole.createMany({
          data: characterRolesData,
          skipDuplicates: true,
        });
      }

      // Recharger le personnage avec les relations mises à jour
      const updatedCharacter = await prisma.character.findUniqueOrThrow({
        where: { id: character.id },
        include: {
          user: true,
          guild: true,
          characterRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  discordId: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      });
      return updatedCharacter;
    });

    // Utiliser le mapper pour transformer la réponse
    const characterDto = toCharacterDto(upsertedCharacter);
    return res.status(200).json(characterDto);
  } catch (error) {
    next(error);
  }
};

// Récupère un personnage par son ID
export const getCharacterById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        user: true,
        guild: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    // Utiliser le mapper pour transformer la réponse
    const characterDto = toCharacterDto(character);
    res.status(200).json(characterDto);
  } catch (error) {
    next(error);
  }
};

// Récupère un personnage par l'ID Discord de l'utilisateur et l'ID Discord du serveur
export const getCharacterByDiscordIds: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { userId, guildId } = req.params;

    const character = await prisma.character.findFirst({
      where: {
        user: {
          discordId: userId,
        },
        guild: {
          discordGuildId: guildId,
        },
      },
      include: {
        user: true,
        guild: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
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

// Récupère tous les personnages d'une guilde
export const getGuildCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { guildId } = req.params;

    const characters = await prisma.character.findMany({
      where: {
        guildId,
      },
      include: {
        user: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

// Supprime un personnage
export const deleteCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier d'abord si le personnage existe
    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    // Supprimer d'abord les références dans character_roles
    await prisma.characterRole.deleteMany({
      where: { characterId: id },
    });

    // Puis supprimer le personnage
    await prisma.character.delete({
      where: { id },
    });

    res.status(204).json({ message: "Personnage supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};

// Permet à un personnage de manger (consomme 1 vivre de la ville et améliore la faim du personnage)
export const eatFood: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID du personnage est requis");
    }

    // Récupérer le personnage avec sa guilde et sa ville
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        guild: {
          include: {
            town: true,
          },
        },
      },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    if (!character.guild?.town) {
      throw createHttpError(404, "Ville non trouvée pour ce personnage");
    }

    // Vérifier si le personnage n'a pas faim (niveau 4 = en bonne santé)
    if (character.hungerLevel >= 4) {
      throw createHttpError(
        400,
        "Tu n'as pas faim, pas besoin de manger"
      );
    }

    // Vérifier si le personnage est mort
    if (character.hungerLevel <= 0) {
      throw createHttpError(
        400,
        "Ce personnage est mort et ne peut plus manger"
      );
    }

    // Vérifier si la ville a des foodstock
    if (character.guild.town.foodStock <= 0) {
      throw createHttpError(400, "La ville n'a plus de vivres disponibles");
    }

    // Calculer combien de foodstock consommer selon l'état de faim
    let foodToConsume = 1;
    if (character.hungerLevel === 1) {
      // Agonie nécessite 2 repas pour passer au niveau 2
      foodToConsume = 2;
    }

    // Vérifier si la ville a assez de foodstock
    if (character.guild.town.foodStock < foodToConsume) {
      throw createHttpError(
        400,
        `La ville n'a que ${character.guild.town.foodStock} vivres, mais ${foodToConsume} sont nécessaires`
      );
    }

    // Calculer le nouveau niveau de faim (inversé: 0=mort, 4=bonne santé)
    let newHungerLevel = Math.min(4, character.hungerLevel + 1);

    // Cas spécial : agonie (niveau 1) qui nécessite 2 repas pour passer au niveau 2
    if (character.hungerLevel === 1 && foodToConsume === 2) {
      newHungerLevel = 2;
    }

    // Effectuer la transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Mettre à jour le personnage
      const updatedCharacter = await prisma.character.update({
        where: { id },
        data: {
          hungerLevel: newHungerLevel,
          updatedAt: new Date(),
        },
        include: {
          user: true,
          guild: {
            include: {
              town: true,
            },
          },
        },
      });

      // Mettre à jour le stock de foodstock de la ville
      const updatedTown = await prisma.town.update({
        where: { id: character.guild.town!.id },
        data: {
          foodStock: {
            decrement: foodToConsume,
          },
        },
      });

      return { character: updatedCharacter, town: updatedTown };
    });

    // Retourner le résultat avec les informations nécessaires pour le logging
    res.status(200).json({
      character: {
        id: result.character.id,
        name: result.character.name,
        hungerLevel: result.character.hungerLevel,
        user: {
          username: result.character.user.username,
        },
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

// Met à jour les valeurs PA et Faim d'un personnage
export const updateCharacterStats: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paTotal, hungerLevel } = req.body;

    if (!id) {
      throw createHttpError(400, "L'ID du personnage est requis");
    }

    // Vérifier que au moins un champ est fourni
    if (paTotal === undefined && hungerLevel === undefined) {
      throw createHttpError(400, "Au moins un des champs paTotal ou hungerLevel doit être fourni");
    }

    // Valider les valeurs si elles sont fournies
    if (paTotal !== undefined && (paTotal < 0 || paTotal > 4)) {
      throw createHttpError(400, "Les PA doivent être entre 0 et 4");
    }

    if (hungerLevel !== undefined && (hungerLevel < 0 || hungerLevel > 4)) {
      throw createHttpError(400, "Le niveau de faim doit être entre 0 et 4");
    }

    // Récupérer le personnage actuel
    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    // Préparer les données de mise à jour
    const updateData: {
      updatedAt: Date;
      paTotal?: number;
      lastPaUpdate?: Date;
      hungerLevel?: number;
    } = {
      updatedAt: new Date(),
    };

    if (paTotal !== undefined) {
      updateData.paTotal = paTotal;
      updateData.lastPaUpdate = new Date();
    }

    if (hungerLevel !== undefined) {
      updateData.hungerLevel = hungerLevel;
    }

    // Mettre à jour le personnage
    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        guild: true,
        characterRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Utiliser le mapper pour transformer la réponse
    const characterDto = toCharacterDto(updatedCharacter);
    res.status(200).json(characterDto);
  } catch (error) {
    next(error);
  }
};

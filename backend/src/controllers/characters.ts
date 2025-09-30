import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";
import { toCharacterDto } from "../util/mappers";
import { CharacterService } from "../services/character.service";

// Interface pour les données de création/mise à jour d'un personnage
interface CharacterInput {
  userId: string;
  townId: string;
  name?: string | null;
  roleIds?: string[];
}

// Interface pour les données de création d'un personnage dans une ville
interface CreateCharacterInput {
  name: string;
  userId: string;
  townId: string;
}

// Interface pour les données de création d'un personnage reroll
interface CreateRerollInput {
  userId: string;
  townId: string;
  name: string;
}

// Interface pour les données de changement de personnage actif
interface SwitchActiveInput {
  userId: string;
  townId: string;
  characterId: string;
}

// Interface pour la mise à jour des statistiques
interface UpdateStatsInput {
  paTotal?: number;
  hungerLevel?: number;
  isDead?: boolean;
  canReroll?: boolean;
  isActive?: boolean;
}

// Créer une instance du service
const characterService = new CharacterService();

// Crée ou met à jour un personnage
export const upsertCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId, name, roleIds } = req.body as CharacterInput;

    if (!userId || !townId) {
      throw createHttpError(400, "Les champs userId et townId sont requis");
    }

    // Vérifier si l'utilisateur et la ville existent
    const [user, townWithGuild] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.town.findUnique({
        where: { id: townId },
        include: { guild: true }
      }),
    ]);

    if (!user) {
      throw createHttpError(404, "Utilisateur non trouvé");
    }

    if (!townWithGuild) {
      throw createHttpError(404, "Ville non trouvée");
    }

    // Utiliser le nom fourni ou le nom d'utilisateur comme valeur par défaut
    const characterName = name || user.username;

    // Vérifier si un personnage existe déjà pour cet utilisateur et cette ville
    const existingCharacter = await prisma.character.findFirst({
      where: {
        userId,
        townId: townId, // Utiliser townId au lieu de guildId
      },
      include: {
        user: true,
        town: {
          include: {
            guild: true,
          },
        },
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
              guildId: townWithGuild.guild.id,
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
      // 1. Désactiver tous les autres personnages de l'utilisateur dans cette ville
      if (existingCharacter) {
        // Si on met à jour un personnage existant, désactiver tous les autres
        await prisma.character.updateMany({
          where: {
            userId,
            townId: townId,
            id: { not: existingCharacter.id }, // Ne pas désactiver le personnage en cours de mise à jour
            isDead: false, // Ne désactiver que les personnages vivants
          },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });
      } else {
        // Si on crée un nouveau personnage, désactiver tous les autres personnages de l'utilisateur
        await prisma.character.updateMany({
          where: {
            userId,
            townId: townId,
            isDead: false, // Ne désactiver que les personnages vivants
          },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });
      }

      // 2. Créer ou mettre à jour le personnage
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
          townId: townId, // Utiliser townId au lieu de guildId
          hungerLevel: 4, // Valeur par défaut pour la faim
          paTotal: 2,     // Valeur par défaut pour les points d'action
          isActive: true,
          isDead: false,
          canReroll: false,
        },
        include: {
          user: true,
          town: {
            include: {
              guild: true,
            },
          },
          characterRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // 3. Mettre à jour les associations de rôles
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
          town: {
            include: {
              guild: true,
            },
          },
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
        town: {
          include: {
            guild: true,
          },
        },
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
        town: {
          guild: {
            discordGuildId: guildId,
          },
        },
      },
      include: {
        user: true,
        town: {
          include: {
            guild: true,
          },
        },
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
        town: {
          guildId,
        },
      },
      include: {
        user: true,
        town: {
          include: {
            guild: true,
          },
        },
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
        town: {
          include: {
            guild: true,
          },
        },
      },
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    if (!character.town?.guild) {
      throw createHttpError(404, "Guilde non trouvée pour ce personnage");
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
    if (character.town.foodStock <= 0) {
      throw createHttpError(400, "La ville n'a plus de vivres disponibles");
    }

    // Calculer combien de foodstock consommer selon l'état de faim
    let foodToConsume = 1;
    if (character.hungerLevel === 1) {
      // Agonie nécessite 2 repas pour passer au niveau 2
      foodToConsume = 2;
    }

    // Vérifier si la ville a assez de foodstock
    if (character.town.foodStock < foodToConsume) {
      throw createHttpError(
        400,
        `La ville n'a que ${character.town.foodStock} vivres, mais ${foodToConsume} sont nécessaires`
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
      // Mettre à jour le personnage en utilisant le service qui gère automatiquement la mort
      const characterService = (await import("../services/character.service")).CharacterService;
      const service = new characterService();

      await service.updateHunger(id, newHungerLevel);

      const updatedCharacter = await prisma.character.findUnique({
        where: { id },
        include: {
          user: true,
          town: {
            include: {
              guild: true,
            },
          },
        },
      });

      if (!updatedCharacter) {
        throw createHttpError(404, "Personnage non trouvé après mise à jour");
      }

      // Mettre à jour le stock de foodstock de la ville
      const updatedTown = await prisma.town.update({
        where: { id: character.town.id },
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

// ==================== NOUVEAUX ENDPOINTS POUR LE SYSTÈME TOWN-BASED ====================

// Récupère tous les personnages d'une ville
export const getTownCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { townId } = req.params;

    if (!townId) {
      throw createHttpError(400, "L'ID de la ville est requis");
    }

    const characters = await characterService.getTownCharacters(townId);

    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

// Créer un nouveau personnage dans une ville
export const createCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { name, userId, townId } = req.body as CreateCharacterInput;

    if (!name || !userId || !townId) {
      throw createHttpError(400, "Les champs name, userId et townId sont requis");
    }

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

// Tuer un personnage
export const killCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID du personnage est requis");
    }

    const character = await characterService.killCharacter(id);

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

// Donner l'autorisation de reroll à un personnage
export const grantRerollPermission: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "L'ID du personnage est requis");
    }

    const character = await characterService.grantRerollPermission(id);

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

// Créer un personnage reroll
export const createRerollCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId, name } = req.body as CreateRerollInput;

    if (!userId || !townId || !name) {
      throw createHttpError(400, "Les champs userId, townId et name sont requis");
    }

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

// Changer le personnage actif d'un utilisateur
export const switchActiveCharacter: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId, characterId } = req.body as SwitchActiveInput;

    if (!userId || !townId || !characterId) {
      throw createHttpError(400, "Les champs userId, townId et characterId sont requis");
    }

    const character = await characterService.switchActiveCharacter(userId, townId, characterId);

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
};

// Récupérer les personnages morts éligibles pour reroll
export const getRerollableCharacters: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId } = req.params;

    if (!userId || !townId) {
      throw createHttpError(400, "Les paramètres userId et townId sont requis");
    }

    const characters = await characterService.getRerollableCharacters(userId, townId);

    res.status(200).json(characters);
  } catch (error) {
    next(error);
  }
};

// Vérifier si un utilisateur a besoin de créer un personnage
export const needsCharacterCreation: RequestHandler = async (req, res, next) => {
  try {
    const { userId, townId } = req.params;

    if (!userId || !townId) {
      throw createHttpError(400, "Les paramètres userId et townId sont requis");
    }

    const needsCreation = await characterService.needsCharacterCreation(userId, townId);

    res.status(200).json({ needsCreation });
  } catch (error) {
    next(error);
  }
};

// Met à jour les statistiques d'un personnage (PA, faim, etc.)
export const updateCharacterStats: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paTotal, hungerLevel, isDead, canReroll, isActive } = req.body as UpdateStatsInput;

    if (!id) {
      throw createHttpError(400, "L'ID du personnage est requis");
    }

    // Définir le type des données de mise à jour
    interface CharacterUpdateData {
      updatedAt: Date;
      paTotal?: number;
      lastPaUpdate?: Date;
      hungerLevel?: number;
      isDead?: boolean;
      canReroll?: boolean;
      isActive?: boolean;
    }

    // Préparer les données de mise à jour
    const updateData: CharacterUpdateData = {
      updatedAt: new Date()
    };

    if (paTotal !== undefined) {
      updateData.paTotal = paTotal;
      updateData.lastPaUpdate = new Date();
    }
    if (hungerLevel !== undefined) updateData.hungerLevel = hungerLevel;
    if (isDead !== undefined) updateData.isDead = isDead;
    if (canReroll !== undefined) updateData.canReroll = canReroll;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Mettre à jour directement avec Prisma
    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        town: {
          include: {
            guild: true,
          },
        },
      },
    });

    res.status(200).json(updatedCharacter);
  } catch (error) {
    next(error);
  }
};

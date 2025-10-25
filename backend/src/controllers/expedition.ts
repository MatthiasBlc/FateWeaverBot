import { Request, Response, NextFunction } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { prisma } from "../util/db";
import { container } from "../infrastructure/container";
import { CharacterQueries } from "../infrastructure/database/query-builders/character.queries";

export const createExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      initialResources,  // ✅ Changer de initialVivres à initialResources
      duration,
      townId,
      discordGuildId,
      createdBy: requestCreatedBy,
    } = req.body;

    const createdBy =
      req.get("x-internal-request") === "true"
        ? requestCreatedBy
        : req.session.userId;

    if (!createdBy) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    let internalTownId = townId;
    if (discordGuildId && !townId) {
      const guild = await prisma.guild.findUnique({
        where: { discordGuildId },
        select: { town: { select: { id: true } } },
      });

      if (!guild || !guild.town) {
        return res.status(404).json({ error: "Guilde ou ville non trouvée" });
      }

      internalTownId = guild.town.id;
    }

    if (!internalTownId) {
      return res.status(400).json({ error: "ID de ville manquant" });
    }

    if (!name || !initialResources || !duration) {
      return res.status(400).json({ error: "Nom, ressources initiales et durée requis" });
    }

    const expedition = await container.expeditionService.createExpedition({
      name,
      townId: internalTownId,
      initialResources: initialResources,  // ✅ Utiliser directement initialResources
      duration: parseInt(duration, 10),
      createdBy,
    });

    // Nettoyer l'objet expedition pour éviter les références circulaires
    const safeExpedition = {
      id: expedition.id,
      name: expedition.name,
      status: expedition.status,
      duration: expedition.duration,
      townId: expedition.townId,
      createdBy: expedition.createdBy,
      createdAt: expedition.createdAt,
      updatedAt: expedition.updatedAt,
      // Ne pas inclure les références circulaires comme town, members, etc.
    };

    res.status(201).json(safeExpedition);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const getExpeditionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await container.expeditionService.getExpeditionById(id);

    if (!expedition) {
      return res.status(404).json({ error: "Expédition non trouvée" });
    }

    res.json(expedition);
  } catch (error) {
    next(error);
  }
};

export const getExpeditionsByTown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { townId } = req.params;
    const { includeReturned } = req.query;

    if (!townId) {
      return res.status(400).json({ error: "ID de ville requis" });
    }

    const expeditions = await container.expeditionService.getExpeditionsByTown(
      townId,
      includeReturned === "true"
    );

    res.json(expeditions);
  } catch (error) {
    next(error);
  }
};

export const joinExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;

    // Check if this is an internal request
    const isInternalRequest = req.get("x-internal-request") === "true";

    if (!isInternalRequest && !req.session.userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID de personnage requis" });
    }

    // For non-internal requests, verify the character belongs to the user
    if (!isInternalRequest) {
      const character = await prisma.character.findFirst({
        where: {
          id: characterId,
          userId: req.session.userId,
          isActive: true,
          isDead: false,
        },
      });

      if (!character) {
        return res.status(404).json({ error: "Personnage non trouvé ou non autorisé" });
      }
    } else {
      // For internal requests, just verify the character exists and is active
      const character = await prisma.character.findFirst({
        where: {
          id: characterId,
          isActive: true,
          isDead: false,
        },
      });

      if (!character) {
        return res.status(404).json({ error: "Personnage non trouvé" });
      }
    }

    const member = await container.expeditionService.joinExpedition(id, characterId);

    res.status(201).json(member);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const leaveExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;

    // Check if this is an internal request
    const isInternalRequest = req.get("x-internal-request") === "true";

    if (!isInternalRequest && !req.session.userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID de personnage requis" });
    }

    // For non-internal requests, verify the character belongs to the user
    if (!isInternalRequest) {
      const character = await prisma.character.findFirst({
        where: {
          id: characterId,
          userId: req.session.userId,
          isActive: true,
          isDead: false,
        },
      });

      if (!character) {
        return res.status(404).json({ error: "Personnage non trouvé ou non autorisé" });
      }
    } else {
      // For internal requests, just verify the character exists and is active
      const character = await prisma.character.findFirst({
        where: {
          id: characterId,
          isActive: true,
          isDead: false,
        },
      });

      if (!character) {
        return res.status(404).json({ error: "Personnage non trouvé" });
      }
    }

    await container.expeditionService.leaveExpedition(id, characterId);

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const getActiveExpeditionsForCharacter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      return res.status(400).json({ error: "ID de personnage requis" });
    }

    const expeditions = await container.expeditionService.getActiveExpeditionsForCharacter(
      characterId
    );

    res.json(expeditions);
  } catch (error) {
    next(error);
  }
};

export const getAllExpeditions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeReturned = req.query.includeReturned === 'true';
    const expeditions = await container.expeditionService.getAllExpeditions(includeReturned);
    res.json(expeditions);
  } catch (error) {
    console.error('Error getting all expeditions:', error);
    res.status(500).json({ error: 'Failed to get expeditions' });
  }
};

export const getExpeditionResources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const resources = await container.expeditionService.getExpeditionResources(id);
    res.json(resources);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const transferExpeditionResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { resourceType, amount, direction } = req.body;

    // Check if this is an internal request
    const isInternalRequest = req.get("x-internal-request") === "true";

    if (!isInternalRequest && !req.session.userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!resourceType || !amount || !direction) {
      return res.status(400).json({ error: "Type de ressource, montant et direction requis" });
    }

    if (!["to_town", "from_town"].includes(direction)) {
      return res.status(400).json({ error: "Direction invalide (to_town ou from_town)" });
    }

    await container.expeditionService.transferResource(
      id,
      resourceType,
      parseInt(amount, 10),
      direction as "to_town" | "from_town"
    );

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

/**
 * Toggle emergency return vote for an expedition
 * POST /expeditions/:id/emergency-vote
 */
export const toggleEmergencyVote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: expeditionId } = req.params;
    const { userId } = req.body;

    // Check if this is an internal request
    const isInternalRequest = req.get("x-internal-request") === "true";

    if (!isInternalRequest && !req.session.userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId requis" });
    }

    const result = await container.expeditionService.toggleEmergencyVote(expeditionId, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

/**
 * Set expedition direction for the day
 * POST /expeditions/:id/set-direction
 */
export const setExpeditionDirection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { direction, characterId } = req.body;

    if (!direction) {
      res.status(400).json({ error: "Direction is required" });
      return;
    }

    if (!characterId) {
      res.status(400).json({ error: "Character ID is required" });
      return;
    }

    const validDirections = [
      "NORD",
      "NORD_EST",
      "EST",
      "SUD_EST",
      "SUD",
      "SUD_OUEST",
      "OUEST",
      "NORD_OUEST",
    ];

    if (!validDirections.includes(direction)) {
      res.status(400).json({ error: "Invalid direction" });
      return;
    }

    const expedition = container.expeditionService;
    await expedition.setNextDirection(id, direction, characterId);

    res.status(200).json({ message: "Direction set successfully" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
};

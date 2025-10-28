import { Request, Response, NextFunction } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../../shared/errors';
import { prisma } from "../../util/db";
import { container } from "../../infrastructure/container";

export const getAllExpeditions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { includeReturned, townId, status } = req.query;

    // If townId is provided, get expeditions for that town
    if (townId) {
      const expeditions = await container.expeditionService.getExpeditionsByTown(
        townId as string,
        includeReturned === "true"
      );

      // Filter by status if provided
      const filteredExpeditions = status
        ? expeditions.filter(exp => exp.status === status)
        : expeditions;

      return res.json(filteredExpeditions);
    }

    // Otherwise, get all expeditions from all towns
    const expeditions = await prisma.expedition.findMany({
      where: includeReturned !== "true"
        ? { status: { not: "RETURNED" } }
        : {},
      include: {
        town: {
          select: { id: true, name: true }
        },
        members: {
          include: {
            character: {
              include: {
                user: {
                  select: { id: true, discordId: true, username: true }
                }
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter by status if provided
    const filteredExpeditions = status
      ? expeditions.filter(exp => exp.status === status)
      : expeditions;

    res.json(filteredExpeditions);
  } catch (error) {
    next(error);
  }
};

export const modifyExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    // Get current expedition
    const expedition = await container.expeditionService.getExpeditionById(id);
    if (!expedition) {
      return res.status(404).json({ error: "Expédition non trouvée" });
    }

    // Build update data
    interface ExpeditionUpdateData {
      duration?: number;
    }
    const updateData: ExpeditionUpdateData = {};
    if (duration !== undefined) {
      updateData.duration = parseInt(duration, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Aucune modification spécifiée" });
    }

    // Update expedition
    const updatedExpedition = await prisma.expedition.update({
      where: { id },
      data: updateData,
      include: {
        town: {
          select: { id: true, name: true }
        },
        members: {
          include: {
            character: {
              include: {
                user: {
                  select: { id: true, discordId: true, username: true }
                }
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    res.json(updatedExpedition);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const forceReturnExpedition = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await container.expeditionService.returnExpedition(id);

    res.json(expedition);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[forceReturnExpedition] Error for expedition ${id}:`, error.message);
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const lockExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await container.expeditionService.lockExpedition(id);

    res.json(expedition);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const addMemberToExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID du personnage requis" });
    }

    const member = await container.expeditionService.addMemberToExpedition(id, characterId);

    res.json(member);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const departExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await container.expeditionService.departExpedition(id);

    res.json(expedition);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

export const removeMemberFromExpedition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, characterId } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID du personnage requis" });
    }

    await container.expeditionService.removeMemberFromExpedition(id, characterId);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
};

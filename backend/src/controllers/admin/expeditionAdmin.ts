import { Request, Response } from "express";
import { prisma } from "../../util/db";
import { ExpeditionService } from "../../services/expedition.service";

const expeditionService = new ExpeditionService();

export const getAllExpeditions = async (req: Request, res: Response) => {
  try {
    const { includeReturned, townId, status } = req.query;

    // If townId is provided, get expeditions for that town
    if (townId) {
      const expeditions = await expeditionService.getExpeditionsByTown(
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
    console.error("Erreur lors de la récupération des expéditions admin:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const modifyExpedition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    // Get current expedition
    const expedition = await expeditionService.getExpeditionById(id);
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
    console.error("Erreur lors de la modification de l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const forceReturnExpedition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await expeditionService.returnExpedition(id);

    res.json(expedition);
  } catch (error) {
    console.error("Erreur lors du retour forcé de l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const lockExpedition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await expeditionService.lockExpedition(id);

    res.json(expedition);
  } catch (error) {
    console.error("Erreur lors du verrouillage de l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const addMemberToExpedition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID du personnage requis" });
    }

    const member = await expeditionService.addMemberToExpedition(id, characterId);

    res.json(member);
  } catch (error) {
    console.error("Erreur lors de l'ajout du membre à l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const departExpedition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await expeditionService.departExpedition(id);

    res.json(expedition);
  } catch (error) {
    console.error("Erreur lors du départ de l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const removeMemberFromExpedition = async (req: Request, res: Response) => {
  try {
    const { id, characterId } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID du personnage requis" });
    }

    await expeditionService.removeMemberFromExpedition(id, characterId);

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du membre de l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

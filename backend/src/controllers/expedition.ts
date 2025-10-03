import { Request, Response } from "express";
import { prisma } from "../util/db";
import { ExpeditionService } from "../services/expedition.service";

const expeditionService = new ExpeditionService();

export const createExpedition = async (req: Request, res: Response) => {
  try {
    const {
      name,
      foodStock,
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

    if (!name || !foodStock || !duration) {
      return res.status(400).json({ error: "Nom, stock de nourriture et durée requis" });
    }

    const expedition = await expeditionService.createExpedition({
      name,
      townId: internalTownId,
      foodStock: parseInt(foodStock, 10),
      duration: parseInt(duration, 10),
      createdBy,
    });

    res.status(201).json(expedition);
  } catch (error) {
    console.error("Erreur lors de la création de l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const getExpeditionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID d'expédition requis" });
    }

    const expedition = await expeditionService.getExpeditionById(id);

    if (!expedition) {
      return res.status(404).json({ error: "Expédition non trouvée" });
    }

    res.json(expedition);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'expédition:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getExpeditionsByTown = async (req: Request, res: Response) => {
  try {
    const { townId } = req.params;
    const { includeReturned } = req.query;

    if (!townId) {
      return res.status(400).json({ error: "ID de ville requis" });
    }

    const expeditions = await expeditionService.getExpeditionsByTown(
      townId,
      includeReturned === "true"
    );

    res.json(expeditions);
  } catch (error) {
    console.error("Erreur lors de la récupération des expéditions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const joinExpedition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID de personnage requis" });
    }

    // Verify the character belongs to the user
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

    const member = await expeditionService.joinExpedition(id, characterId);

    res.status(201).json(member);
  } catch (error) {
    console.error("Erreur lors de la participation à l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const leaveExpedition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!characterId) {
      return res.status(400).json({ error: "ID de personnage requis" });
    }

    // Verify the character belongs to the user
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

    await expeditionService.leaveExpedition(id, characterId);

    res.status(204).send();
  } catch (error) {
    console.error("Erreur lors du départ de l'expédition:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

export const getActiveExpeditionsForCharacter = async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      return res.status(400).json({ error: "ID de personnage requis" });
    }

    const expeditions = await expeditionService.getActiveExpeditionsForCharacter(
      characterId
    );

    res.json(expeditions);
  } catch (error) {
    console.error("Erreur lors de la récupération des expéditions actives:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getAllExpeditions = async (req: Request, res: Response) => {
  try {
    const includeReturned = req.query.includeReturned === 'true';
    const expeditions = await expeditionService.getAllExpeditions(includeReturned);
    res.json(expeditions);
  } catch (error) {
    console.error('Error getting all expeditions:', error);
    res.status(500).json({ error: 'Failed to get expeditions' });
  }
};

export const transferFood = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, direction } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!amount || !direction) {
      return res.status(400).json({ error: "Montant et direction requis" });
    }

    if (!["to_town", "from_town"].includes(direction)) {
      return res.status(400).json({ error: "Direction invalide (to_town ou from_town)" });
    }

    await expeditionService.transferFood(
      id,
      parseInt(amount, 10),
      direction as "to_town" | "from_town"
    );

    res.status(204).send();
  } catch (error) {
    console.error("Erreur lors du transfert de nourriture:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
};

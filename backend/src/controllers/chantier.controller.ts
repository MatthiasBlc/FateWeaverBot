import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export const createChantier = async (req: Request, res: Response) => {
  try {
    const { name, cost, serverId } = req.body;
    const createdBy = req.user?.id; // Supposons que l'ID de l'utilisateur est disponible via l'authentification

    const chantier = await prisma.chantier.create({
      data: {
        name,
        cost: parseInt(cost, 10),
        serverId,
        createdBy,
        status: "PLAN",
        spendOnIt: 0,
      },
    });

    res.status(201).json(chantier);
  } catch (error) {
    console.error("Error creating chantier:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChantiersByServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    const chantiers = await prisma.chantier.findMany({
      where: { serverId },
      orderBy: {
        status: "asc",
        updatedAt: "desc",
      },
    });

    res.json(chantiers);
  } catch (error) {
    console.error("Error fetching chantiers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChantierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chantier = await prisma.chantier.findUnique({
      where: { id },
    });

    if (!chantier) {
      return res.status(404).json({ error: "Chantier not found" });
    }

    res.json(chantier);
  } catch (error) {
    console.error("Error fetching chantier:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

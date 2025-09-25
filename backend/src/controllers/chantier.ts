import { Request, Response } from "express";
import { prisma } from "../util/db";

export const createChantier = async (req: Request, res: Response) => {
  try {
    const {
      name,
      cost,
      serverId,
      discordGuildId,
      createdBy: requestCreatedBy,
    } = req.body;

    // Si c'est un appel interne (depuis le bot), on utilise le createdBy de la requête
    // Sinon, on utilise la session
    const createdBy =
      req.get("x-internal-request") === "true"
        ? requestCreatedBy
        : req.session.userId;

    if (!createdBy) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Si on a un discordGuildId, on doit d'abord récupérer l'ID interne du serveur
    let internalServerId = serverId;
    if (discordGuildId && !serverId) {
      const server = await prisma.server.findUnique({
        where: { discordGuildId },
        select: { id: true },
      });

      if (!server) {
        return res.status(404).json({ error: "Serveur non trouvé" });
      }
      internalServerId = server.id;
    }

    if (!internalServerId) {
      return res.status(400).json({ error: "ID de serveur manquant" });
    }

    // Vérifier si un chantier avec le même nom existe déjà sur ce serveur
    const existingChantier = await prisma.chantier.findFirst({
      where: {
        name,
        serverId: internalServerId,
      },
    });

    if (existingChantier) {
      return res
        .status(400)
        .json({ error: "Un chantier avec ce nom existe déjà sur ce serveur" });
    }

    const chantier = await prisma.chantier.create({
      data: {
        name,
        cost: parseInt(cost, 10),
        serverId: internalServerId,
        createdBy,
        status: "PLAN",
        spendOnIt: 0,
      },
    });

    res.status(201).json(chantier);
  } catch (error) {
    console.error("Erreur lors de la création du chantier:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getChantiersByServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    // Vérifier si c'est un ID Discord (commence par un chiffre et a une longueur de 17 à 19 caractères)
    const isDiscordId = /^\d{17,19}$/.test(serverId);

    let whereClause = {};

    if (isDiscordId) {
      // Si c'est un ID Discord, on doit d'abord trouver l'ID interne du serveur
      const server = await prisma.server.findUnique({
        where: { discordGuildId: serverId },
        select: { id: true },
      });

      if (!server) {
        return res.status(404).json({ error: "Serveur non trouvé" });
      }

      whereClause = { serverId: server.id };
    } else {
      // Sinon, on utilise directement l'ID fourni
      whereClause = { serverId };
    }

    const chantiers = await prisma.chantier.findMany({
      where: whereClause,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    res.json(chantiers);
  } catch (error) {
    console.error("Erreur lors de la récupération des chantiers:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getChantierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chantier = await prisma.chantier.findUnique({
      where: { id },
    });

    if (!chantier) {
      return res.status(404).json({ error: "Chantier non trouvé" });
    }

    res.json(chantier);
  } catch (error) {
    console.error("Erreur lors de la récupération du chantier:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const deleteChantier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier si le chantier existe
    const chantier = await prisma.chantier.findUnique({
      where: { id },
    });

    if (!chantier) {
      return res.status(404).json({ error: "Chantier non trouvé" });
    }

    // Supprimer le chantier
    await prisma.chantier.delete({
      where: { id },
    });

    res.status(200).json({ message: "Chantier supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du chantier:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression du chantier" });
  }
};

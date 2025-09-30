import { Request, Response } from "express";
import { prisma } from "../util/db";
import { actionPointService } from "../services/action-point.service";

export const createChantier = async (req: Request, res: Response) => {
  try {
    const {
      name,
      cost,
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

    const existingChantier = await prisma.chantier.findFirst({
      where: {
        name,
        townId: internalTownId,
      },
    });

    if (existingChantier) {
      return res.status(400).json({
        error: "Un chantier avec ce nom existe déjà dans cette ville",
      });
    }

    const chantier = await prisma.chantier.create({
      data: {
        name,
        cost: parseInt(cost, 10),
        town: { connect: { id: internalTownId } },
        createdBy,
      },
    });

    res.status(201).json(chantier);
  } catch (error) {
    console.error("Erreur lors de la création du chantier:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getChantiersByGuild = async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const isDiscordId = /^\d{17,19}$/.test(guildId);

    let whereClause = {};

    if (isDiscordId) {
      const guild = await prisma.guild.findUnique({
        where: { discordGuildId: guildId },
        select: { town: { select: { id: true } } },
      });

      if (!guild || !guild.town) {
        return res.status(404).json({ error: "Guilde ou ville non trouvée" });
      }
      whereClause = { townId: guild.town.id };
    } else {
      whereClause = { townId: guildId };
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
    const chantier = await prisma.chantier.findUnique({ where: { id } });

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
    await prisma.chantier.delete({ where: { id } });
    res.status(200).json({ message: "Chantier supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du chantier:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const investInChantier = async (req: Request, res: Response) => {
  try {
    const { chantierId } = req.params;
    const { characterId, points } = req.body;

    if (!characterId || !points || points <= 0) {
      return res.status(400).json({ error: "Données d'investissement invalides" });
    }

    const chantier = await prisma.chantier.findUnique({ where: { id: chantierId } });

    if (!chantier) {
      return res.status(404).json({ error: "Chantier non trouvé" });
    }

    if (chantier.status === "COMPLETED") {
      return res.status(400).json({ error: "Ce chantier est déjà terminé" });
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }

    if (character.isDead) {
      return res.status(400).json({ error: "Ce personnage est mort" });
    }

    await actionPointService.getAvailablePoints(characterId);
    const updatedCharacter = await prisma.character.findUnique({ where: { id: characterId } });

    if (!updatedCharacter || updatedCharacter.paTotal < points) {
      return res.status(400).json({ error: "Points d'action insuffisants" });
    }

    const maxInvestable = chantier.cost - chantier.spendOnIt;
    const pointsToInvest = Math.min(points, maxInvestable, updatedCharacter.paTotal);

    if (pointsToInvest <= 0) {
      return res.status(400).json({ error: "Impossible d'investir" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: characterId },
        data: { paTotal: { decrement: pointsToInvest } },
      });

      return await tx.chantier.update({
        where: { id: chantierId },
        data: {
          spendOnIt: { increment: pointsToInvest },
          status: chantier.spendOnIt + pointsToInvest >= chantier.cost ? "COMPLETED" : "IN_PROGRESS",
          startDate: chantier.startDate || new Date(),
        },
      });
    });

    res.json({
      success: true,
      chantier: result,
      pointsInvested: pointsToInvest,
      remainingPoints: updatedCharacter.paTotal - pointsToInvest,
      isCompleted: result.status === "COMPLETED",
    });
  } catch (error) {
    console.error("Erreur lors de l'investissement:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
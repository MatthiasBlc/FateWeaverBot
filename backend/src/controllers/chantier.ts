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

    // Si c'est un appel interne (depuis le bot), on utilise le createdBy de la requête
    // Sinon, on utilise la session
    const createdBy =
      req.get("x-internal-request") === "true"
        ? requestCreatedBy
        : req.session.userId;

    if (!createdBy) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Si on a un discordGuildId, on doit d'abord récupérer l'ID de la ville du serveur
    let internalTownId = townId;
    if (discordGuildId && !townId) {
      const guild = await prisma.guild.findUnique({
        where: { discordGuildId },
        select: { id: true, town: { select: { id: true } } },
      });

      if (!guild) {
        return res.status(404).json({ error: "Guilde non trouvée" });
      }

      if (!guild.town) {
        return res.status(404).json({ error: "Aucune ville trouvée pour cette guilde" });
      }

      internalTownId = guild.town.id;
    }

    if (!internalTownId) {
      return res.status(400).json({ error: "ID de ville manquant" });
    }

    // Vérifier si un chantier avec le même nom existe déjà dans cette ville
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
        townId: internalTownId,
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

export const getChantiersByGuild = async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;

    // Vérifier si c'est un ID Discord (commence par un chiffre et a une longueur de 17 à 19 caractères)
    const isDiscordId = /^\d{17,19}$/.test(guildId);

    let whereClause = {};

    if (isDiscordId) {
      // Si c'est un ID Discord, on doit d'abord trouver la ville du serveur
      const guild = await prisma.guild.findUnique({
        where: { discordGuildId: guildId },
        select: { id: true, town: { select: { id: true } } },
      });

      if (!guild) {
        return res.status(404).json({ error: "Guilde non trouvée" });
      }

      if (!guild.town) {
        return res.status(404).json({ error: "Aucune ville trouvée pour cette guilde" });
      }

      whereClause = { townId: guild.town.id };
    } else {
      // Si c'est un ID de ville direct, on l'utilise
      whereClause = { townId: guildId };
    }

    const chantiers = await prisma.chantier.findMany({
      where: whereClause,
      include: {
        town: {
          include: {
            guild: true,
          },
        },
      },
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

/**
 * Investit des points d'action dans un chantier
 */
export const investInChantier = async (req: Request, res: Response) => {
  try {
    const { chantierId } = req.params;
    const { characterId, points } = req.body;

    if (!characterId || !points || points <= 0) {
      return res
        .status(400)
        .json({ error: "Données d'investissement invalides" });
    }

    // Vérifier si le chantier existe
    const chantier = await prisma.chantier.findUnique({
      where: { id: chantierId },
      include: { town: { include: { guild: true } } },
    });

    if (!chantier) {
      return res.status(404).json({ error: "Chantier non trouvé" });
    }

    // Vérifier si le chantier est déjà terminé
    if (chantier.status === "COMPLETED") {
      return res.status(400).json({ error: "Ce chantier est déjà terminé" });
    }

    // Vérifier si le personnage existe et a assez de points
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }

    // Vérifier si le personnage est mort (ne peut plus agir)
    if (character.hungerLevel >= 4) {
      return res.status(400).json({
        error: "Ce personnage est mort et ne peut plus investir dans les chantiers",
      });
    }

    // Mettre à jour les points du personnage avant de vérifier
    await actionPointService.getAvailablePoints(characterId);
    const updatedCharacter = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!updatedCharacter || updatedCharacter.paTotal < points) {
      return res.status(400).json({
        error: "Points d'action insuffisants",
        availablePoints: updatedCharacter?.paTotal || 0,
        requiredPoints: points,
      });
    }

    // Calculer le nombre de points qu'on peut réellement investir
    const maxInvestable = chantier.cost - chantier.spendOnIt;
    const pointsToInvest = Math.min(
      points,
      maxInvestable,
      updatedCharacter.paTotal
    );

    if (pointsToInvest <= 0) {
      return res.status(400).json({
        error: "Impossible d'investir dans ce chantier",
        reason:
          maxInvestable <= 0
            ? "Le chantier est déjà terminé"
            : "Pas assez de points d'action",
      });
    }

    // Effectuer la transaction pour mettre à jour le chantier et les points du personnage
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour les points du personnage
      await tx.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: pointsToInvest },
          updatedAt: new Date(),
        },
      });

      // Mettre à jour le chantier
      const updatedChantier = await tx.chantier.update({
        where: { id: chantierId },
        data: {
          spendOnIt: { increment: pointsToInvest },
          status:
            chantier.spendOnIt + pointsToInvest >= chantier.cost
              ? "COMPLETED"
              : "IN_PROGRESS",
          startDate: chantier.startDate || new Date(),
          updatedAt: new Date(),
        },
      });

      return updatedChantier;
    });

    res.json({
      success: true,
      chantier: result,
      pointsInvested: pointsToInvest,
      remainingPoints: updatedCharacter.paTotal - pointsToInvest,
      isCompleted: result.status === "COMPLETED",
    });
  } catch (error) {
    console.error("Erreur lors de l'investissement dans le chantier:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'investissement" });
  }
};

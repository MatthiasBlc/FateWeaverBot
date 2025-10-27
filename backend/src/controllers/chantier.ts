import { Request, Response, NextFunction } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { prisma } from "../util/db";
import { actionPointService } from "../services/action-point.service";
import { chantierService } from "../services/chantier.service";
import { logger } from "../services/logger";
import { validateCanUsePA } from "../util/character-validators";
import { ChantierQueries } from "../infrastructure/database/query-builders/chantier.queries";
import { CharacterQueries } from "../infrastructure/database/query-builders/character.queries";

export const createChantier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      cost,
      townId,
      discordGuildId,
      createdBy: requestCreatedBy,
      completionText,
      resourceCosts, // Optional: [{ resourceTypeId: number, quantity: number }]
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

    const chantier = await chantierService.createChantier({
      name,
      cost: parseInt(cost, 10),
      townId: internalTownId,
      createdBy,
      completionText: completionText || undefined,
      resourceCosts: resourceCosts || undefined,
    });

    // Fetch full chantier with resource costs
    const fullChantier = await chantierService.getChantierById(chantier.id);

    res.status(201).json(fullChantier);
  } catch (error) {
    logger.error("Error creating chantier", { error });
    next(error);
  }
};

export const getChantiersByGuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { guildId } = req.params;
    const isDiscordId = /^\d{17,19}$/.test(guildId);

    let townId: string;

    if (isDiscordId) {
      const guild = await prisma.guild.findUnique({
        where: { discordGuildId: guildId },
        select: { town: { select: { id: true } } },
      });

      if (!guild || !guild.town) {
        return res.status(404).json({ error: "Guilde ou ville non trouvée" });
      }
      townId = guild.town.id;
    } else {
      townId = guildId;
    }

    const chantiers = await chantierService.getChantiersByTown(townId);

    res.json(chantiers);
  } catch (error) {
    logger.error("Error fetching chantiers", { error });
    next(error);
  }
};

export const getChantierById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const chantier = await chantierService.getChantierById(id);

    if (!chantier) {
      return res.status(404).json({ error: "Chantier non trouvé" });
    }

    res.json(chantier);
  } catch (error) {
    logger.error("Error fetching chantier", { error });
    next(error);
  }
};

export const deleteChantier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.chantier.delete({ where: { id } });
    res.status(200).json({ message: "Chantier supprimé avec succès" });
  } catch (error) {
    next(error);
  }
};

export const investInChantier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chantierId } = req.params;
    const { characterId, points } = req.body;

    if (!characterId || !points || points <= 0) {
      return res.status(400).json({ error: "Données d'investissement invalides" });
    }

    const chantier = await prisma.chantier.findUnique({
      where: { id: chantierId },
      ...ChantierQueries.withResourceCosts(),
    });

    if (!chantier) {
      return res.status(404).json({ error: "Chantier non trouvé" });
    }

    if (chantier.status === "COMPLETED") {
      return res.status(400).json({ error: "Ce chantier est déjà terminé" });
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      ...CharacterQueries.withExpeditions(),
    });

    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }

    if (character.isDead) {
      return res.status(400).json({ error: "Ce personnage est mort" });
    }

    // Block if character is in a DEPARTED expedition
    const inDepartedExpedition = character.expeditionMembers.some(
      (em) => em.expedition.status === "DEPARTED"
    );

    if (inDepartedExpedition) {
      return res.status(400).json({
        error: "Tu es en expédition et ne peux pas accéder aux chantiers de la ville",
      });
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

    // Validate PA usage restrictions (Agonie, Déprime, Dépression)
    try {
      validateCanUsePA(updatedCharacter, pointsToInvest);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: pointsToInvest },
          paUsedToday: { increment: pointsToInvest },
        },
      });

      // Check if all resources are complete
      const allResourcesComplete = chantier.resourceCosts.every(
        (rc) => rc.quantityContributed >= rc.quantityRequired
      );
      const paComplete = chantier.spendOnIt + pointsToInvest >= chantier.cost;
      const isCompleted = allResourcesComplete && paComplete;

      return await tx.chantier.update({
        where: { id: chantierId },
        data: {
          spendOnIt: { increment: pointsToInvest },
          status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
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
    logger.error("Error investing in chantier", { error });
    next(error);
  }
};

export const contributeResources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { characterId, contributions } = req.body;

    // Validate request body
    if (!characterId) {
      return res.status(400).json({ error: "characterId est requis" });
    }

    if (!contributions || !Array.isArray(contributions) || contributions.length === 0) {
      return res.status(400).json({
        error: "contributions doit être un tableau non-vide d'objets { resourceTypeId, quantity }",
      });
    }

    // Validate each contribution
    for (const contribution of contributions) {
      if (
        typeof contribution.resourceTypeId !== "number" ||
        typeof contribution.quantity !== "number" ||
        contribution.quantity <= 0
      ) {
        return res.status(400).json({
          error: "Chaque contribution doit avoir resourceTypeId (number) et quantity (number > 0)",
        });
      }
    }

    // Call service
    const updatedChantier = await chantierService.contributeResources(
      id,
      characterId,
      contributions
    );

    res.status(200).json({
      success: true,
      chantier: updatedChantier,
    });
  } catch (error) {
    logger.error("Error contributing resources to chantier", { error });

    // Check if error is a known business logic error
    if (error instanceof Error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("not require") ||
        error.message.includes("not in the same town")
      ) {
        return res.status(404).json({ error: error.message });
      }

      if (
        error.message.includes("already completed") ||
        error.message.includes("is dead") ||
        error.message.includes("Not enough") ||
        error.message.includes("Cannot contribute") ||
        error.message.includes("must be positive")
      ) {
        return res.status(400).json({ error: error.message });
      }
    }

    next(error);
  }
};
import { Request, Response, NextFunction } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { actionPointService } from "../services/action-point.service";
import { prisma } from "../util/db";

export class ActionPointController {
  /**
   * Récupère le nombre de points d'action disponibles pour un personnage
   */
  async getPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const { characterId } = req.params;
      if (!characterId) {
        throw new BadRequestError("L'ID du personnage est requis");
      }

      const character = await prisma.character.findUnique({
        where: { id: characterId },
        select: {
          id: true,
          paTotal: true,
          lastPaUpdate: true,
        },
      });

      if (!character) {
        throw new NotFoundError("Personnage", characterId);
      }

      return res.json({
        points: character.paTotal,
        lastUpdated: character.lastPaUpdate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Utilise un point d'action pour un personnage
   */
  async usePoint(req: Request, res: Response, next: NextFunction) {
    try {
      const { characterId } = req.params;
      if (!characterId) {
        throw new BadRequestError("L'ID du personnage est requis");
      }

      // Vérifier que l'utilisateur est bien propriétaire du personnage
      const character = await prisma.character.findUnique({
        where: { id: characterId, userId: req.session.userId },
      });

      if (!character) {
        throw new NotFoundError("Personnage", characterId);
      }

      const updatedCharacter = await actionPointService.useActionPoint(
        characterId
      );
      return res.json({
        success: true,
        remainingPoints: updatedCharacter.paTotal,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const actionPointController = new ActionPointController();

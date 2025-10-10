import { Request, Response } from "express";
import { actionPointService } from "../services/action-point.service";
import { prisma } from "../util/db";

export class ActionPointController {
  /**
   * Récupère le nombre de points d'action disponibles pour un personnage
   */
  async getPoints(req: Request, res: Response) {
    try {
      const { characterId } = req.params;
      if (!characterId) {
        return res.status(400).json({ error: "L'ID du personnage est requis" });
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
        return res.status(404).json({ error: "Personnage non trouvé" });
      }

      return res.json({
        points: character.paTotal,
        lastUpdated: character.lastPaUpdate,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des points:", error);
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }
  }

  /**
   * Utilise un point d'action pour un personnage
   */
  async usePoint(req: Request, res: Response) {
    try {
      const { characterId } = req.params;
      if (!characterId) {
        return res.status(400).json({ error: "L'ID du personnage est requis" });
      }

      // Vérifier que l'utilisateur est bien propriétaire du personnage
      const character = await prisma.character.findUnique({
        where: { id: characterId, userId: req.session.userId },
      });

      if (!character) {
        return res
          .status(404)
          .json({ error: "Personnage non trouvé ou accès non autorisé" });
      }

      const updatedCharacter = await actionPointService.useActionPoint(
        characterId
      );
      return res.json({
        success: true,
        remainingPoints: updatedCharacter.paTotal,
      });
    } catch (error) {
      console.error("Erreur lors de l'utilisation du point d'action:", error);
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }
  }
}

export const actionPointController = new ActionPointController();

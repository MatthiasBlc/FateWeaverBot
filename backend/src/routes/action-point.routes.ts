import { Router } from "express";
import { actionPointController } from "../controllers/action-point";
import { requireAuthOrInternal } from "../middleware/auth";

const router = Router();

/**
 * @route GET /api/action-points/:characterId
 * @description Récupère le nombre de points d'action disponibles pour un personnage
 * @access Privé (propriétaire du personnage)
 */
router.get(
  "/:characterId",
  requireAuthOrInternal,
  actionPointController.getPoints.bind(actionPointController)
);

/**
 * @route POST /api/action-points/:characterId/use
 * @description Utilise un point d'action pour un personnage
 * @access Privé (propriétaire du personnage)
 */
router.post(
  "/:characterId/use",
  requireAuthOrInternal,
  actionPointController.usePoint.bind(actionPointController)
);

export default router;

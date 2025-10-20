import { Router } from "express";
import { actionPointController } from "../controllers/action-point";
import { requireAuthOrInternal } from "../middleware/auth";
import { validate } from "../api/middleware/validation.middleware";
import {
  GetActionPointsSchema,
  UseActionPointSchema
} from "../api/validators/action-point.schema";

const router = Router();

/**
 * @route GET /api/action-points/:characterId
 * @description Récupère le nombre de points d'action disponibles pour un personnage
 * @access Public (pour le bot Discord)
 */
router.get("/:characterId", validate(GetActionPointsSchema), actionPointController.getPoints.bind(actionPointController));

/**
 * @route POST /api/action-points/:characterId/use
 * @description Utilise un point d'action pour un personnage
 * @access Privé (propriétaire du personnage)
 */
router.post(
  "/:characterId/use",
  requireAuthOrInternal,
  validate(UseActionPointSchema),
  actionPointController.usePoint.bind(actionPointController)
);

export default router;

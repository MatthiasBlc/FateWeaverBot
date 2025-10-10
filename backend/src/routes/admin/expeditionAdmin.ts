import { Router } from "express";
import { requireAuthOrInternal } from "../../middleware/auth";
import {
  getAllExpeditions,
  modifyExpedition,
  forceReturnExpedition,
  lockExpedition,
  departExpedition,
  addMemberToExpedition,
  removeMemberFromExpedition,
} from "../../controllers/admin/expeditionAdmin";

const router = Router();

// Récupérer toutes les expéditions (avec filtres optionnels)
router.get("/", requireAuthOrInternal, getAllExpeditions);

// Modifier une expédition (durée, stock de nourriture)
router.patch("/:id", requireAuthOrInternal, modifyExpedition);

// Retour forcé d'une expédition
router.post("/:id/force-return", requireAuthOrInternal, forceReturnExpedition);

// Verrouiller une expédition (passage de PLANNING à LOCKED)
router.post("/:id/lock", requireAuthOrInternal, lockExpedition);

// Départ d'une expédition (passage de LOCKED à DEPARTED)
router.post("/:id/depart", requireAuthOrInternal, departExpedition);

// Ajouter un membre à une expédition
router.post("/:id/members", requireAuthOrInternal, addMemberToExpedition);

// Retirer un membre d'une expédition
router.delete("/:id/members/:characterId", requireAuthOrInternal, removeMemberFromExpedition);

export default router;

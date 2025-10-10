import { Router } from "express";
import { requireAuthOrInternal } from "../middleware/auth";
import {
  createExpedition,
  getExpeditionById,
  getExpeditionsByTown,
  getActiveExpeditionsForCharacter,
  getAllExpeditions,
  joinExpedition,
  leaveExpedition,
  transferExpeditionResource,
  toggleEmergencyVote,
} from "../controllers/expedition";

const router = Router();

// Créer une nouvelle expédition
router.post("/", requireAuthOrInternal, createExpedition);

// Récupérer toutes les expéditions
router.get("/", requireAuthOrInternal, getAllExpeditions);

// Récupérer une expédition par son ID
router.get("/:id", requireAuthOrInternal, getExpeditionById);

// Récupérer toutes les expéditions d'une ville
router.get("/town/:townId", requireAuthOrInternal, getExpeditionsByTown);

// Rejoindre une expédition
router.post("/:id/join", requireAuthOrInternal, joinExpedition);

// Quitter une expédition
router.post("/:id/leave", requireAuthOrInternal, leaveExpedition);

// Récupérer les expéditions actives d'un personnage
router.get(
  "/character/:characterId/active",
  requireAuthOrInternal,
  getActiveExpeditionsForCharacter
);

// Récupérer toutes les expéditions
router.get("/", requireAuthOrInternal, getAllExpeditions);

// Transférer des ressources (ville <-> expédition)
router.post("/:id/transfer", requireAuthOrInternal, transferExpeditionResource);

// Toggle vote pour retour d'urgence
router.post("/:id/emergency-vote", requireAuthOrInternal, toggleEmergencyVote);

export default router;

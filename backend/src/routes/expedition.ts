import { Router } from "express";
import { requireAuthOrInternal } from "../middleware/auth";
import {
  createExpedition,
  getExpeditionById,
  getExpeditionsByTown,
  joinExpedition,
  leaveExpedition,
  transferFood,
} from "../controllers/expedition";

const router = Router();

// Créer une nouvelle expédition
router.post("/", requireAuthOrInternal, createExpedition);

// Récupérer une expédition par son ID
router.get("/:id", requireAuthOrInternal, getExpeditionById);

// Récupérer toutes les expéditions d'une ville
router.get("/town/:townId", requireAuthOrInternal, getExpeditionsByTown);

// Rejoindre une expédition
router.post("/:id/join", requireAuthOrInternal, joinExpedition);

// Quitter une expédition
router.post("/:id/leave", requireAuthOrInternal, leaveExpedition);

// Transférer de la nourriture (ville <-> expédition)
router.post("/:id/transfer", requireAuthOrInternal, transferFood);

export default router;

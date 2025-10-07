import express from "express";
import {
  upsertTown,
  getTownByGuildId,
  getTownById,
  getAllTowns,
  updateTownFoodStock as updateTownVivresStock,
} from "../controllers/towns";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Crée ou met à jour une ville (principalement utilisé en interne)
router.post("/", requireAuthOrInternal, upsertTown);

// Récupère une ville par l'ID Discord de sa guilde
router.get("/guild/:guildId", requireAuthOrInternal, getTownByGuildId);

// Récupère une ville par son ID
router.get("/:id", requireAuthOrInternal, getTownById);

// Met à jour le stock de vivres d'une ville
router.patch("/:id/vivres-stock", requireAuthOrInternal, updateTownVivresStock);

// Récupère toutes les villes
router.get("/", requireAuthOrInternal, getAllTowns);

export default router;

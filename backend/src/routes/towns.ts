import express from "express";
import {
  upsertCity,
  getTownByGuildId,
  getTownById,
  getAllTowns,
  updateTownFoodStock,
} from "../controllers/towns";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Crée ou met à jour une ville (principalement utilisé en interne)
router.post("/", requireAuthOrInternal, upsertCity);

// Récupère une ville par l'ID de sa guilde
router.get("/guild/:guildId", requireAuthOrInternal, getTownByGuildId);

// Récupère une ville par son ID
router.get("/:id", requireAuthOrInternal, getTownById);

// Met à jour le stock de foodstock d'une ville
router.patch("/:id/food-stock", requireAuthOrInternal, updateTownFoodStock);

// Récupère toutes les villes
router.get("/", requireAuthOrInternal, getAllTowns);

export default router;

import express from "express";
import * as SeasonController from "../controllers/seasons";

const router = express.Router();

/**
 * Récupère la saison actuelle
 */
router.get("/current", SeasonController.getCurrentSeason);

/**
 * Définit une nouvelle saison
 */
router.post("/set", SeasonController.setSeason);

/**
 * Vérifie si la saison a changé récemment (pour les notifications)
 */
router.get("/check-change", SeasonController.checkSeasonChange);

export default router;

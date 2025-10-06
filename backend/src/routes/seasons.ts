import express from "express";
import * as SeasonController from "../controllers/seasons";

const router = express.Router();

/**
 * Récupère la saison actuelle
 */
router.get("/current", SeasonController.getCurrentSeason);

export default router;

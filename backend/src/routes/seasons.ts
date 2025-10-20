import express from "express";
import * as SeasonController from "../controllers/seasons";
import { validate } from "../api/middleware/validation.middleware";
import { SetSeasonSchema } from "../api/validators/season.schema";

const router = express.Router();

/**
 * Récupère la saison actuelle
 */
router.get("/current", SeasonController.getCurrentSeason);

/**
 * Définit une nouvelle saison
 */
router.post("/set", validate(SetSeasonSchema), SeasonController.setSeason);

export default router;

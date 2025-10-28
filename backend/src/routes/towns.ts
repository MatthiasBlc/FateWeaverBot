import express from "express";
import {
  upsertTown,
  getTownByGuildId,
  getTownById,
  getAllTowns,
  updateTownFoodStock as updateTownVivresStock,
  getTownWeather,
  getTownActionsRecap,
  getTownStocksSummary,
  getTownExpeditionsSummary,
} from "../controllers/towns";
import { requireAuthOrInternal } from "../middleware/auth";
import { validate } from "../api/middleware/validation.middleware";
import {
  UpsertTownSchema,
  GetTownByGuildIdSchema,
  GetTownByIdSchema,
  UpdateTownVivresStockSchema,
  GetTownWeatherSchema,
  GetTownActionsRecapSchema,
  GetTownStocksSummarySchema,
  GetTownExpeditionsSummarySchema
} from "../api/validators/town.schema";

const router = express.Router();

// Crée ou met à jour une ville (principalement utilisé en interne)
router.post("/", requireAuthOrInternal, validate(UpsertTownSchema), upsertTown);

// Récupère une ville par l'ID Discord de sa guilde
router.get("/guild/:guildId", requireAuthOrInternal, validate(GetTownByGuildIdSchema), getTownByGuildId);

// Récupère une ville par son ID
router.get("/:id", requireAuthOrInternal, validate(GetTownByIdSchema), getTownById);

// Met à jour le stock de vivres d'une ville
router.patch("/:id/vivres-stock", requireAuthOrInternal, validate(UpdateTownVivresStockSchema), updateTownVivresStock);

// Récupère la météo du jour pour une ville
router.get("/:id/weather", requireAuthOrInternal, validate(GetTownWeatherSchema), getTownWeather);

// Récupère le récapitulatif des activités de la veille
router.get("/:id/actions-recap", requireAuthOrInternal, validate(GetTownActionsRecapSchema), getTownActionsRecap);

// Récupère un résumé des stocks de la ville
router.get("/:id/stocks-summary", requireAuthOrInternal, validate(GetTownStocksSummarySchema), getTownStocksSummary);

// Récupère un résumé des expéditions en cours
router.get("/:id/expeditions-summary", requireAuthOrInternal, validate(GetTownExpeditionsSummarySchema), getTownExpeditionsSummary);

// Récupère toutes les villes
router.get("/", requireAuthOrInternal, getAllTowns);

export default router;

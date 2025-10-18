import express from "express";
import {
  getAllCapabilities,
  createCapability,
  executeCouperDuBois,
  executeMiner,
  executeFish,
  executeCraft,
  executeSoigner,
  executeResearch,
  executeDivertir,
  executeHarvest,
  getCataplasmeCount,
} from "../controllers/capabilities";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Récupère toutes les capacités disponibles
router.get("/", requireAuthOrInternal, getAllCapabilities);

// Crée une nouvelle capacité
router.post("/", requireAuthOrInternal, createCapability);

// Récupère le nombre de cataplasmes pour une ville
router.get("/cataplasme-count/:townId", requireAuthOrInternal, getCataplasmeCount);

// Exécuter des capacités spécifiques
router.post("/:characterId/couper-du-bois", requireAuthOrInternal, executeCouperDuBois);
router.post("/:characterId/miner", requireAuthOrInternal, executeMiner);
router.post("/:characterId/pecher", requireAuthOrInternal, executeFish);
router.post("/:characterId/harvest", requireAuthOrInternal, executeHarvest);
router.post("/:characterId/craft", requireAuthOrInternal, executeCraft);
router.post("/:characterId/soigner", requireAuthOrInternal, executeSoigner);
router.post("/:characterId/research", requireAuthOrInternal, executeResearch);
router.post("/:characterId/divertir", requireAuthOrInternal, executeDivertir);

export default router;

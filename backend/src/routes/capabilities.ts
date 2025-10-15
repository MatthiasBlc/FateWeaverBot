import express from "express";
import {
  getAllCapabilities,
  createCapability,
  executeBûcheronner,
  executeMiner,
  executeFish,
  executeCraft,
  executeSoigner,
  executeResearch,
  executeDivertir,
  executeHarvest,
} from "../controllers/capabilities";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Récupère toutes les capacités disponibles
router.get("/", requireAuthOrInternal, getAllCapabilities);

// Crée une nouvelle capacité
router.post("/", requireAuthOrInternal, createCapability);

// Exécuter des capacités spécifiques
router.post("/:characterId/bucheronner", requireAuthOrInternal, executeBûcheronner);
router.post("/:characterId/miner", requireAuthOrInternal, executeMiner);
router.post("/:characterId/pecher", requireAuthOrInternal, executeFish);
router.post("/:characterId/harvest", requireAuthOrInternal, executeHarvest);
router.post("/:characterId/craft", requireAuthOrInternal, executeCraft);
router.post("/:characterId/soigner", requireAuthOrInternal, executeSoigner);
router.post("/:characterId/research", requireAuthOrInternal, executeResearch);
router.post("/:characterId/divertir", requireAuthOrInternal, executeDivertir);

export default router;

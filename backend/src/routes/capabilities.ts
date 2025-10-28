import express from "express";
import {
  getAllCapabilities,
  createCapability,
  updateCapability,
  deleteCapability,
  executeCouperDuBois,
  executeMiner,
  executeFish,
  executeCraft,
  executeSoigner,
  executeResearch,
  executeDivertir,
  executeHarvest,
  getCataplasmeCount,
  getCataplasmeStock,
} from "../controllers/capabilities";
import { requireAuthOrInternal } from "../middleware/auth";
import { validate } from "../api/middleware/validation.middleware";
import {
  CreateCapabilitySchema,
  GetCataplasmeCountSchema,
  ExecuteCouperDuBoisSchema,
  ExecuteMinerSchema,
  ExecuteFishSchema,
  ExecuteHarvestSchema,
  ExecuteCraftSchema,
  ExecuteSoignerSchema,
  ExecuteResearchSchema,
  ExecuteDivertirSchema
} from "../api/validators/capability.schema";

const router = express.Router();

// Récupère toutes les capacités disponibles
router.get("/", requireAuthOrInternal, getAllCapabilities);

// Crée une nouvelle capacité
router.post("/", requireAuthOrInternal, validate(CreateCapabilitySchema), createCapability);

// Met à jour une capacité
router.patch("/:id", requireAuthOrInternal, updateCapability);

// Supprime une capacité
router.delete("/:id", requireAuthOrInternal, deleteCapability);

// Récupère le nombre de cataplasmes pour une ville
router.get("/cataplasme-count/:townId", requireAuthOrInternal, validate(GetCataplasmeCountSchema), getCataplasmeCount);

// Récupère le stock de cataplasmes disponibles pour un personnage
router.get("/cataplasme-stock/:characterId", requireAuthOrInternal, getCataplasmeStock);

// Exécuter des capacités spécifiques
router.post("/:characterId/couper-du-bois", requireAuthOrInternal, validate(ExecuteCouperDuBoisSchema), executeCouperDuBois);
router.post("/:characterId/miner", requireAuthOrInternal, validate(ExecuteMinerSchema), executeMiner);
router.post("/:characterId/pecher", requireAuthOrInternal, validate(ExecuteFishSchema), executeFish);
router.post("/:characterId/harvest", requireAuthOrInternal, validate(ExecuteHarvestSchema), executeHarvest);
router.post("/:characterId/craft", requireAuthOrInternal, validate(ExecuteCraftSchema), executeCraft);
router.post("/:characterId/soigner", requireAuthOrInternal, validate(ExecuteSoignerSchema), executeSoigner);
router.post("/:characterId/research", requireAuthOrInternal, validate(ExecuteResearchSchema), executeResearch);
router.post("/:characterId/divertir", requireAuthOrInternal, validate(ExecuteDivertirSchema), executeDivertir);

export default router;

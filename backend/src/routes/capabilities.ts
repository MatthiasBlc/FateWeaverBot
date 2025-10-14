import express from "express";
import { getAllCapabilities, createCapability } from "../controllers/capabilities";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Récupère toutes les capacités disponibles
router.get("/", requireAuthOrInternal, getAllCapabilities);

// Crée une nouvelle capacité
router.post("/", requireAuthOrInternal, createCapability);

export default router;

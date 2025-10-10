import express from "express";
import { getAllCapabilities } from "../controllers/capabilities";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Récupère toutes les capacités disponibles
router.get("/", requireAuthOrInternal, getAllCapabilities);

export default router;

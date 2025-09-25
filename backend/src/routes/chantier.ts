import { Router } from "express";
import { requireAuthOrInternal } from "../middleware/auth";
import {
  createChantier,
  getChantiersByServer,
  getChantierById,
  deleteChantier,
  investInChantier,
} from "../controllers/chantier";

const router = Router();

// Créer un nouveau chantier
router.post("/", requireAuthOrInternal, createChantier);

// Récupérer tous les chantiers d'un serveur
router.get("/server/:serverId", requireAuthOrInternal, getChantiersByServer);

// Récupérer un chantier par son ID
router.get("/:id", requireAuthOrInternal, getChantierById);

// Supprimer un chantier
router.delete("/:id", requireAuthOrInternal, deleteChantier);

// Investir des points d'action dans un chantier
router.post("/:chantierId/invest", requireAuthOrInternal, investInChantier);

export default router;

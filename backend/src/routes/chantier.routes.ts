import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createChantier,
  getChantiersByServer,
  getChantierById,
} from "../controllers/chantier.controller";

const router = Router();

// Créer un nouveau chantier
router.post("/", authenticateToken, createChantier);

// Récupérer tous les chantiers d'un serveur
router.get("/server/:serverId", authenticateToken, getChantiersByServer);

// Récupérer un chantier par son ID
router.get("/:id", authenticateToken, getChantierById);

export default router;

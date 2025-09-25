import express from "express";
import {
  upsertServer,
  getServerByDiscordId,
  getAllServers,
  deleteServer,
} from "../controllers/servers";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Crée ou met à jour un serveur
router.post("/", requireAuthOrInternal, upsertServer);

// Récupère un serveur par son ID Discord
router.get("/discord/:discordId", requireAuthOrInternal, getServerByDiscordId);

// Récupère tous les serveurs
router.get("/", requireAuthOrInternal, getAllServers);

// Supprime un serveur et toutes ses données associées
router.delete("/:id", requireAuthOrInternal, deleteServer);

export default router;

import express from "express";
import * as ServerController from "../controllers/servers";

const router = express.Router();

// Créer ou mettre à jour un serveur
router.post("/", ServerController.upsertServer);

// Récupérer un serveur par son ID Discord
router.get("/discord/:discordId", ServerController.getServerByDiscordId);

export default router;

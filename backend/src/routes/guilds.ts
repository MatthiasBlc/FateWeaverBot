import express from "express";
import {
  upsertGuild,
  getGuildByDiscordId,
  getGuildById,
  getAllGuilds,
  deleteGuild,
  updateGuildLogChannel,
} from "../controllers/guilds";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Crée ou met à jour une guilde
router.post("/", requireAuthOrInternal, upsertGuild);

// Récupère une guilde par son ID Discord
router.get("/discord/:discordId", requireAuthOrInternal, getGuildByDiscordId);

// Récupère une guilde par son ID interne
router.get("/:id", requireAuthOrInternal, getGuildById);

// Met à jour le salon de logs d'une guilde
router.patch(
  "/:discordId/log-channel",
  requireAuthOrInternal,
  updateGuildLogChannel
);

// Récupère toutes les guildes
router.get("/", requireAuthOrInternal, getAllGuilds);

// Supprime une guilde et toutes ses données associées
router.delete("/:id", requireAuthOrInternal, deleteGuild);

export default router;

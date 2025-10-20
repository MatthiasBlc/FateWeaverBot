import express from "express";
import {
  upsertGuild,
  getGuildByDiscordId,
  getGuildById,
  getAllGuilds,
  deleteGuild,
  updateGuildLogChannel,
  updateGuildDailyMessageChannel,
} from "../controllers/guilds";
import { requireAuthOrInternal } from "../middleware/auth";
import { validate } from "../api/middleware/validation.middleware";
import {
  UpsertGuildSchema,
  GetGuildByDiscordIdSchema,
  GetGuildByIdSchema,
  UpdateGuildLogChannelSchema,
  UpdateGuildDailyMessageChannelSchema,
  DeleteGuildSchema
} from "../api/validators/guild.schema";

const router = express.Router();

// Crée ou met à jour une guilde
router.post("/", requireAuthOrInternal, validate(UpsertGuildSchema), upsertGuild);

// Récupère une guilde par son ID Discord
router.get("/discord/:discordId", requireAuthOrInternal, validate(GetGuildByDiscordIdSchema), getGuildByDiscordId);

// Récupère une guilde par son ID interne
router.get("/:id", requireAuthOrInternal, validate(GetGuildByIdSchema), getGuildById);

// Met à jour le salon de logs d'une guilde
router.patch(
  "/:discordId/log-channel",
  requireAuthOrInternal,
  validate(UpdateGuildLogChannelSchema),
  updateGuildLogChannel
);

// Met à jour le salon des messages quotidiens d'une guilde
router.patch(
  "/:discordId/daily-message-channel",
  requireAuthOrInternal,
  validate(UpdateGuildDailyMessageChannelSchema),
  updateGuildDailyMessageChannel
);

// Récupère toutes les guildes
router.get("/", requireAuthOrInternal, getAllGuilds);

// Supprime une guilde et toutes ses données associées
router.delete("/:id", requireAuthOrInternal, validate(DeleteGuildSchema), deleteGuild);

export default router;

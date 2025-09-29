import express from "express";
import {
  upsertRole,
  getRoleByDiscordId,
  getGuildRoles,
  deleteRole,
  updateCharacterRoles,
} from "../controllers/roles";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Crée ou met à jour un rôle
router.post("/", requireAuthOrInternal, upsertRole);

// Récupère un rôle par son ID Discord et l'ID du serveur
router.get(
  "/discord/:discordId/guild/:guildId",
  requireAuthOrInternal,
  getRoleByDiscordId
);

// Récupère tous les rôles d'un serveur
router.get("/guild/:guildId", requireAuthOrInternal, getGuildRoles);

// Supprime un rôle
router.delete("/:id", requireAuthOrInternal, deleteRole);

// Met à jour les rôles d'un personnage
router.put(
  "/character/:characterId",
  requireAuthOrInternal,
  updateCharacterRoles
);

export default router;

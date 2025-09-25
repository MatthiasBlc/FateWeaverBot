import express from "express";
import {
  upsertRole,
  getRoleByDiscordId,
  getServerRoles,
  deleteRole,
  updateCharacterRoles,
} from "../controllers/roles";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Crée ou met à jour un rôle
router.post("/", requireAuthOrInternal, upsertRole);

// Récupère un rôle par son ID Discord et l'ID du serveur
router.get(
  "/discord/:discordId/server/:serverId",
  requireAuthOrInternal,
  getRoleByDiscordId
);

// Récupère tous les rôles d'un serveur
router.get("/server/:serverId", requireAuthOrInternal, getServerRoles);

// Supprime un rôle
router.delete("/:id", requireAuthOrInternal, deleteRole);

// Met à jour les rôles d'un personnage
router.put(
  "/character/:characterId",
  requireAuthOrInternal,
  updateCharacterRoles
);

export default router;

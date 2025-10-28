import express from "express";
import {
  upsertRole,
  getRoleByDiscordId,
  getGuildRoles,
  deleteRole,
  updateCharacterRoles,
} from "../controllers/roles";
import { requireAuthOrInternal } from "../middleware/auth";
import { validate } from "../api/middleware/validation.middleware";
import {
  UpsertRoleSchema,
  GetRoleByDiscordIdSchema,
  GetGuildRolesSchema,
  DeleteRoleSchema,
  UpdateCharacterRolesSchema
} from "../api/validators/role.schema";

const router = express.Router();

// Crée ou met à jour un rôle
router.post("/", requireAuthOrInternal, validate(UpsertRoleSchema), upsertRole);

// Récupère un rôle par son ID Discord et l'ID du serveur
router.get(
  "/discord/:discordId/guild/:guildId",
  requireAuthOrInternal,
  validate(GetRoleByDiscordIdSchema),
  getRoleByDiscordId
);

// Récupère tous les rôles d'un serveur
router.get("/guild/:guildId", requireAuthOrInternal, validate(GetGuildRolesSchema), getGuildRoles);

// Supprime un rôle
router.delete("/:id", requireAuthOrInternal, validate(DeleteRoleSchema), deleteRole);

// Met à jour les rôles d'un personnage
router.put(
  "/character/:characterId",
  requireAuthOrInternal,
  validate(UpdateCharacterRolesSchema),
  updateCharacterRoles
);

export default router;

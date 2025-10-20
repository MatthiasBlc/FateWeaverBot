import express from "express";
import {
  upsertUser,
  getUserByDiscordId,
  updateUserByDiscordId,
  getAllUsers,
  deleteUser,
} from "../controllers/users";
import { requireAuthOrInternal } from "../middleware/auth";
import { validate } from "../api/middleware/validation.middleware";
import {
  UpsertUserSchema,
  GetUserByDiscordIdSchema,
  UpdateUserByDiscordIdSchema,
  DeleteUserSchema
} from "../api/validators/user.schema";

const router = express.Router();

// Crée ou met à jour un utilisateur
router.post("/", validate(UpsertUserSchema), upsertUser);

// Récupère un utilisateur par son ID Discord (accessible en interne ou avec session utilisateur)
router.get("/discord/:discordId", requireAuthOrInternal, validate(GetUserByDiscordIdSchema), getUserByDiscordId);

// Met à jour un utilisateur par son ID Discord (accessible en interne ou avec session utilisateur)
router.put("/discord/:discordId", requireAuthOrInternal, validate(UpdateUserByDiscordIdSchema), updateUserByDiscordId);

// Récupère tous les utilisateurs (nécessite une authentification utilisateur)
router.get("/", requireAuthOrInternal, getAllUsers);

// Supprime un utilisateur et toutes ses données associées (nécessite une authentification utilisateur)
router.delete("/:id", requireAuthOrInternal, validate(DeleteUserSchema), deleteUser);

export default router;

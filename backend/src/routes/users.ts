import express from "express";
import {
  upsertUser,
  getUserByDiscordId,
  updateUserByDiscordId,
  getAllUsers,
  deleteUser,
} from "../controllers/users";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Crée ou met à jour un utilisateur
router.post("/", upsertUser);

// Récupère un utilisateur par son ID Discord (accessible en interne ou avec session utilisateur)
router.get("/discord/:discordId", requireAuthOrInternal, getUserByDiscordId);

// Met à jour un utilisateur par son ID Discord (accessible en interne ou avec session utilisateur)
router.put("/discord/:discordId", requireAuthOrInternal, updateUserByDiscordId);

// Récupère tous les utilisateurs (nécessite une authentification utilisateur)
router.get("/", requireAuthOrInternal, getAllUsers);

// Supprime un utilisateur et toutes ses données associées (nécessite une authentification utilisateur)
router.delete("/:id", requireAuthOrInternal, deleteUser);

export default router;

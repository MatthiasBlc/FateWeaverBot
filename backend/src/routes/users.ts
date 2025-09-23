import express from "express";
import * as UserController from "../controllers/users";

const router = express.Router();

// Routes existantes
router.get("/", UserController.getAuthenticatedUser);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);

// Routes pour le bot Discord
// Anciennes routes (conservées pour la rétrocompatibilité)
router.post("/upsert", UserController.upsertDiscordUser);
router.get("/discord/:discordId/profile", UserController.getDiscordUserProfile);

// Nouvelles routes correspondant aux attentes du bot
router.post("/", UserController.upsertDiscordUser);
router.get("/discord/:discordId", UserController.getDiscordUserProfile);
router.patch("/discord/:discordId", UserController.updateDiscordUser);

export default router;

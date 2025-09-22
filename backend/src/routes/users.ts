import express from "express";
import * as UserController from "../controllers/users";

const router = express.Router();

// Routes existantes
router.get("/", UserController.getAuthenticatedUser);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);

// Nouvelles routes pour le bot Discord
router.post("/upsert", UserController.upsertDiscordUser);
router.get("/discord/:discordId/profile", UserController.getDiscordUserProfile);

export default router;

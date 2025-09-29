import express from "express";
import * as CharacterController from "../controllers/characters";

const router = express.Router();

// Créer ou mettre à jour un personnage
router.post("/", CharacterController.upsertCharacter);

// Récupérer un personnage par son ID
router.get("/:id", CharacterController.getCharacterById);

// Récupérer un personnage par userId et guildId
router.get(
  "/user/:userId/guild/:guildId",
  CharacterController.getCharacterByDiscordIds
);

export default router;

import express from "express";
import * as CharacterController from "../controllers/characters";

const router = express.Router();

// Créer ou mettre à jour un personnage
router.post("/", CharacterController.upsertCharacter);

// Récupérer un personnage par son ID
router.get("/:id", CharacterController.getCharacterById);

// Récupérer un personnage par userId et serverId
router.get(
  "/user/:userId/server/:serverId",
  CharacterController.getCharacterByUserAndServer
);

// Récupérer tous les personnages d'un utilisateur
router.get("/user/:userId", CharacterController.getUserCharacters);

export default router;

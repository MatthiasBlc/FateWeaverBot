import express from "express";
import * as CharacterController from "../controllers/characters";

const router = express.Router();

// Créer ou mettre à jour un personnage
router.post("/", CharacterController.upsertCharacter);

// Récupérer un personnage par son ID
router.get("/:id", CharacterController.getCharacterById);

// Récupérer tous les personnages d'une guilde
router.get("/guild/:guildId", CharacterController.getGuildCharacters);

// Met à jour les statistiques d'un personnage (PA et Faim)
router.patch("/:id/stats", CharacterController.updateCharacterStats);

// Permettre à un personnage de manger de la nourriture
router.post("/:id/eat", CharacterController.eatFood);

export default router;

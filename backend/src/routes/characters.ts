import express from "express";
import * as CharacterController from "../controllers/characters";
import { objectsController } from "../controllers/objects";

const router = express.Router();

// Récupérer le personnage actif d'un utilisateur par son ID Discord et l'ID de la ville
router.get("/active/:discordId/:townId", CharacterController.getActiveCharacterByDiscordId);

// Créer ou mettre à jour un personnage
router.post("/", CharacterController.upsertCharacter);

// Récupérer un personnage par son ID
router.get("/:id", CharacterController.getCharacterById);

// Récupérer tous les personnages d'une guilde (legacy)
router.get("/guild/:guildId", CharacterController.getGuildCharacters);

// NOUVEAUX ENDPOINTS POUR LE SYSTÈME TOWN-BASED

// Récupérer tous les personnages d'une ville
router.get("/town/:townId", CharacterController.getTownCharacters);

// Tuer un personnage
router.post("/:id/kill", CharacterController.killCharacter);

// Donner l'autorisation de reroll à un personnage
router.post("/:id/grant-reroll", CharacterController.grantRerollPermission);

// Créer un personnage reroll
router.post("/reroll", CharacterController.createRerollCharacter);

// Changer le personnage actif d'un utilisateur
router.post("/switch-active", CharacterController.switchActiveCharacter);

// Récupérer les personnages morts éligibles pour reroll
router.get("/rerollable/:userId/:townId", CharacterController.getRerollableCharacters);

// Vérifier si un utilisateur a besoin de créer un personnage
router.get("/needs-creation/:userId/:townId", CharacterController.needsCharacterCreation);

// Met à jour les statistiques d'un personnage (PA, faim, etc.)
router.patch("/:id/stats", CharacterController.updateCharacterStats);

// Permettre à un personnage de manger de la nourriture
router.post("/:id/eat", CharacterController.eatFood);

// Permettre à un personnage de manger un type de nourriture alternatif
router.post("/:id/eat-alternative", CharacterController.eatFoodAlternative);

// Gestion des capacités du personnage
router.get("/:id/capabilities", CharacterController.getCharacterCapabilities);
router.get("/:id/available-capabilities", CharacterController.getAvailableCapabilities);
// Les routes spécifiques doivent venir avant les routes avec paramètres
router.post("/:id/capabilities/use", CharacterController.useCharacterCapability);
router.post("/:id/capabilities/:capabilityId", CharacterController.addCharacterCapability);
router.delete("/:id/capabilities/:capabilityId", CharacterController.removeCharacterCapability);

// Inventory routes
router.get("/:id/inventory", objectsController.getCharacterInventory);
router.post("/:id/inventory/add", objectsController.addObjectToCharacter);
router.delete("/:id/inventory/:slotId", objectsController.removeObjectFromCharacter);
router.post("/:id/inventory/transfer", objectsController.transferObject);

export default router;

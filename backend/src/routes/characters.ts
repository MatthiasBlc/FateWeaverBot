import express from "express";
import * as CharacterController from "../controllers/characters";
import { objectsController } from "../controllers/objects";
import * as SkillsController from "../controllers/skills";
import { validate } from "../api/middleware/validation.middleware";
import {
  GetActiveCharacterSchema,
  UpsertCharacterSchema,
  GetCharacterByIdSchema,
  GetGuildCharactersSchema,
  GetTownCharactersSchema,
  KillCharacterSchema,
  GrantRerollPermissionSchema,
  CreateRerollCharacterSchema,
  SwitchActiveCharacterSchema,
  GetRerollableCharactersSchema,
  NeedsCharacterCreationSchema,
  UpdateCharacterStatsSchema,
  EatFoodSchema,
  EatFoodAlternativeSchema,
  GetCharacterCapabilitiesSchema,
  GetAvailableCapabilitiesSchema,
  UseCharacterCapabilitySchema,
  AddCharacterCapabilitySchema,
  RemoveCharacterCapabilitySchema,
  GetCharacterSkillsSchema,
  AddCharacterSkillSchema,
  RemoveCharacterSkillSchema,
  GetCharacterObjectsSchema,
  AddObjectToCharacterByIdSchema,
  RemoveObjectFromCharacterByIdSchema,
  GetCharacterInventorySchema,
  AddObjectToCharacterSchema,
  RemoveObjectFromCharacterSchema,
  TransferObjectSchema,
  ChangeCharacterJobSchema,
  UseCataplasmeSchema
} from "../api/validators/character.schema";

const router = express.Router();

// Récupérer le personnage actif d'un utilisateur par son ID Discord et l'ID de la ville
router.get(
  "/active/:discordId/:townId",
  validate(GetActiveCharacterSchema),
  CharacterController.getActiveCharacterByDiscordId
);

// Créer ou mettre à jour un personnage
router.post("/", validate(UpsertCharacterSchema), CharacterController.upsertCharacter);

// Récupérer un personnage par son ID
router.get("/:id", validate(GetCharacterByIdSchema), CharacterController.getCharacterById);

// Récupérer tous les personnages d'une guilde (legacy)
router.get("/guild/:guildId", validate(GetGuildCharactersSchema), CharacterController.getGuildCharacters);

// NOUVEAUX ENDPOINTS POUR LE SYSTÈME TOWN-BASED

// Récupérer tous les personnages d'une ville
router.get("/town/:townId", validate(GetTownCharactersSchema), CharacterController.getTownCharacters);

// Tuer un personnage
router.post("/:id/kill", validate(KillCharacterSchema), CharacterController.killCharacter);

// Donner l'autorisation de reroll à un personnage
router.post("/:id/grant-reroll", validate(GrantRerollPermissionSchema), CharacterController.grantRerollPermission);

// Créer un personnage reroll
router.post("/reroll", validate(CreateRerollCharacterSchema), CharacterController.createRerollCharacter);

// Changer le personnage actif d'un utilisateur
router.post("/switch-active", validate(SwitchActiveCharacterSchema), CharacterController.switchActiveCharacter);

// Récupérer les personnages morts éligibles pour reroll
router.get(
  "/rerollable/:userId/:townId",
  validate(GetRerollableCharactersSchema),
  CharacterController.getRerollableCharacters
);

// Vérifier si un utilisateur a besoin de créer un personnage
router.get(
  "/needs-creation/:userId/:townId",
  validate(NeedsCharacterCreationSchema),
  CharacterController.needsCharacterCreation
);

// Met à jour les statistiques d'un personnage (PA, faim, etc.)
router.patch("/:id/stats", validate(UpdateCharacterStatsSchema), CharacterController.updateCharacterStats);

// Permettre à un personnage de manger des Vivres
router.post("/:id/eat", validate(EatFoodSchema), CharacterController.eatFood);

// Permettre à un personnage de manger un type de nourriture alternatif (Repas, etc.)
router.post("/:id/eat-alternative", validate(EatFoodAlternativeSchema), CharacterController.eatFoodAlternative);

// Gestion des capacités du personnage
router.get("/:id/capabilities", validate(GetCharacterCapabilitiesSchema), CharacterController.getCharacterCapabilities);
router.get(
  "/:id/available-capabilities",
  validate(GetAvailableCapabilitiesSchema),
  CharacterController.getAvailableCapabilities
);
// Les routes spécifiques doivent venir avant les routes avec paramètres
router.post(
  "/:id/capabilities/use",
  validate(UseCharacterCapabilitySchema),
  CharacterController.useCharacterCapability
);
router.post(
  "/:id/capabilities/:capabilityId",
  validate(AddCharacterCapabilitySchema),
  CharacterController.addCharacterCapability
);
router.delete(
  "/:id/capabilities/:capabilityId",
  validate(RemoveCharacterCapabilitySchema),
  CharacterController.removeCharacterCapability
);

// Skill management routes (for admin)
router.get("/:id/skills", validate(GetCharacterSkillsSchema), SkillsController.getCharacterSkills);
router.post("/:id/skills/:skillId", validate(AddCharacterSkillSchema), SkillsController.addCharacterSkill);
router.delete("/:id/skills/:skillId", validate(RemoveCharacterSkillSchema), SkillsController.removeCharacterSkill);

// Object management routes (for admin - must come before inventory routes)
router.get("/:id/objects", validate(GetCharacterObjectsSchema), objectsController.getCharacterObjects);
router.post("/:id/objects/:objectId", validate(AddObjectToCharacterByIdSchema), objectsController.addObjectToCharacterById);
router.delete("/:id/objects/:objectId", validate(RemoveObjectFromCharacterByIdSchema), objectsController.removeObjectFromCharacterById);

// Inventory routes
router.get("/:id/inventory", validate(GetCharacterInventorySchema), objectsController.getCharacterInventory);
router.post("/:id/inventory/add", validate(AddObjectToCharacterSchema), objectsController.addObjectToCharacter);
router.delete(
  "/:id/inventory/:slotId",
  validate(RemoveObjectFromCharacterSchema),
  objectsController.removeObjectFromCharacter
);
router.post("/:id/inventory/transfer", validate(TransferObjectSchema), objectsController.transferObject);

// Job management
router.post("/:id/job", validate(ChangeCharacterJobSchema), CharacterController.changeCharacterJob);

// Cataplasme
router.post("/:id/use-cataplasme", validate(UseCataplasmeSchema), CharacterController.useCataplasme);

export default router;

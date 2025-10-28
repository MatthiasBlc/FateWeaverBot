import { Router } from "express";
import { requireAuthOrInternal } from "../middleware/auth";
import {
  createExpedition,
  getExpeditionById,
  getExpeditionsByTown,
  getActiveExpeditionsForCharacter,
  getAllExpeditions,
  joinExpedition,
  leaveExpedition,
  transferExpeditionResource,
  toggleEmergencyVote,
  setExpeditionDirection,
  setExpeditionChannel,
  sendExpeditionLog,
} from "../controllers/expedition";
import { validate } from "../api/middleware/validation.middleware";
import {
  CreateExpeditionSchema,
  GetExpeditionByIdSchema,
  GetExpeditionsByTownSchema,
  JoinExpeditionSchema,
  LeaveExpeditionSchema,
  GetActiveExpeditionsForCharacterSchema,
  TransferExpeditionResourceSchema,
  ToggleEmergencyVoteSchema,
  SetExpeditionDirectionSchema
} from "../api/validators/expedition.schema";

const router = Router();

// Créer une nouvelle expédition
router.post("/", requireAuthOrInternal, validate(CreateExpeditionSchema), createExpedition);

// Récupérer toutes les expéditions
router.get("/", requireAuthOrInternal, getAllExpeditions);

// Récupérer une expédition par son ID
router.get("/:id", requireAuthOrInternal, validate(GetExpeditionByIdSchema), getExpeditionById);

// Récupérer toutes les expéditions d'une ville
router.get("/town/:townId", requireAuthOrInternal, validate(GetExpeditionsByTownSchema), getExpeditionsByTown);

// Rejoindre une expédition
router.post("/:id/join", requireAuthOrInternal, validate(JoinExpeditionSchema), joinExpedition);

// Quitter une expédition
router.post("/:id/leave", requireAuthOrInternal, validate(LeaveExpeditionSchema), leaveExpedition);

// Récupérer les expéditions actives d'un personnage
router.get(
  "/character/:characterId/active",
  requireAuthOrInternal,
  validate(GetActiveExpeditionsForCharacterSchema),
  getActiveExpeditionsForCharacter
);

// Transférer des ressources (ville <-> expédition)
router.post("/:id/transfer", requireAuthOrInternal, validate(TransferExpeditionResourceSchema), transferExpeditionResource);

// Toggle vote pour retour d'urgence
router.post("/:id/emergency-vote", requireAuthOrInternal, validate(ToggleEmergencyVoteSchema), toggleEmergencyVote);

// Définir la direction d'une expédition
router.post("/:id/set-direction", requireAuthOrInternal, validate(SetExpeditionDirectionSchema), setExpeditionDirection);

// Configurer le channel dédié d'une expédition
router.post("/:id/channel", requireAuthOrInternal, setExpeditionChannel);

// Envoyer un log au channel dédié d'une expédition
router.post("/:id/log", requireAuthOrInternal, sendExpeditionLog);

export default router;

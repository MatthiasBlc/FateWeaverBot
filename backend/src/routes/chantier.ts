import { Router } from "express";
import { requireAuthOrInternal } from "../middleware/auth";
import {
  createChantier,
  getChantiersByGuild,
  getChantierById,
  deleteChantier,
  investInChantier,
  contributeResources,
} from "../controllers/chantier";
import { validate } from "../api/middleware/validation.middleware";
import {
  CreateChantierSchema,
  GetChantiersByGuildSchema,
  GetChantierByIdSchema,
  DeleteChantierSchema,
  InvestInChantierSchema,
  ContributeResourcesSchema
} from "../api/validators/chantier.schema";

const router = Router();

// Créer un nouveau chantier
router.post("/", requireAuthOrInternal, validate(CreateChantierSchema), createChantier);

// Récupérer tous les chantiers d'un serveur
router.get("/guild/:guildId", requireAuthOrInternal, validate(GetChantiersByGuildSchema), getChantiersByGuild);

// Récupérer un chantier par son ID
router.get("/:id", requireAuthOrInternal, validate(GetChantierByIdSchema), getChantierById);

// Supprimer un chantier
router.delete("/:id", requireAuthOrInternal, validate(DeleteChantierSchema), deleteChantier);

// Investir des points d'action dans un chantier
router.post("/:chantierId/invest", requireAuthOrInternal, validate(InvestInChantierSchema), investInChantier);

// Contribuer des ressources à un chantier
router.post("/:id/contribute-resources", requireAuthOrInternal, validate(ContributeResourcesSchema), contributeResources);

export default router;

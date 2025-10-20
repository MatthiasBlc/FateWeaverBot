import { Router } from "express";
import { requireAuthOrInternal } from "../middleware/auth";
import {
  getResources,
  addResource,
  updateResource,
  removeResource,
  transferResource,
  getAllResourceTypes,
  createResourceType,
} from "../controllers/resources";
import { validate } from "../api/middleware/validation.middleware";
import {
  GetResourcesSchema,
  AddResourceSchema,
  UpdateResourceSchema,
  RemoveResourceSchema,
  TransferResourceSchema,
  CreateResourceTypeSchema
} from "../api/validators/resource.schema";

const router = Router();

// Récupérer tous les types de ressources disponibles
router.get("/types", requireAuthOrInternal, getAllResourceTypes);

// Route dédiée pour accès direct aux ResourceType (pour plus de clarté)
router.get("/resource-types", requireAuthOrInternal, getAllResourceTypes);

// Créer un nouveau type de ressource
router.post("/types", requireAuthOrInternal, validate(CreateResourceTypeSchema), createResourceType);

// Récupérer les ressources d'un lieu (ville ou expédition)
router.get("/:locationType/:locationId", requireAuthOrInternal, validate(GetResourcesSchema), getResources);

// Ajouter des ressources à un lieu
router.post("/:locationType/:locationId/:resourceTypeId", requireAuthOrInternal, validate(AddResourceSchema), addResource);

// Mettre à jour la quantité d'une ressource spécifique
router.put("/:locationType/:locationId/:resourceTypeId", requireAuthOrInternal, validate(UpdateResourceSchema), updateResource);

// Retirer des ressources d'un lieu
router.delete("/:locationType/:locationId/:resourceTypeId", requireAuthOrInternal, validate(RemoveResourceSchema), removeResource);

// Transférer des ressources entre deux lieux
router.post("/:fromLocationType/:fromLocationId/:toLocationType/:toLocationId/:resourceTypeId/transfer", requireAuthOrInternal, validate(TransferResourceSchema), transferResource);

export default router;

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

const router = Router();

// Récupérer tous les types de ressources disponibles
router.get("/types", requireAuthOrInternal, getAllResourceTypes);

// Route dédiée pour accès direct aux ResourceType (pour plus de clarté)
router.get("/resource-types", requireAuthOrInternal, getAllResourceTypes);

// Créer un nouveau type de ressource
router.post("/types", requireAuthOrInternal, createResourceType);

// Récupérer les ressources d'un lieu (ville ou expédition)
router.get("/:locationType/:locationId", requireAuthOrInternal, getResources);

// Ajouter des ressources à un lieu
router.post("/:locationType/:locationId/:resourceTypeId", requireAuthOrInternal, addResource);

// Mettre à jour la quantité d'une ressource spécifique
router.put("/:locationType/:locationId/:resourceTypeId", requireAuthOrInternal, updateResource);

// Retirer des ressources d'un lieu
router.delete("/:locationType/:locationId/:resourceTypeId", requireAuthOrInternal, removeResource);

// Transférer des ressources entre deux lieux
router.post("/:fromLocationType/:fromLocationId/:toLocationType/:toLocationId/:resourceTypeId/transfer", requireAuthOrInternal, transferResource);

export default router;

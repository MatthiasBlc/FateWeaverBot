import { Request, Response, NextFunction } from "express";
import { CapacityBonusType } from "@prisma/client";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { objectService } from "../services/object.service";
import { logger } from "../services/logger";
import { prisma } from "../util/db";

export const objectsController = {
  /**
   * GET /api/objects
   */
  async getAllObjectTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const objects = await objectService.getAllObjectTypes();
      res.json(objects);
    } catch (error: any) {
      logger.error("Error in getAllObjectTypes:", error);
      next(error);
    }
  },

  /**
   * GET /api/objects/:id
   */
  async getObjectTypeById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const object = await objectService.getObjectTypeById(id);

      if (!object) {
        return res.status(404).json({ error: "Object type not found" });
      }

      res.json(object);
    } catch (error: any) {
      logger.error("Error in getObjectTypeById:", error);
      next(error);
    }
  },

  /**
   * POST /api/objects
   */
  async createObjectType(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const object = await objectService.createObjectType({ name, description });
      res.status(201).json(object);
    } catch (error: any) {
      logger.error("Error in createObjectType:", error);
      next(error);
    }
  },

  /**
   * GET /api/characters/:id/inventory
   */
  async getCharacterInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const characterId = req.params.id;
      const inventory = await objectService.getCharacterInventory(characterId);

      res.json(inventory || { slots: [] });
    } catch (error: any) {
      logger.error("Error in getCharacterInventory:", error);
      next(error);
    }
  },

  /**
   * GET /api/characters/:id/objects
   * Retourne la liste des types d'objets (dédupliqués) pour l'admin
   */
  async getCharacterObjects(req: Request, res: Response, next: NextFunction) {
    try {
      const characterId = req.params.id;
      const objects = await objectService.getCharacterObjects(characterId);

      res.json(objects);
    } catch (error: any) {
      logger.error("Error in getCharacterObjects:", error);
      next(error);
    }
  },

  /**
   * POST /api/characters/:id/inventory/add
   */
  async addObjectToCharacter(req: Request, res: Response, next: NextFunction) {
    try {
      const characterId = req.params.id;
      const { objectTypeId } = req.body;

      if (!objectTypeId) {
        return res.status(400).json({ error: "objectTypeId is required" });
      }

      const result = await objectService.addObjectToCharacter(characterId, objectTypeId);
      res.json(result);
    } catch (error: any) {
      logger.error("Error in addObjectToCharacter:", error);
      next(error);
    }
  },

  /**
   * DELETE /api/characters/:id/inventory/:slotId
   */
  async removeObjectFromCharacter(req: Request, res: Response, next: NextFunction) {
    try {
      const { slotId } = req.params;

      await objectService.removeObjectFromCharacter(slotId);
      res.json({ success: true });
    } catch (error: any) {
      logger.error("Error in removeObjectFromCharacter:", error);
      next(error);
    }
  },

  /**
   * POST /api/characters/:id/inventory/transfer
   */
  async transferObject(req: Request, res: Response, next: NextFunction) {
    try {
      const { slotId, targetCharacterId } = req.body;

      if (!slotId || !targetCharacterId) {
        return res.status(400).json({ error: "slotId and targetCharacterId are required" });
      }

      const result = await objectService.transferObject(slotId, targetCharacterId);
      res.json(result);
    } catch (error: any) {
      logger.error("Error in transferObject:", error);
      next(error);
    }
  },

  /**
   * POST /api/characters/:id/objects/:objectId
   * Ajoute un objet au personnage (pour l'admin)
   */
  async addObjectToCharacterById(req: Request, res: Response, next: NextFunction) {
    try {
      const characterId = req.params.id;
      const objectTypeId = parseInt(req.params.objectId, 10);

      if (isNaN(objectTypeId)) {
        return res.status(400).json({ error: "Invalid objectId" });
      }

      const result = await objectService.addObjectToCharacter(characterId, objectTypeId);
      res.json(result);
    } catch (error: any) {
      logger.error("Error in addObjectToCharacterById:", error);
      next(error);
    }
  },

  /**
   * DELETE /api/characters/:id/objects/:objectId
   * Retire un objet du personnage par type (pour l'admin)
   */
  async removeObjectFromCharacterById(req: Request, res: Response, next: NextFunction) {
    try {
      const characterId = req.params.id;
      const objectTypeId = parseInt(req.params.objectId, 10);

      if (isNaN(objectTypeId)) {
        return res.status(400).json({ error: "Invalid objectId" });
      }

      await objectService.removeObjectFromCharacterByType(characterId, objectTypeId);
      res.json({ success: true });
    } catch (error: any) {
      logger.error("Error in removeObjectFromCharacterById:", error);
      next(error);
    }
  },

  /**
   * PATCH /api/objects/:id
   */
  async updateObjectType(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, description } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid object ID" });
      }

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const object = await objectService.updateObjectType(id, { name, description });

      if (!object) {
        return res.status(404).json({ error: "Object type not found" });
      }

      res.json(object);
    } catch (error: any) {
      logger.error("Error in updateObjectType:", error);
      next(error);
    }
  },

  /**
   * DELETE /api/objects/:id
   */
  async deleteObjectType(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid object ID" });
      }

      const object = await objectService.deleteObjectType(id);

      if (!object) {
        return res.status(404).json({ error: "Object type not found" });
      }

      res.json(object);
    } catch (error: any) {
      logger.error("Error in deleteObjectType:", error);
      next(error);
    }
  },

  /**
   * POST /api/objects/:id/skill-bonus
   * Ajoute une compétence à un objet
   */
  async addSkillBonus(req: Request, res: Response, next: NextFunction) {
    try {
      const objectId = parseInt(req.params.id, 10);
      const { skillId } = req.body;

      if (isNaN(objectId)) {
        return res.status(400).json({ error: "Invalid object ID" });
      }

      if (!skillId) {
        return res.status(400).json({ error: "skillId is required" });
      }

      // Créer le bonus de compétence
      const bonus = await prisma.objectSkillBonus.create({
        data: {
          objectTypeId: objectId,
          skillId: skillId,
        },
        include: {
          skill: true,
        },
      });

      logger.info("Skill bonus added to object", {
        objectId,
        skillId,
      });

      res.status(201).json(bonus);
    } catch (error: any) {
      logger.error("Error in addSkillBonus:", error);
      next(error);
    }
  },

  /**
   * POST /api/objects/:id/capability-bonus
   * Ajoute une capacité à un objet
   */
  async addCapabilityBonus(req: Request, res: Response, next: NextFunction) {
    try {
      const objectId = parseInt(req.params.id, 10);
      const { capabilityId } = req.body;

      if (isNaN(objectId)) {
        return res.status(400).json({ error: "Invalid object ID" });
      }

      if (!capabilityId) {
        return res.status(400).json({ error: "capabilityId is required" });
      }

      // Récupérer la capacité pour déterminer son type de bonus
      const capability = await prisma.capability.findUnique({
        where: { id: capabilityId },
      });

      if (!capability) {
        return res.status(404).json({ error: "Capability not found" });
      }

      // Déterminer le type de bonus basé sur le nom de la capacité
      // LUCKY_ROLL: Chasser+, Cueillir+, Miner+, Pêcher+, Cuisiner+, Couper du bois+
      // HEAL_EXTRA: Soigner+
      // ENTERTAIN_BURST: Divertir+
      // ADMIN_INTERPRETED: Tisser+, Forger+, Menuiser+, Cartographier+, Rechercher+, Auspice+
      let bonusType: CapacityBonusType = CapacityBonusType.ADMIN_INTERPRETED; // défaut
      const capName = capability.name.toLowerCase();

      if (["chasser", "cueillir", "miner", "pêcher", "cuisiner", "couper"].some(name => capName.includes(name))) {
        bonusType = CapacityBonusType.LUCKY_ROLL;
      } else if (capName.includes("soigner")) {
        bonusType = CapacityBonusType.HEAL_EXTRA;
      } else if (capName.includes("divertir")) {
        bonusType = CapacityBonusType.ENTERTAIN_BURST;
      }

      // Créer le bonus de capacité
      const bonus = await prisma.objectCapacityBonus.create({
        data: {
          objectTypeId: objectId,
          capabilityId: capabilityId,
          bonusType: bonusType,
        },
        include: {
          capability: true,
        },
      });

      logger.info("Capability bonus added to object", {
        objectId,
        capabilityId,
        bonusType,
      });

      res.status(201).json(bonus);
    } catch (error: any) {
      logger.error("Error in addCapabilityBonus:", error);
      next(error);
    }
  },

  /**
   * POST /api/objects/:id/resource-conversion
   * Ajoute une conversion en ressource à un objet
   */
  async addResourceConversion(req: Request, res: Response, next: NextFunction) {
    try {
      const objectId = parseInt(req.params.id, 10);
      const { resourceTypeId, quantity } = req.body;

      if (isNaN(objectId)) {
        return res.status(400).json({ error: "Invalid object ID" });
      }

      if (!resourceTypeId) {
        return res.status(400).json({ error: "resourceTypeId is required" });
      }

      // Convertir resourceTypeId en nombre
      const parsedResourceTypeId = parseInt(resourceTypeId, 10);
      if (isNaN(parsedResourceTypeId)) {
        return res.status(400).json({ error: "Invalid resourceTypeId" });
      }

      // Convertir quantity en nombre
      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({ error: "quantity must be a positive integer" });
      }

      // Vérifier que l'objet existe
      const objectType = await prisma.objectType.findUnique({
        where: { id: objectId },
      });

      if (!objectType) {
        return res.status(404).json({ error: "Object type not found" });
      }

      // Vérifier que la ressource existe
      const resourceType = await prisma.resourceType.findUnique({
        where: { id: parsedResourceTypeId },
      });

      if (!resourceType) {
        return res.status(404).json({ error: "Resource type not found" });
      }

      // Créer la conversion en ressource
      const conversion = await prisma.objectResourceConversion.create({
        data: {
          objectTypeId: objectId,
          resourceTypeId: parsedResourceTypeId,
          quantity: parsedQuantity,
        },
        include: {
          resourceType: true,
        },
      });

      logger.info("Resource conversion added to object", {
        objectId,
        resourceTypeId: parsedResourceTypeId,
        quantity: parsedQuantity,
      });

      res.status(201).json(conversion);
    } catch (error: any) {
      logger.error("Error in addResourceConversion:", error);
      next(error);
    }
  }
};

import { Request, Response } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { objectService } from "../services/object.service";
import { logger } from "../services/logger";

export const objectsController = {
  /**
   * GET /api/objects
   */
  async getAllObjectTypes(req: Request, res: Response) {
    try {
      const objects = await objectService.getAllObjectTypes();
      res.json(objects);
    } catch (error: any) {
      logger.error("Error in getAllObjectTypes:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/objects/:id
   */
  async getObjectTypeById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const object = await objectService.getObjectTypeById(id);

      if (!object) {
        return res.status(404).json({ error: "Object type not found" });
      }

      res.json(object);
    } catch (error: any) {
      logger.error("Error in getObjectTypeById:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/objects
   */
  async createObjectType(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const object = await objectService.createObjectType({ name, description });
      res.status(201).json(object);
    } catch (error: any) {
      logger.error("Error in createObjectType:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/characters/:id/inventory
   */
  async getCharacterInventory(req: Request, res: Response) {
    try {
      const characterId = req.params.id;
      const inventory = await objectService.getCharacterInventory(characterId);

      res.json(inventory || { slots: [] });
    } catch (error: any) {
      logger.error("Error in getCharacterInventory:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/characters/:id/objects
   * Retourne la liste des types d'objets (dédupliqués) pour l'admin
   */
  async getCharacterObjects(req: Request, res: Response) {
    try {
      const characterId = req.params.id;
      const objects = await objectService.getCharacterObjects(characterId);

      res.json(objects);
    } catch (error: any) {
      logger.error("Error in getCharacterObjects:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/characters/:id/inventory/add
   */
  async addObjectToCharacter(req: Request, res: Response) {
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
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * DELETE /api/characters/:id/inventory/:slotId
   */
  async removeObjectFromCharacter(req: Request, res: Response) {
    try {
      const { slotId } = req.params;

      await objectService.removeObjectFromCharacter(slotId);
      res.json({ success: true });
    } catch (error: any) {
      logger.error("Error in removeObjectFromCharacter:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/characters/:id/inventory/transfer
   */
  async transferObject(req: Request, res: Response) {
    try {
      const { slotId, targetCharacterId } = req.body;

      if (!slotId || !targetCharacterId) {
        return res.status(400).json({ error: "slotId and targetCharacterId are required" });
      }

      const result = await objectService.transferObject(slotId, targetCharacterId);
      res.json(result);
    } catch (error: any) {
      logger.error("Error in transferObject:", error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/characters/:id/objects/:objectId
   * Ajoute un objet au personnage (pour l'admin)
   */
  async addObjectToCharacterById(req: Request, res: Response) {
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
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * DELETE /api/characters/:id/objects/:objectId
   * Retire un objet du personnage par type (pour l'admin)
   */
  async removeObjectFromCharacterById(req: Request, res: Response) {
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
      res.status(500).json({ error: error.message });
    }
  }
};

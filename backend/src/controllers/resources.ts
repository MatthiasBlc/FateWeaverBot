import { RequestHandler } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { prisma } from "../util/db";
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ResourceUtils } from "../shared/utils";

export const getResources: RequestHandler = async (req, res, next) => {
  try {
    const { locationType, locationId } = req.params;

    if (!locationType || !locationId) {
      throw new BadRequestError(
        "Les paramètres locationType et locationId sont requis"
      );
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw new BadRequestError("locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    const resources = await prisma.resourceStock.findMany({
      where: {
        locationType: locationType as "CITY" | "EXPEDITION",
        locationId: locationId,
      },
      ...ResourceQueries.withResourceType(),
      orderBy: {
        resourceType: {
          name: "asc",
        },
      },
    });

    res.status(200).json(resources);
  } catch (error) {
    next(error);
  }
};

export const addResource: RequestHandler = async (req, res, next) => {
  try {
    const { locationType, locationId, resourceTypeId } = req.params;
    const { quantity } = req.body;

    if (!locationType || !locationId || !resourceTypeId) {
      throw new BadRequestError("Les paramètres locationType, locationId et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw new BadRequestError("locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestError("La quantité doit être un nombre positif");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw new NotFoundError("Resource type", parseInt(resourceTypeId));
    }

    const resource = await prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(locationType as "CITY" | "EXPEDITION", locationId, parseInt(resourceTypeId)),
      update: {
        quantity: { increment: quantity },
      },
      create: {
        locationType: locationType as "CITY" | "EXPEDITION",
        locationId: locationId,
        resourceTypeId: parseInt(resourceTypeId),
        quantity: quantity,
      },
    });

    res.status(200).json(resource);
  } catch (error) {
    next(error);
  }
};

export const updateResource: RequestHandler = async (req, res, next) => {
  try {
    const { locationType, locationId, resourceTypeId } = req.params;
    const { quantity } = req.body;

    if (!locationType || !locationId || !resourceTypeId) {
      throw new BadRequestError("Les paramètres locationType, locationId et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw new BadRequestError("locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    if (quantity === undefined || quantity < 0) {
      throw new BadRequestError("La quantité doit être un nombre positif ou zéro");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw new NotFoundError("Resource type", parseInt(resourceTypeId));
    }

    const resource = await prisma.resourceStock.upsert({
      where: ResourceQueries.stockWhere(locationType as "CITY" | "EXPEDITION", locationId, parseInt(resourceTypeId)),
      update: {
        quantity: quantity,
      },
      create: {
        locationType: locationType as "CITY" | "EXPEDITION",
        locationId: locationId,
        resourceTypeId: parseInt(resourceTypeId),
        quantity: quantity,
      },
    });

    res.status(200).json(resource);
  } catch (error) {
    next(error);
  }
};

export const removeResource: RequestHandler = async (req, res, next) => {
  try {
    const { locationType, locationId, resourceTypeId } = req.params;
    const { quantity } = req.body;

    if (!locationType || !locationId || !resourceTypeId) {
      throw new BadRequestError("Les paramètres locationType, locationId et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw new BadRequestError("locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestError("La quantité à retirer doit être un nombre positif");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw new NotFoundError("Resource type", parseInt(resourceTypeId));
    }

    // Vérifier que le lieu a assez de ressources
    const currentStock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(locationType as "CITY" | "EXPEDITION", locationId, parseInt(resourceTypeId)),
    });

    if (!currentStock || currentStock.quantity < quantity) {
      throw new BadRequestError("Pas assez de ressources disponibles");
    }

    const updatedResource = await prisma.resourceStock.update({
      where: ResourceQueries.stockWhere(locationType as "CITY" | "EXPEDITION", locationId, parseInt(resourceTypeId)),
      data: {
        quantity: { decrement: quantity },
      },
    });

    res.status(200).json(updatedResource);
  } catch (error) {
    next(error);
  }
};

export const transferResource: RequestHandler = async (req, res, next) => {
  try {
    const { fromLocationType, fromLocationId, toLocationType, toLocationId, resourceTypeId } = req.params;
    const { quantity } = req.body;

    if (!fromLocationType || !fromLocationId || !toLocationType || !toLocationId || !resourceTypeId) {
      throw new BadRequestError("Tous les paramètres de localisation et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(fromLocationType) || !["CITY", "EXPEDITION"].includes(toLocationType)) {
      throw new BadRequestError("Les locationTypes doivent être 'CITY' ou 'EXPEDITION'");
    }

    if (fromLocationType === toLocationType && fromLocationId === toLocationId) {
      throw new BadRequestError("Impossible de transférer vers la même localisation");
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestError("La quantité doit être un nombre positif");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw new NotFoundError("Resource type", parseInt(resourceTypeId));
    }

    // Vérifier que la localisation source a assez de ressources
    const sourceStock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(fromLocationType as "CITY" | "EXPEDITION", fromLocationId, parseInt(resourceTypeId)),
    });

    if (!sourceStock || sourceStock.quantity < quantity) {
      throw new BadRequestError("Pas assez de ressources dans la localisation source");
    }

    // Effectuer le transfert
    await prisma.$transaction([
      // Retirer de la source
      prisma.resourceStock.update({
        where: ResourceQueries.stockWhere(fromLocationType as "CITY" | "EXPEDITION", fromLocationId, parseInt(resourceTypeId)),
        data: {
          quantity: { decrement: quantity },
        },
      }),
      // Ajouter à la destination
      prisma.resourceStock.upsert({
        where: ResourceQueries.stockWhere(toLocationType as "CITY" | "EXPEDITION", toLocationId, parseInt(resourceTypeId)),
        update: {
          quantity: { increment: quantity },
        },
        create: {
          locationType: toLocationType as "CITY" | "EXPEDITION",
          locationId: toLocationId,
          resourceTypeId: parseInt(resourceTypeId),
          quantity: quantity,
          ...(toLocationType === "CITY" ? { townId: toLocationId } : {}),
          ...(toLocationType === "EXPEDITION" ? { expeditionId: toLocationId } : {}),
        },
      }),
    ]);

    res.status(200).json({ success: true, message: "Transfert effectué avec succès" });
  } catch (error) {
    next(error);
  }
};

export const getAllResourceTypes: RequestHandler = async (req, res, next) => {
  try {
    const resourceTypes = await prisma.resourceType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(resourceTypes);
  } catch (error) {
    next(error);
  }
};

export const createResourceType: RequestHandler = async (req, res, next) => {
  try {
    const { name, emoji, category, description } = req.body;

    if (!name || !emoji || !category) {
      throw new BadRequestError("name, emoji et category sont requis");
    }

    const resourceType = await prisma.resourceType.create({
      data: {
        name,
        emoji,
        category,
        description: description || null,
      },
    });

    res.status(201).json(resourceType);
  } catch (error) {
    next(error);
  }
};

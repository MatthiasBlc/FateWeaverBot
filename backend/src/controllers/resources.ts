import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

export const getResources: RequestHandler = async (req, res, next) => {
  try {
    const { locationType, locationId } = req.params;

    if (!locationType || !locationId) {
      throw createHttpError(400, "Les paramètres locationType et locationId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw createHttpError(400, "locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    const resources = await prisma.resourceStock.findMany({
      where: {
        locationType: locationType as "CITY" | "EXPEDITION",
        locationId: locationId,
      },
      include: {
        resourceType: true,
      },
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
      throw createHttpError(400, "Les paramètres locationType, locationId et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw createHttpError(400, "locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    if (!quantity || quantity <= 0) {
      throw createHttpError(400, "La quantité doit être un nombre positif");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw createHttpError(404, "Type de ressource non trouvé");
    }

    const resource = await prisma.resourceStock.upsert({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: locationType as "CITY" | "EXPEDITION",
          locationId: locationId,
          resourceTypeId: parseInt(resourceTypeId),
        },
      },
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
      throw createHttpError(400, "Les paramètres locationType, locationId et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw createHttpError(400, "locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    if (quantity === undefined || quantity < 0) {
      throw createHttpError(400, "La quantité doit être un nombre positif ou zéro");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw createHttpError(404, "Type de ressource non trouvé");
    }

    const resource = await prisma.resourceStock.upsert({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: locationType as "CITY" | "EXPEDITION",
          locationId: locationId,
          resourceTypeId: parseInt(resourceTypeId),
        },
      },
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
      throw createHttpError(400, "Les paramètres locationType, locationId et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(locationType)) {
      throw createHttpError(400, "locationType doit être 'CITY' ou 'EXPEDITION'");
    }

    if (!quantity || quantity <= 0) {
      throw createHttpError(400, "La quantité à retirer doit être un nombre positif");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw createHttpError(404, "Type de ressource non trouvé");
    }

    // Vérifier que le lieu a assez de ressources
    const currentStock = await prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: locationType as "CITY" | "EXPEDITION",
          locationId: locationId,
          resourceTypeId: parseInt(resourceTypeId),
        },
      },
    });

    if (!currentStock || currentStock.quantity < quantity) {
      throw createHttpError(400, "Pas assez de ressources disponibles");
    }

    const updatedResource = await prisma.resourceStock.update({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: locationType as "CITY" | "EXPEDITION",
          locationId: locationId,
          resourceTypeId: parseInt(resourceTypeId),
        },
      },
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
      throw createHttpError(400, "Tous les paramètres de localisation et resourceTypeId sont requis");
    }

    if (!["CITY", "EXPEDITION"].includes(fromLocationType) || !["CITY", "EXPEDITION"].includes(toLocationType)) {
      throw createHttpError(400, "Les locationTypes doivent être 'CITY' ou 'EXPEDITION'");
    }

    if (fromLocationType === toLocationType && fromLocationId === toLocationId) {
      throw createHttpError(400, "Impossible de transférer vers la même localisation");
    }

    if (!quantity || quantity <= 0) {
      throw createHttpError(400, "La quantité doit être un nombre positif");
    }

    // Vérifier que le type de ressource existe
    const resourceType = await prisma.resourceType.findUnique({
      where: { id: parseInt(resourceTypeId) },
    });

    if (!resourceType) {
      throw createHttpError(404, "Type de ressource non trouvé");
    }

    // Vérifier que la localisation source a assez de ressources
    const sourceStock = await prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: fromLocationType as "CITY" | "EXPEDITION",
          locationId: fromLocationId,
          resourceTypeId: parseInt(resourceTypeId),
        },
      },
    });

    if (!sourceStock || sourceStock.quantity < quantity) {
      throw createHttpError(400, "Pas assez de ressources dans la localisation source");
    }

    // Effectuer le transfert
    await prisma.$transaction([
      // Retirer de la source
      prisma.resourceStock.update({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: fromLocationType as "CITY" | "EXPEDITION",
            locationId: fromLocationId,
            resourceTypeId: parseInt(resourceTypeId),
          },
        },
        data: {
          quantity: { decrement: quantity },
        },
      }),
      // Ajouter à la destination
      prisma.resourceStock.upsert({
        where: {
          locationType_locationId_resourceTypeId: {
            locationType: toLocationType as "CITY" | "EXPEDITION",
            locationId: toLocationId,
            resourceTypeId: parseInt(resourceTypeId),
          },
        },
        update: {
          quantity: { increment: quantity },
        },
        create: {
          locationType: toLocationType as "CITY" | "EXPEDITION",
          locationId: toLocationId,
          resourceTypeId: parseInt(resourceTypeId),
          quantity: quantity,
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

import { RequestHandler } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../../shared/errors';
import { container } from "../../infrastructure/container";
import { logger } from "../../services/logger";

/**
 * Récupère toutes les capacités d'un personnage
 */
export const getCharacterCapabilities: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const capabilities = await container.characterCapabilityService.getCharacterCapabilities(id);
    res.status(200).json(capabilities);
  } catch (error) {
    next(new Error("Erreur lors de la récupération des capacités"));
  }
};

/**
 * Récupère les capacités disponibles pour un personnage
 * (celles qu'il ne possède pas encore)
 */
export const getAvailableCapabilities: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const capabilities = await container.characterCapabilityService.getAvailableCapabilities(id);
    res.status(200).json(capabilities);
  } catch (error) {
    next(new Error("Erreur lors de la récupération des capacités disponibles"));
  }
};

/**
 * Ajoute une capacité à un personnage
 */
export const addCharacterCapability: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id, capabilityId } = req.params;
    logger.info(
      `Tentative d'ajout de capacité ${capabilityId} au personnage ${id}`
    );
    const capability = await container.characterCapabilityService.addCharacterCapability(
      id,
      capabilityId
    );
    res.status(201).json(capability);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `Erreur lors de l'ajout de capacité ${req.params.capabilityId} au personnage ${req.params.id}:`,
        { error: error.message }
      );
      if (
        error.message === "Personnage non trouvé" ||
        error.message === "Capacité non trouvée"
      ) {
        next(new NotFoundError(error.message));
      } else if (
        error.message === "Le personnage possède déjà cette capacité"
      ) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error("Erreur lors de l'ajout de la capacité"));
      }
    } else {
      next(new Error("Une erreur inconnue est survenue"));
    }
  }
};

/**
 * Retire une capacité d'un personnage
 */
export const removeCharacterCapability: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id, capabilityId } = req.params;
    await container.characterCapabilityService.removeCharacterCapability(id, capabilityId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Personnage non trouvé" ||
        error.message === "Capacité non trouvée"
      ) {
        next(new NotFoundError(error.message));
      } else if (
        error.message === "Le personnage ne possède pas cette capacité"
      ) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error("Erreur lors de la suppression de la capacité"));
      }
    } else {
      next(new Error("Une erreur inconnue est survenue"));
    }
  }
};

/**
 * Utilise une capacité d'un personnage
 */
export const useCharacterCapability: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { capabilityId, capabilityName, isSummer, paToUse, inputQuantity } =
      req.body;

    // Utiliser le nom ou l'ID selon ce qui est fourni
    const capabilityIdentifier = capabilityId || capabilityName;

    if (!capabilityIdentifier) {
      throw new BadRequestError("capabilityId ou capabilityName requis");
    }

    const result = await container.characterCapabilityService.useCharacterCapability(
      id,
      capabilityIdentifier,
      isSummer,
      paToUse,
      inputQuantity
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Personnage non trouvé" ||
        error.message === "Capacité non trouvée"
      ) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("PA") ||
        error.message.includes("vivres") ||
        error.message.includes("Vivres")
      ) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error("Erreur lors de l'utilisation de la capacité"));
      }
    } else {
      next(new Error("Une erreur inconnue est survenue"));
    }
  }
};

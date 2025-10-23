import { RequestHandler } from "express";
import { NotFoundError, BadRequestError } from '../shared/errors';
import { prisma } from "../util/db";
import { container } from "../infrastructure/container";

export const getAllCapabilities: RequestHandler = async (req, res, next) => {
  try {
    const capabilities = await container.capabilityService.getAllCapabilities();
    res.status(200).json(capabilities);
  } catch (error) {
    next(error);
  }
};

export const createCapability: RequestHandler = async (req, res, next) => {
  try {
    const { name, emojiTag, category, costPA, description } = req.body;

    if (!name || !emojiTag || !category || !costPA) {
      throw new BadRequestError(
        "name, emojiTag, category et costPA sont requis"
      );
    }

    if (!["HARVEST", "CRAFT", "SCIENCE", "SPECIAL"].includes(category)) {
      throw new BadRequestError(
        "category doit être HARVEST, CRAFT, SCIENCE ou SPECIAL"
      );
    }

    if (costPA < 1 || costPA > 4) {
      throw new BadRequestError("costPA doit être entre 1 et 4");
    }

    const capability = await prisma.capability.create({
      data: {
        name,
        emojiTag,
        category,
        costPA,
        description: description || null,
      },
    });

    res.status(201).json(capability);
  } catch (error) {
    next(error);
  }
};

export const getCataplasmeCount: RequestHandler = async (req, res, next) => {
  try {
    const { townId } = req.params;

    if (!townId) {
      throw new BadRequestError("townId requis");
    }

    const count = await container.capabilityService.getCataplasmeCount(townId);

    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

export const executeCouperDuBois: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    const result = await container.capabilityService.executeCouperDuBois(characterId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (error.message.includes("Pas assez")) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

export const executeMiner: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    const result = await container.capabilityService.executeMiner(characterId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (error.message.includes("Pas assez")) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

export const executeFish: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { paSpent } = req.body;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    if (!paSpent || (paSpent !== 1 && paSpent !== 2)) {
      throw new BadRequestError("paSpent doit être 1 ou 2");
    }

    const result = await container.capabilityService.executeFish(characterId, paSpent);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (error.message.includes("Pas assez")) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

export const executeCraft: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { craftType, inputAmount, paSpent } = req.body;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    if (!craftType || !inputAmount || !paSpent) {
      throw new BadRequestError("craftType, inputAmount et paSpent requis");
    }

    if (!Number.isInteger(inputAmount) || inputAmount < 1) {
      throw new BadRequestError("inputAmount doit être un entier positif");
    }

    if (paSpent !== 1 && paSpent !== 2) {
      throw new BadRequestError("paSpent doit être 1 ou 2");
    }

    const result = await container.capabilityService.executeCraft(
      characterId,
      craftType,
      inputAmount,
      paSpent
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("Stock insuffisant") ||
        error.message.includes("PA permet") ||
        error.message.includes("expédition DEPARTED")
      ) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

export const executeSoigner: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { mode, targetCharacterId } = req.body;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    if (!mode || (mode !== "heal" && mode !== "craft")) {
      throw new BadRequestError("mode doit être 'heal' ou 'craft'");
    }

    if (mode === "heal" && !targetCharacterId) {
      throw new BadRequestError("targetCharacterId requis pour le mode heal");
    }

    const result = await container.capabilityService.executeSoigner(
      characterId,
      mode,
      targetCharacterId
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("tous ses PV") ||
        error.message.includes("Limite de cataplasmes")
      ) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

export const executeResearch: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { researchType, paSpent, subject } = req.body;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    if (
      !researchType ||
      !["rechercher", "cartographier", "auspice"].includes(researchType)
    ) {
      throw new BadRequestError(
        "researchType doit être 'rechercher', 'cartographier' ou 'auspice'"
      );
    }

    if (!paSpent || (paSpent !== 1 && paSpent !== 2)) {
      throw new BadRequestError("paSpent doit être 1 ou 2");
    }

    if (!subject) {
      throw new BadRequestError("subject requis");
    }

    const result = await container.capabilityService.executeResearch(
      characterId,
      researchType,
      paSpent
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (error.message.includes("Pas assez")) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

export const executeDivertir: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    // Récupérer la capacité Divertir
    const capability = await container.capabilityService.getCapabilityByName("Divertir");
    if (!capability) {
      throw new NotFoundError("Capability", "Divertir");
    }

    const result = await container.capabilityService.executeDivertir(characterId, capability.id);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (error.message.includes("Pas assez")) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

export const executeHarvest: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { capabilityName } = req.body;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    if (!capabilityName) {
      throw new BadRequestError("capabilityName requis (Chasser ou Cueillir)");
    }

    const isSummer = await container.seasonService.isSummer();

    const result = await container.capabilityService.executeHarvestCapacity(
      characterId,
      capabilityName,
      isSummer
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (error.message.includes("Pas assez")) {
        next(new BadRequestError(error.message));
      } else {
        next(new Error(error.message));
      }
    } else {
      next(new Error("Erreur inconnue"));
    }
  }
};

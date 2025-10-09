import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";
import { CapabilityService } from "../services/capability.service";

const capabilityService = new CapabilityService(prisma);

export const getAllCapabilities: RequestHandler = async (req, res, next) => {
  try {
    const capabilities = await capabilityService.getAllCapabilities();
    res.status(200).json(capabilities);
  } catch (error) {
    next(error);
  }
};

export const executeBûcheronner: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw createHttpError(400, "characterId requis");
    }

    const result = await capabilityService.executeBûcheronner(characterId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("Pas assez")) {
        next(createHttpError(400, error.message));
      } else {
        next(createHttpError(500, error.message));
      }
    } else {
      next(createHttpError(500, "Erreur inconnue"));
    }
  }
};

export const executeMiner: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw createHttpError(400, "characterId requis");
    }

    const result = await capabilityService.executeMiner(characterId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("Pas assez")) {
        next(createHttpError(400, error.message));
      } else {
        next(createHttpError(500, error.message));
      }
    } else {
      next(createHttpError(500, "Erreur inconnue"));
    }
  }
};

export const executeFish: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { paSpent } = req.body;

    if (!characterId) {
      throw createHttpError(400, "characterId requis");
    }

    if (!paSpent || (paSpent !== 1 && paSpent !== 2)) {
      throw createHttpError(400, "paSpent doit être 1 ou 2");
    }

    const result = await capabilityService.executeFish(characterId, paSpent);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("Pas assez")) {
        next(createHttpError(400, error.message));
      } else {
        next(createHttpError(500, error.message));
      }
    } else {
      next(createHttpError(500, "Erreur inconnue"));
    }
  }
};

export const executeCraft: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { craftType, inputAmount, paSpent } = req.body;

    if (!characterId) {
      throw createHttpError(400, "characterId requis");
    }

    if (!craftType || !inputAmount || !paSpent) {
      throw createHttpError(400, "craftType, inputAmount et paSpent requis");
    }

    if (!Number.isInteger(inputAmount) || inputAmount < 1) {
      throw createHttpError(400, "inputAmount doit être un entier positif");
    }

    if (paSpent !== 1 && paSpent !== 2) {
      throw createHttpError(400, "paSpent doit être 1 ou 2");
    }

    const result = await capabilityService.executeCraft(characterId, craftType, inputAmount, paSpent);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("Pas assez") || error.message.includes("Stock insuffisant") || error.message.includes("PA permet") || error.message.includes("expédition DEPARTED")) {
        next(createHttpError(400, error.message));
      } else {
        next(createHttpError(500, error.message));
      }
    } else {
      next(createHttpError(500, "Erreur inconnue"));
    }
  }
};

export const executeSoigner: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { mode, targetCharacterId } = req.body;

    if (!characterId) {
      throw createHttpError(400, "characterId requis");
    }

    if (!mode || (mode !== 'heal' && mode !== 'craft')) {
      throw createHttpError(400, "mode doit être 'heal' ou 'craft'");
    }

    if (mode === 'heal' && !targetCharacterId) {
      throw createHttpError(400, "targetCharacterId requis pour le mode heal");
    }

    const result = await capabilityService.executeSoigner(characterId, mode, targetCharacterId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("Pas assez") || error.message.includes("tous ses PV") || error.message.includes("Limite de cataplasmes")) {
        next(createHttpError(400, error.message));
      } else {
        next(createHttpError(500, error.message));
      }
    } else {
      next(createHttpError(500, "Erreur inconnue"));
    }
  }
};

export const executeResearch: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const { researchType, paSpent, subject } = req.body;

    if (!characterId) {
      throw createHttpError(400, "characterId requis");
    }

    if (!researchType || !['analyser', 'cartographier', 'auspice'].includes(researchType)) {
      throw createHttpError(400, "researchType doit être 'analyser', 'cartographier' ou 'auspice'");
    }

    if (!paSpent || (paSpent !== 1 && paSpent !== 2)) {
      throw createHttpError(400, "paSpent doit être 1 ou 2");
    }

    if (!subject) {
      throw createHttpError(400, "subject requis");
    }

    const result = await capabilityService.executeResearch(characterId, researchType, paSpent, subject);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("Pas assez")) {
        next(createHttpError(400, error.message));
      } else {
        next(createHttpError(500, error.message));
      }
    } else {
      next(createHttpError(500, "Erreur inconnue"));
    }
  }
};

export const executeDivertir: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw createHttpError(400, "characterId requis");
    }

    const result = await capabilityService.executeDivertir(characterId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(createHttpError(404, error.message));
      } else if (error.message.includes("Pas assez")) {
        next(createHttpError(400, error.message));
      } else {
        next(createHttpError(500, error.message));
      }
    } else {
      next(createHttpError(500, "Erreur inconnue"));
    }
  }
};

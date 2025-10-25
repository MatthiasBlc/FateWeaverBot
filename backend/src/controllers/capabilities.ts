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

export const getCataplasmeStock: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    // Get character with town and expedition info
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        town: true,
        expeditionMembers: {
          include: { expedition: true },
        },
      },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    // Determine location (city or DEPARTED expedition)
    const departedExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    const locationType = departedExpedition ? "EXPEDITION" : "CITY";
    const locationId = departedExpedition
      ? departedExpedition.expeditionId
      : character.townId;

    // Get cataplasme resource type
    const { ResourceUtils } = await import("../shared/utils");
    const cataplasmeType = await ResourceUtils.getResourceTypeByName(
      "Cataplasme"
    );

    // Get cataplasme stock
    const { ResourceQueries } = await import("../infrastructure/database/query-builders/resource.queries");
    const stock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(
        locationType,
        locationId,
        cataplasmeType.id
      ),
    });

    const quantity = stock?.quantity || 0;

    res.status(200).json({ quantity });
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

    // Utiliser le nouveau système avec gestion des PA et effects
    const characterCapabilityService = container.characterCapabilityService;
    const result = await characterCapabilityService.useCharacterCapability(
      characterId,
      "Couper du bois"
    );

    res.status(200).json({
      success: result.success,
      woodGained: result.loot?.wood || 0,
      message: result.message,
      publicMessage: result.publicMessage,
      updatedCharacter: result.updatedCharacter,
      luckyRollUsed: result.loot?.wood ? true : false, // Simplified - would need better tracking
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("Capacité non implémentée")
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

export const executeMiner: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    // Utiliser le nouveau système avec gestion des PA et effects
    const characterCapabilityService = container.characterCapabilityService;
    const result = await characterCapabilityService.useCharacterCapability(
      characterId,
      "Miner"
    );

    res.status(200).json({
      success: result.success,
      oreGained: result.loot?.ore || 0,
      message: result.message,
      publicMessage: result.publicMessage,
      updatedCharacter: result.updatedCharacter,
      loot: result.loot,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("Capacité non implémentée")
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

    // Utiliser le nouveau système avec gestion des PA et effects
    const characterCapabilityService = container.characterCapabilityService;
    const result = await characterCapabilityService.useCharacterCapability(
      characterId,
      "Pêcher",
      false, // isSummer
      paSpent
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      publicMessage: result.publicMessage,
      updatedCharacter: result.updatedCharacter,
      loot: result.loot,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("Capacité non implémentée")
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

    // Utiliser le nouveau système avec gestion des PA et effects
    const characterCapabilityService = container.characterCapabilityService;
    const paToUse = mode === "craft" ? 2 : 1;
    const result = await characterCapabilityService.useCharacterCapability(
      characterId,
      "Soigner",
      false, // isSummer
      paToUse,
      targetCharacterId as any // Pass target ID as inputQuantity for now (for heal mode)
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      publicMessage: result.publicMessage,
      updatedCharacter: result.updatedCharacter,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("PA insuffisants") ||
        error.message.includes("Tu n'as plus de PA") ||
        error.message.includes("tous ses PV") ||
        error.message.includes("Limite de cataplasmes") ||
        error.message.includes("Capacité non implémentée")
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

    // Déterminer le nom de la capacité
    const capabilityMap: Record<string, string> = {
      rechercher: "Rechercher",
      cartographier: "Cartographier",
      auspice: "Auspice",
    };

    const capabilityName = capabilityMap[researchType];

    // Utiliser le nouveau système avec gestion des PA et effects
    const characterCapabilityService = container.characterCapabilityService;
    const result = await characterCapabilityService.useCharacterCapability(
      characterId,
      capabilityName,
      false, // isSummer
      paSpent
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      publicMessage: result.publicMessage,
      updatedCharacter: result.updatedCharacter,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("Capacité non implémentée")
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

export const executeDivertir: RequestHandler = async (req, res, next) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      throw new BadRequestError("characterId requis");
    }

    // Utiliser le nouveau système avec gestion des PA et effects
    const characterCapabilityService = container.characterCapabilityService;
    const result = await characterCapabilityService.useCharacterCapability(
      characterId,
      "Divertir"
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      publicMessage: result.publicMessage,
      updatedCharacter: result.updatedCharacter,
      divertCounter: result.divertCounter,
      pmGained: result.pmGained,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("Capacité non implémentée")
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

    // Utiliser le nouveau système avec gestion des PA et effects
    const characterCapabilityService = container.characterCapabilityService;
    const result = await characterCapabilityService.useCharacterCapability(
      characterId,
      capabilityName,
      isSummer
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      publicMessage: result.publicMessage,
      updatedCharacter: result.updatedCharacter,
      loot: result.loot,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        next(new NotFoundError(error.message));
      } else if (
        error.message.includes("Pas assez") ||
        error.message.includes("Capacité non implémentée")
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

export const updateCapability: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, emojiTag, category, costPA, description } = req.body;

    if (!id) {
      throw new BadRequestError("ID de la capacité requis");
    }

    // Vérifier que la capacité existe
    const existing = await prisma.capability.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError("Capacité", id);
    }

    if (category && !["HARVEST", "CRAFT", "SCIENCE", "SPECIAL"].includes(category)) {
      throw new BadRequestError(
        "category doit être HARVEST, CRAFT, SCIENCE ou SPECIAL"
      );
    }

    if (costPA && (costPA < 1 || costPA > 4)) {
      throw new BadRequestError("costPA doit être entre 1 et 4");
    }

    const capability = await prisma.capability.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(emojiTag && { emojiTag }),
        ...(category && { category }),
        ...(costPA && { costPA }),
        ...(description !== undefined && { description: description || null })
      }
    });

    res.status(200).json(capability);
  } catch (error) {
    next(error);
  }
};

export const deleteCapability: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestError("ID de la capacité requis");
    }

    // Vérifier que la capacité existe
    const existing = await prisma.capability.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError("Capacité", id);
    }

    const capability = await prisma.capability.delete({
      where: { id }
    });

    res.status(200).json(capability);
  } catch (error) {
    next(error);
  }
};

import { RequestHandler } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../../shared/errors';
import { Prisma } from "@prisma/client";
import { prisma } from "../../util/db";
import { logger } from "../../services/logger";
import { notifyAgonyEntered } from "../../util/agony-notification";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";
import { ResourceQueries } from "../../infrastructure/database/query-builders/resource.queries";
import { ResourceUtils } from "../../shared/utils";
import { CHARACTER, RESOURCES } from "@shared/index";

export const eatFood: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer le personnage avec ses informations d'expédition
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        town: true,
        expeditionMembers: {
          include: {
            expedition: true,
          },
        },
      },
    });

    if (!character) throw new NotFoundError("Character", id);
    if (character.isDead) throw new BadRequestError("Ce personnage est mort");
    if (character.hungerLevel >= 4)
      throw new BadRequestError("Tu n'as pas faim");

    const foodToConsume = 1;

    // Récupérer le type de ressource "Vivres"
    const vivresType = await ResourceUtils.getResourceTypeByName("Vivres");

    // Déterminer la source des vivres selon la logique demandée
    let locationType: "CITY" | "EXPEDITION";
    let locationId: string;
    let stockName: string;

    // Vérifier si le personnage est en expédition
    const activeExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    if (activeExpedition) {
      // Personnage en expédition DEPARTED → consommer de l'expédition
      locationType = "EXPEDITION";
      locationId = activeExpedition.expeditionId;
      stockName = `expédition "${activeExpedition.expedition.name}"`;
    } else {
      // Personnage en ville ou expédition LOCKED → consommer de la ville
      locationType = "CITY";
      locationId = character.townId;
      stockName = `ville "${character.town.name}"`;
    }

    // Récupérer le stock approprié
    const foodStock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(
        locationType,
        locationId,
        vivresType.id
      ),
    });

    if (!foodStock || foodStock.quantity < foodToConsume) {
      throw new BadRequestError(
        `${stockName} n'a que ${foodStock?.quantity || 0} vivres`
      );
    }

    const newHungerLevel = Math.min(4, character.hungerLevel + 1);

    // Apply agony rules when hunger changes
    const { applyAgonyRules } = await import("../../util/agony");
    const agonyUpdate = applyAgonyRules(
      character.hp,
      character.hungerLevel,
      character.agonySince,
      undefined, // HP not changing
      newHungerLevel
    );

    const result = await prisma.$transaction(async (tx) => {
      const updatedCharacter = await tx.character.update({
        where: { id },
        data: {
          hungerLevel:
            agonyUpdate.hungerLevel !== undefined
              ? agonyUpdate.hungerLevel
              : newHungerLevel,
          hp: agonyUpdate.hp,
          agonySince: agonyUpdate.agonySince,
        },
        include: {
          user: true,
          town: {
            include: {
              guild: true,
            },
          },
        },
      });

      // Retirer les vivres du stock approprié (ville ou expédition)
      await tx.resourceStock.update({
        where: ResourceQueries.stockWhere(
          locationType,
          locationId,
          vivresType.id
        ),
        data: {
          quantity: { decrement: foodToConsume },
        },
      });

      // Récupérer le stock mis à jour pour la réponse
      const updatedStock = await tx.resourceStock.findUnique({
        where: ResourceQueries.stockWhere(
          locationType,
          locationId,
          vivresType.id
        ),
      });

      return {
        character: updatedCharacter,
        stockQuantity: updatedStock?.quantity || 0,
        stockName,
      };
    });

    // Send notification if character entered agony (eating food should prevent it, but safety check)
    if (
      agonyUpdate.enteredAgony &&
      result.character.town.guild.discordGuildId
    ) {
      await notifyAgonyEntered(
        result.character.town.guild.discordGuildId,
        result.character.name || result.character.user.username,
        "other"
      );
    }

    res.status(200).json({
      character: {
        id: result.character.id,
        name: result.character.name,
        hungerLevel: result.character.hungerLevel,
        user: { username: result.character.user.username },
      },
      town: {
        name: character.town.name,
        foodStock: result.stockQuantity,
      },
      foodConsumed: foodToConsume,
    });
  } catch (error) {
    next(error);
  }
};

export const eatFoodAlternative: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { foodType } = req.body; // Nom du type de ressource à consommer

    if (!foodType) {
      throw new BadRequestError("foodType est requis");
    }

    // Récupérer le personnage avec ses informations d'expédition
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        town: true,
        expeditionMembers: {
          include: {
            expedition: true,
          },
        },
      },
    });

    if (!character) throw new NotFoundError("Character", id);
    if (character.isDead) throw new BadRequestError("Ce personnage est mort");
    if (character.hungerLevel >= 4)
      throw new BadRequestError("Tu n'as pas faim");

    const foodToConsume = 1;

    // Récupérer le type de ressource demandé
    const resourceType = await ResourceUtils.getResourceTypeByName(
      foodType
    );

    // Déterminer la source des ressources selon la logique demandée
    let locationType: "CITY" | "EXPEDITION";
    let locationId: string;
    let stockName: string;

    // Vérifier si le personnage est en expédition DEPARTED
    const activeExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    if (activeExpedition) {
      // Personnage en expédition DEPARTED → consommer de l'expédition
      locationType = "EXPEDITION";
      locationId = activeExpedition.expeditionId;
      stockName = `expédition "${activeExpedition.expedition.name}"`;
    } else {
      // Personnage en ville ou expédition LOCKED → consommer de la ville
      locationType = "CITY";
      locationId = character.townId;
      stockName = `ville "${character.town.name}"`;
    }

    // Récupérer le stock approprié
    const foodStock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(
        locationType,
        locationId,
        resourceType.id
      ),
    });

    if (!foodStock || foodStock.quantity < foodToConsume) {
      throw new BadRequestError(
        `${stockName} n'a que ${foodStock?.quantity || 0} ${resourceType.name}`
      );
    }

    const newHungerLevel = Math.min(4, character.hungerLevel + 1);

    // Apply agony rules when hunger changes
    const { applyAgonyRules: applyAgonyRules2 } = await import("../../util/agony");
    const agonyUpdate2 = applyAgonyRules2(
      character.hp,
      character.hungerLevel,
      character.agonySince,
      undefined, // HP not changing
      newHungerLevel
    );

    const result = await prisma.$transaction(async (tx) => {
      const updatedCharacter = await tx.character.update({
        where: { id },
        data: {
          hungerLevel:
            agonyUpdate2.hungerLevel !== undefined
              ? agonyUpdate2.hungerLevel
              : newHungerLevel,
          hp: agonyUpdate2.hp,
          agonySince: agonyUpdate2.agonySince,
        },
        include: {
          user: true,
          town: {
            include: {
              guild: true,
            },
          },
        },
      });

      // Retirer les ressources du stock approprié (ville ou expédition)
      await tx.resourceStock.update({
        where: ResourceQueries.stockWhere(
          locationType,
          locationId,
          resourceType.id
        ),
        data: {
          quantity: { decrement: foodToConsume },
        },
      });

      // Récupérer le stock mis à jour pour la réponse
      const updatedStock = await tx.resourceStock.findUnique({
        where: ResourceQueries.stockWhere(
          locationType,
          locationId,
          resourceType.id
        ),
      });

      return {
        character: updatedCharacter,
        stockQuantity: updatedStock?.quantity || 0,
        stockName,
        resourceTypeName: resourceType.name,
      };
    });

    // Send notification if character entered agony (eating food should prevent it, but safety check)
    if (
      agonyUpdate2.enteredAgony &&
      result.character.town.guild.discordGuildId
    ) {
      await notifyAgonyEntered(
        result.character.town.guild.discordGuildId,
        result.character.name || result.character.user.username,
        "other"
      );
    }

    res.status(200).json({
      character: {
        id: result.character.id,
        name: result.character.name,
        hungerLevel: result.character.hungerLevel,
        user: { username: result.character.user.username },
      },
      town: {
        name: character.town.name,
        foodStock: result.stockQuantity,
      },
      foodConsumed: foodToConsume,
      resourceTypeConsumed: result.resourceTypeName,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCharacterStats: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paTotal, hungerLevel, hp, pm, isDead, canReroll, isActive } =
      req.body;

    // Get current character state to apply agony rules
    const currentCharacter = await prisma.character.findUnique({
      where: { id },
      select: { hp: true, hungerLevel: true, agonySince: true },
    });

    if (!currentCharacter) {
      throw new NotFoundError("Character", id);
    }

    const updateData: Prisma.CharacterUpdateInput = { updatedAt: new Date() };

    if (paTotal !== undefined) updateData.paTotal = paTotal;
    if (hungerLevel !== undefined) updateData.hungerLevel = hungerLevel;
    if (hp !== undefined) updateData.hp = hp;
    if (pm !== undefined) updateData.pm = pm;
    if (isDead !== undefined) updateData.isDead = isDead;
    if (canReroll !== undefined) updateData.canReroll = canReroll;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Vérifier si le personnage doit mourir (PV = 0, PM = 0)
    const shouldDie =
      (hp !== undefined && hp <= 0) || (pm !== undefined && pm <= 0);

    // Store agonyUpdate for notification check later
    let agonyUpdate: any = null;

    if (shouldDie) {
      updateData.isDead = true;
      updateData.paTotal = 0;
      updateData.hungerLevel = 0;
      updateData.hp = 0;
      updateData.pm = 0;
      updateData.agonySince = null; // Clear agony on death
    } else if (isDead === true) {
      // Cas où isDead est explicitement défini à true
      updateData.paTotal = 0;
      updateData.hungerLevel = 0;
      updateData.hp = 0;
      updateData.pm = 0;
      updateData.agonySince = null; // Clear agony on death
    } else {
      // Apply agony rules (only if not dying)
      const { applyAgonyRules } = await import("../../util/agony");
      agonyUpdate = applyAgonyRules(
        currentCharacter.hp,
        currentCharacter.hungerLevel,
        currentCharacter.agonySince,
        hp,
        hungerLevel
      );

      // Merge agony updates into updateData
      if (agonyUpdate.hp !== undefined) updateData.hp = agonyUpdate.hp;
      if (agonyUpdate.hungerLevel !== undefined)
        updateData.hungerLevel = agonyUpdate.hungerLevel;
      if (agonyUpdate.agonySince !== undefined)
        updateData.agonySince = agonyUpdate.agonySince;
    }

    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        town: { include: { guild: true } },
      },
    });

    // Send notification if character entered agony during this update
    if (
      agonyUpdate &&
      agonyUpdate.enteredAgony &&
      updatedCharacter.town.guild.discordGuildId
    ) {
      // Determine cause based on what changed
      let cause: "hunger" | "damage" | "other" = "other";
      if (hp !== undefined && hp === 1) {
        cause = "damage";
      } else if (hungerLevel !== undefined && hungerLevel === 0) {
        cause = "hunger";
      }

      await notifyAgonyEntered(
        updatedCharacter.town.guild.discordGuildId,
        updatedCharacter.name || updatedCharacter.user.username,
        cause
      );
    }

    res.status(200).json(updatedCharacter);
  } catch (error) {
    next(error);
  }
};

export const useCataplasme: RequestHandler = async (req, res, next) => {
  try {
    const { id: characterId } = req.params;

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        expeditionMembers: {
          include: { expedition: true },
        },
      },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    if (character.isDead) {
      throw new BadRequestError("Personnage mort");
    }

    if (character.hp >= 5) {
      throw new BadRequestError("PV déjà au maximum");
    }

    // Vérifier si le personnage est en agonie affamé (hungerLevel=0 ET hp=1)
    if (character.hungerLevel === 0 && character.hp === 1) {
      throw new BadRequestError(
        "Mieux vaudrait manger avant de gaspiller des soins."
      );
    }

    // Determine location (city or DEPARTED expedition)
    const departedExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    const locationType = departedExpedition ? "EXPEDITION" : "CITY";
    const locationId = departedExpedition
      ? departedExpedition.expeditionId
      : character.townId;

    // Check cataplasme availability
    const cataplasmeType = await ResourceUtils.getResourceTypeByName(
      "Cataplasme"
    );

    const stock = await prisma.resourceStock.findUnique({
      where: ResourceQueries.stockWhere(
        locationType,
        locationId,
        cataplasmeType.id
      ),
    });

    if (!stock || stock.quantity < 1) {
      throw new BadRequestError("Aucun cataplasme disponible");
    }

    // Use cataplasme
    await prisma.$transaction(async (tx) => {
      // Remove 1 cataplasme
      await tx.resourceStock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: 1 } },
      });

      // Calculate new HP
      const newHp = Math.min(5, character.hp + 1);

      // Apply agony rules
      const { applyAgonyRules } = await import("../../util/agony");
      const agonyUpdate = applyAgonyRules(
        character.hp,
        character.hungerLevel,
        character.agonySince,
        newHp,
        undefined // hunger not changing
      );

      // Heal +1 HP and update agony status
      await tx.character.update({
        where: { id: characterId },
        data: {
          hp: agonyUpdate.hp !== undefined ? agonyUpdate.hp : newHp,
          agonySince: agonyUpdate.agonySince,
        },
      });
    });

    res.json({
      success: true,
      message: `${character.name} utilise 1 ${RESOURCES.CATAPLASM} et retrouve des forces (+1 PV ${CHARACTER.HP_FULL}).`,
    });
  } catch (error) {
    next(error);
  }
};

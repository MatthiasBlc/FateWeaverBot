import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { getHuntYield } from "../../../util/capacityRandom";
import { RESOURCES, CHARACTER, CAPABILITIES } from "@shared/index";

/**
 * Capacité Chasser
 * Permet de chasser pour obtenir des vivres
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur)
 */
export class ChasserCapability extends BaseCapability {
  readonly name = "Chasser";
  readonly category = "HARVEST" as const;

  private getPrivateMessage(foodAmount: number): string {
    if (foodAmount === 0) {
      return `Les proies étaient trop bien cachées aujourd'hui… Tu as dépensé 2 PA${CHARACTER.PA} et rapporté 0 ${RESOURCES.FOOD}.`;
    } else if (foodAmount <= 8) {
      return `De retour de la chasse ! Tu as dépensé 2 PA${CHARACTER.PA} et rapporté ${foodAmount} ${RESOURCES.FOOD}.`;
    } else {
      return `Quelle chasse incroyable ! Tu as dépensé 2 PA${CHARACTER.PA} et rapporté ${foodAmount} ${RESOURCES.FOOD} !`;
    }
  }

  private getPublicMessage(characterName: string, foodAmount: number): string {
    if (foodAmount === 0) {
      return `${CAPABILITIES.HUNT} Malheureusement, ${characterName} est rentré de la chasse les mains vides…`;
    } else if (foodAmount <= 8) {
      return `${CAPABILITIES.HUNT} ${characterName} est revenu de la chasse avec ${foodAmount} ${RESOURCES.FOOD} !`;
    } else {
      return `${CAPABILITIES.HUNT} Festin en perspective ! ${characterName} est rentré de la chasse avec ${foodAmount} ${RESOURCES.FOOD}.`;
    }
  }

  async execute(
    characterId: string,
    capabilityId: string,
    params?: { isSummer?: boolean }
  ): Promise<CapabilityExecutionResult> {
    const isSummer = params?.isSummer ?? true;

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    // Vérifier si le personnage a le bonus LUCKY_ROLL
    const hasBonus = await hasLuckyRollBonus(
      characterId,
      capabilityId,
      this.prisma
    );

    const foodAmount = getHuntYield(isSummer, hasBonus);

    return {
      success: foodAmount > 0,
      message: this.getPrivateMessage(foodAmount),
      publicMessage: this.getPublicMessage(character.name, foodAmount),
      paConsumed: 2,
      loot: { Vivres: foodAmount },
      metadata: {
        bonusApplied: hasBonus ? ["LUCKY_ROLL"] : [],
      },
    };
  }
}

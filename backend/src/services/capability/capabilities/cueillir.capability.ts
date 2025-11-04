import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { getGatherYield } from "../../../util/capacityRandom";
import { RESOURCES, CHARACTER, CAPABILITIES } from '../../../../shared/index';

/**
 * Capacité Cueillir
 * Permet de cueillir pour obtenir des vivres
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur)
 */
export class CueillirCapability extends BaseCapability {
  readonly name = "Cueillir";
  readonly category = "HARVEST" as const;

  private getPrivateMessage(foodAmount: number, paToUse: number = 1): string {
    if (foodAmount === 0) {
      return `L'hiver est rude, la terre gelée… Tu n'as rien trouvé. Tu as dépensé ${paToUse} PA${CHARACTER.PA} et rapporté 0 ${RESOURCES.FOOD}.`;
    } else {
      return `De retour de cueillette ! Tu as dépensé ${paToUse} PA${CHARACTER.PA} et rapporté ${foodAmount} ${RESOURCES.FOOD}`;
    }
  }

  private getPublicMessage(characterName: string, foodAmount: number): string {
    if (foodAmount === 0) {
      return `${CAPABILITIES.GATHER} L'hiver est rude, la terre gelée… ${characterName} est rentré de cueillette les mains vides.`;
    } else {
      return `${CAPABILITIES.GATHER} ${characterName} rentre de cueillette avec ${foodAmount} ${RESOURCES.FOOD}.`;
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

    const gatherResult = getGatherYield(isSummer, hasBonus);
    const foodAmount = gatherResult.result;
    const paToUse = 1;

    const debugLogs: string[] = [];
    if (gatherResult.debugLog) {
      debugLogs.push(gatherResult.debugLog);
    }

    return {
      success: foodAmount > 0,
      message: this.getPrivateMessage(foodAmount, paToUse),
      publicMessage: this.getPublicMessage(character.name, foodAmount),
      paConsumed: paToUse,
      loot: { Vivres: foodAmount },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
      },
      debugLogs: debugLogs.length > 0 ? debugLogs : undefined,
    };
  }
}

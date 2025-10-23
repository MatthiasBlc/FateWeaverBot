import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { getHuntYield } from "../../../util/capacityRandom";

/**
 * Capacité Chasser
 * Permet de chasser pour obtenir des vivres
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur)
 */
export class ChasserCapability extends BaseCapability {
  readonly name = "Chasser";
  readonly category = "HARVEST" as const;

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
      message: `Vous avez chassé avec succès ! Vous avez obtenu ${foodAmount} vivres.`,
      publicMessage: `🦌 ${character.name} est revenu de la chasse avec ${foodAmount} vivres !`,
      paConsumed: 2,
      loot: { Vivres: foodAmount },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
      },
    };
  }
}

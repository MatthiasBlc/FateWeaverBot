import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { getGatherYield } from "../../../util/capacityRandom";

/**
 * Capacité Cueillir
 * Permet de cueillir pour obtenir des vivres
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur)
 */
export class CueillirCapability extends BaseCapability {
  readonly name = "Cueillir";
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

    const foodAmount = getGatherYield(isSummer, hasBonus);

    const message = hasBonus
      ? `Vous avez cueilli avec succès ! Vous avez obtenu ${foodAmount} vivres ⭐ (Lucky Roll).`
      : `Vous avez cueilli avec succès ! Vous avez obtenu ${foodAmount} vivres.`;

    return {
      success: foodAmount > 0,
      message,
      publicMessage: `🌿 ${character.name} a cueilli ${foodAmount} vivres${hasBonus ? ' ⭐' : ' !'}`,
      paConsumed: 2,
      loot: { Vivres: foodAmount },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
      },
    };
  }
}

import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";

/**
 * Capacité Couper du bois
 * Permet de récolter du bois (2-3 unités)
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur)
 */
export class CouperDuBoisCapability extends BaseCapability {
  readonly name = "Couper du bois";
  readonly category = "HARVEST" as const;

  async execute(
    characterId: string,
    capabilityId: string,
    params?: Record<string, any>
  ): Promise<CapabilityExecutionResult> {
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

    let woodAmount: number;
    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde le meilleur
      const roll1 = Math.floor(Math.random() * 2) + 2; // 2-3
      const roll2 = Math.floor(Math.random() * 2) + 2; // 2-3
      woodAmount = Math.max(roll1, roll2);
      console.log(
        `[LUCKY_WOOD] Personnage: ${character.name} | Roll 1: ${roll1} | Roll 2: ${roll2} | Résultat: ${woodAmount}`
      );
    } else {
      woodAmount = Math.floor(Math.random() * 2) + 2; // 2-3
    }

    return {
      success: true,
      message: `Vous avez coupé ${woodAmount} bois.`,
      publicMessage: `🪓 ${character.name} a coupé ${woodAmount} bois !`,
      paConsumed: 2,
      loot: { Bois: woodAmount },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
      },
    };
  }
}

import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { RESOURCES, CHARACTER, CAPABILITIES } from '../../../../shared/index';

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
      message: `Une bonne chose de faite ! Tu as dépensé 1 PA${CHARACTER.PA} et obtenu ${woodAmount} ${RESOURCES.WOOD}.`,
      publicMessage: `${CAPABILITIES.CHOPPING} ${character.name} a coupé du bois et revient avec ${woodAmount} ${RESOURCES.WOOD}.`,
      paConsumed: 1,
      loot: { Bois: woodAmount },
      metadata: {
        bonusApplied: hasBonus ? ["LUCKY_ROLL"] : [],
      },
    };
  }
}

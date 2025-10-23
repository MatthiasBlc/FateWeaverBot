import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";

/**
 * Capacité Miner
 * Permet de miner pour obtenir du minerai (2-6 unités)
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur)
 */
export class MinerCapability extends BaseCapability {
  readonly name = "Miner";
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

    let oreAmount: number;
    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde le meilleur
      const roll1 = Math.floor(Math.random() * 5) + 2; // 2-6
      const roll2 = Math.floor(Math.random() * 5) + 2; // 2-6
      oreAmount = Math.max(roll1, roll2);
      console.log(
        `[LUCKY_MINE] Personnage: ${character.name} | Roll 1: ${roll1} | Roll 2: ${roll2} | Résultat: ${oreAmount}`
      );
    } else {
      oreAmount = Math.floor(Math.random() * 5) + 2; // 2-6
    }

    const message = hasBonus
      ? `Vous avez miné ${oreAmount} minerai ⭐ (Lucky Roll).`
      : `Vous avez miné ${oreAmount} minerai.`;

    return {
      success: true,
      message,
      publicMessage: `⛏️ ${character.name} a miné ${oreAmount} minerai${hasBonus ? ' ⭐' : ' !'}`,
      paConsumed: 2,
      loot: { Minerai: oreAmount },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
      },
    };
  }
}

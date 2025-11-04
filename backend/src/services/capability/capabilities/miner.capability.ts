import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { CAPABILITIES, RESOURCES } from '../../../../shared/index';

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
    const debugLogs: string[] = [];

    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde le meilleur
      const roll1 = Math.floor(Math.random() * 5) + 2; // 2-6
      const roll2 = Math.floor(Math.random() * 5) + 2; // 2-6
      oreAmount = Math.max(roll1, roll2);
      const debugLog = `[LUCKY_MINE] Personnage: ${character.name} | Roll 1: ${roll1} | Roll 2: ${roll2} | Résultat: ${oreAmount}`;
      console.log(debugLog);
      debugLogs.push(debugLog);
    } else {
      oreAmount = Math.floor(Math.random() * 5) + 2; // 2-6
    }

    return {
      success: true,
      message: `De retour des montagnes. Tu as trouvé un nouveau filon et extrait ${oreAmount} ${RESOURCES.MINERAL}.`,
      publicMessage: `${CAPABILITIES.MINING} ${character.name}  a trouvé un joli filon et revient avec ${oreAmount} ${RESOURCES.MINERAL} !`,
      paConsumed: 2,
      loot: { Minerai: oreAmount },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
      },
      debugLogs: debugLogs.length > 0 ? debugLogs : undefined,
    };
  }
}

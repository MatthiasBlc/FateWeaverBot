import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError, BadRequestError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { ResourceUtils } from "../../../shared/utils";
import { CAPABILITIES, RESOURCES } from '../../../../shared/index';

/**
 * Capacité Cuisiner
 * Permet de transformer des vivres en repas
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur)
 */
export class CuisinerCapability extends BaseCapability {
  readonly name = "Cuisiner";
  readonly category = "CRAFT" as const;

  private getPrivateMessage(output: number, input: number): string {
    if (output >= input * 2) {
      return `Quel festin ! Tu as transformé ${input} ${RESOURCES.FOOD} en ${output} ${RESOURCES.PREPARED_FOOD} délicieux ${RESOURCES.PREPARED_FOOD}`;
    } else if (output > input) {
      return `Ça sent bon ! Tu as transformé ${input} ${RESOURCES.FOOD} en ${output} ${RESOURCES.PREPARED_FOOD}`;
    } else if (output === input) {
      return `Une recette peu convaincante... Tu as transformé ${input} ${RESOURCES.FOOD} en ${output} ${RESOURCES.PREPARED_FOOD} ${RESOURCES.PREPARED_FOOD}`;
    } else if (output > 0) {
      return `Oulalah, ça sent le brûlé ici ! Les ${input} ${RESOURCES.FOOD} utilisées sont perdues mais tu as réussi à sauver ${output} ${RESOURCES.PREPARED_FOOD} ${RESOURCES.PREPARED_FOOD}`;
    } else {
      return `Oulalah, ça sent le brûlé ici ! Les ${input} ${RESOURCES.FOOD} utilisées sont perdues…`;
    }
  }

  private getPublicMessage(characterName: string, output: number, input: number): string {
    if (output >= input * 2) {
      return `${CAPABILITIES.COOKING} Quel festin ! ${characterName} a transformé ${input} ${RESOURCES.FOOD} en ${output} ${RESOURCES.PREPARED_FOOD} délicieux ${RESOURCES.PREPARED_FOOD}. Bon appétit !`;
    } else if (output > input) {
      return `${CAPABILITIES.COOKING} Ça sent bon ! ${characterName} a transformé ${input} ${RESOURCES.FOOD} en ${output} ${RESOURCES.PREPARED_FOOD}.`;
    } else if (output === input) {
      return `${CAPABILITIES.COOKING} ${characterName} a tenté une nouvelle recette et transformé ${input} ${RESOURCES.FOOD} en ${output} ${RESOURCES.PREPARED_FOOD}. Pas sûr que ce soit vraiment mieux.`;
    } else if (output > 0) {
      return `${CAPABILITIES.COOKING} ${characterName} a tenté une nouvelle recette avec ${input} ${RESOURCES.FOOD}. Ce n'est pas très convaincant mais il a quand même réussi à sauver ${output} ${RESOURCES.PREPARED_FOOD}. Espérons que c'est comestible !`;
    } else {
      return `${CAPABILITIES.COOKING} ${characterName} a tenté une nouvelle recette avec ${input} ${RESOURCES.FOOD} mais sans succès. Une légère odeur de brûlé flotte aux alentours.`;
    }
  }

  async execute(
    characterId: string,
    capabilityId: string,
    params?: { paToUse?: number; vivresToConsume?: number }
  ): Promise<CapabilityExecutionResult> {
    const paToUse = params?.paToUse ?? 1;
    const vivresToConsume = params?.vivresToConsume ?? 0;

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    // Validation PA
    if (paToUse !== 1 && paToUse !== 2) {
      throw new BadRequestError("Vous devez utiliser 1 ou 2 PA pour cuisiner");
    }

    // Déterminer le nombre maximum de vivres utilisables selon les PA
    const maxInput = paToUse === 1 ? 2 : 5;

    // Vérifier qu'il y a des vivres disponibles dans la ville
    const vivresType = await ResourceUtils.getResourceTypeByName("Vivres");
    const vivresStock = await ResourceUtils.getStock(
      "CITY",
      character.townId,
      vivresType.id
    );
    const vivresAvailable = vivresStock?.quantity || 0;

    if (vivresAvailable === 0) {
      throw new BadRequestError("Aucun vivre disponible dans la ville");
    }

    // Déterminer le nombre de vivres à consommer
    const actualVivresToConsume = Math.min(
      vivresToConsume || vivresAvailable,
      vivresAvailable,
      maxInput
    );

    if (actualVivresToConsume === 0) {
      throw new BadRequestError("Aucun vivre à cuisiner");
    }

    // Vérifier le bonus LUCKY_ROLL
    const hasBonus = await hasLuckyRollBonus(
      characterId,
      capabilityId,
      this.prisma
    );

    // Calculer les repas créés
    const maxOutput = paToUse === 1
      ? actualVivresToConsume * 2
      : actualVivresToConsume * 3;

    let repasCreated: number;
    let bonusLogMessage: string | undefined;

    if (hasBonus) {
      const roll1 = Math.floor(Math.random() * (maxOutput + 1));
      const roll2 = Math.floor(Math.random() * (maxOutput + 1));
      repasCreated = Math.max(roll1, roll2);
      bonusLogMessage = `[LUCKY_COOK] PA: ${paToUse} | Vivres: ${actualVivresToConsume} | Max possible: ${maxOutput} | Roll 1: ${roll1} | Roll 2: ${roll2} | Résultat: ${repasCreated}`;
      console.log(bonusLogMessage);
    } else {
      repasCreated = Math.floor(Math.random() * (maxOutput + 1));
    }

    return {
      success: true,
      message: this.getPrivateMessage(repasCreated, actualVivresToConsume),
      publicMessage: this.getPublicMessage(character.name, repasCreated, actualVivresToConsume),
      paConsumed: paToUse,
      loot: {
        Vivres: -actualVivresToConsume,
        Repas: repasCreated,
      },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
        bonusLogMessage,
      },
    };
  }
}

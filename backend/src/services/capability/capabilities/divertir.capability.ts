import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasDivertExtraBonus } from "../../../util/character-validators";
import { RESOURCES, CHARACTER, CAPABILITIES } from '../../../../shared/index';

/**
 * Capacité Divertir
 * Permet de remonter le moral de la ville (concert)
 * Bonus: ENTERTAIN_BURST (5% par PA investi de chance de spectacle instantané)
 */
export class DivertirCapability extends BaseCapability {
  readonly name = "Divertir";
  readonly category = "SPECIAL" as const;

  private getPrivateMessageSpectacle(instantSpectacle: boolean): string {
    if (instantSpectacle) {
      return `Éclair d'inspiration soudaine ! Au diable les répétitions, que le spectacle commence !`;
    } else {
      return `C'est le grand jour ! Installez tréteaux et calicots, le spectacle commence !`;
    }
  }

  private getPrivateMessagePrep(counter: number): string {
    return `Un moment de tranquillité à réviser tes gammes…`;
  }

  private getPublicMessageSpectacle(characterName: string, instantSpectacle: boolean): string {
    if (instantSpectacle) {
      return `${CAPABILITIES.ENTERTAIN} Dans une inspiration soudaine, ${characterName} a donné un grand spectacle pour vous remonter le moral. Tous les spectateurs gagnent 1 ${CHARACTER.MP_FULL} !`;
    } else {
      return `${CAPABILITIES.ENTERTAIN} ${characterName} a donné un grand spectacle qui met du baume au cœur. Tous les spectateurs gagnent 1 ${CHARACTER.MP_FULL} !`;
    }
  }

  private getPublicMessagePrep(characterName: string): string {
    return `${CAPABILITIES.ENTERTAIN} ${characterName} a joué du violon pendant des heures… avec quelques fausses notes !`;
  }

  async execute(
    characterId: string,
    capabilityId: string,
    params?: Record<string, any>
  ): Promise<CapabilityExecutionResult> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const newCounter = character.divertCounter + 1;
    const hasDivertBonus = await hasDivertExtraBonus(
      characterId,
      capabilityId,
      this.prisma
    );

    let instantSpectacle = false;
    let bonusLogMessage: string | undefined;

    if (newCounter < 5 && hasDivertBonus) {
      const chancePercent = newCounter * 5; // 5%, 10%, 15%, 20%
      const roll = Math.floor(Math.random() * 100) + 1;
      instantSpectacle = roll <= chancePercent;
      bonusLogMessage = `[DIVERT_EXTRA] Artiste: ${character.name} | PA investis: ${newCounter}/5 | Chance: ${chancePercent}% | Roll: ${roll}/100 | Spectacle instantané: ${instantSpectacle}`;
      console.log(bonusLogMessage);
    }

    if (newCounter >= 5 || instantSpectacle) {
      // Spectacle déclenché - récupérer tous les personnages de la ville
      const cityCharacters = await this.prisma.character.findMany({
        where: {
          townId: character.townId,
          pm: { lt: 5 },
        },
      });

      const pmEffects = cityCharacters.map((char) => ({
        targetCharacterId: char.id,
        pmChange: 1,
      }));

      return {
        success: true,
        message: this.getPrivateMessageSpectacle(instantSpectacle),
        publicMessage: this.getPublicMessageSpectacle(character.name, instantSpectacle),
        paConsumed: 1,
        effects: pmEffects,
        metadata: {
          divertCounter: 0,
          pmGained: 1,
          bonusApplied: instantSpectacle ? ['ENTERTAIN_BURST'] : [],
          bonusLogMessage: instantSpectacle ? bonusLogMessage : undefined,
        },
      };
    } else {
      // Préparation du spectacle
      return {
        success: true,
        message: this.getPrivateMessagePrep(newCounter),
        publicMessage: this.getPublicMessagePrep(character.name),
        paConsumed: 1,
        metadata: {
          divertCounter: newCounter,
          bonusApplied: [],
        },
      };
    }
  }
}

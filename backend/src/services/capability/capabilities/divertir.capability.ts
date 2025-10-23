import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { hasDivertExtraBonus } from "../../../util/character-validators";

/**
 * Capacité Divertir
 * Permet de remonter le moral de la ville (concert)
 * Bonus: ENTERTAIN_BURST (5% par PA investi de chance de spectacle instantané)
 */
export class DivertirCapability extends BaseCapability {
  readonly name = "Divertir";
  readonly category = "SPECIAL" as const;

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
    if (newCounter < 5 && hasDivertBonus) {
      const chancePercent = newCounter * 5; // 5%, 10%, 15%, 20%
      const roll = Math.floor(Math.random() * 100) + 1;
      instantSpectacle = roll <= chancePercent;
      console.log(
        `[DIVERT_EXTRA] Artiste: ${character.name} | PA investis: ${newCounter}/5 | Chance: ${chancePercent}% | Roll: ${roll}/100 | Spectacle instantané: ${instantSpectacle}`
      );
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

      const message = instantSpectacle
        ? "Votre spectacle remonte le moral de la ville ! ⭐ (Divert Extra - Déclenchement instantané)"
        : "Votre spectacle remonte le moral de la ville !";

      return {
        success: true,
        message,
        publicMessage: `🎭 ${character.name} a donné un grand spectacle qui remonte le moral de la ville ! Tous les citoyens gagnent 1 PM.${instantSpectacle ? ' ⭐' : ''}`,
        paConsumed: 1,
        effects: pmEffects,
        metadata: {
          divertCounter: 0,
          pmGained: 1,
          bonusApplied: instantSpectacle ? ['ENTERTAIN_BURST'] : [],
        },
      };
    } else {
      // Préparation du spectacle
      return {
        success: true,
        message: `Vous préparez un spectacle. Continuez à divertir pour déclencher le concert !`,
        publicMessage: `🎵 ${character.name} prépare un spectacle`,
        paConsumed: 1,
        metadata: {
          divertCounter: newCounter,
          bonusApplied: [],
        },
      };
    }
  }
}

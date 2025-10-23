import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";

/**
 * Capacité Auspice
 * Capacité admin-interpreted - ne génère pas de loot automatique
 * Les admins interprètent les résultats et donnent des prévisions météo
 */
export class AuspiceCapability extends BaseCapability {
  readonly name = "Auspice";
  readonly category = "SCIENCE" as const;

  async execute(
    characterId: string,
    capabilityId: string,
    params?: { paToUse?: number }
  ): Promise<CapabilityExecutionResult> {
    const paToUse = params?.paToUse ?? 1;

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const daysCount = paToUse === 1 ? 1 : 3;
    const message = `Vous observez les cieux (coût : ${paToUse} PA, ${daysCount} jour(s)). Les administrateurs ont été notifiés et vous donneront les prévisions météorologiques.`;
    const publicMessage = `🌦️ **${character.name}** observe les cieux pour prédire la météo ! (**${paToUse} PA dépensés, ${daysCount} jour(s)** {ADMIN_TAG})`;

    return {
      success: true,
      message,
      publicMessage,
      paConsumed: paToUse,
      loot: {},
      metadata: {
        bonusApplied: [],
        daysCount,
      },
    };
  }
}

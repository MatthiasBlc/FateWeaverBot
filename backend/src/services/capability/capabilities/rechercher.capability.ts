import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";

/**
 * Capacité Rechercher
 * Capacité admin-interpreted - ne génère pas de loot automatique
 * Les admins interprètent les résultats et donnent des informations au joueur
 */
export class RechercherCapability extends BaseCapability {
  readonly name = "Rechercher";
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

    const infoCount = paToUse === 1 ? 1 : 3;
    const message = `Vous effectuez vos recherches (coût : ${paToUse} PA, ${infoCount} info(s)). Les administrateurs ont été notifiés et vous donneront les résultats de vos analyses.`;
    const publicMessage = `🔎 **${character.name}** effectue des recherches ! (**${paToUse} PA dépensés, ${infoCount} info(s)** {ADMIN_TAG})`;

    return {
      success: true,
      message,
      publicMessage,
      paConsumed: paToUse,
      loot: {},
      metadata: {
        bonusApplied: [],
        infoCount,
      },
    };
  }
}

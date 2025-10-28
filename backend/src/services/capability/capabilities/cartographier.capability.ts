import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";

/**
 * Capacité Cartographier
 * Capacité admin-interpreted - ne génère pas de loot automatique
 * Les admins interprètent les résultats et donnent des informations au joueur
 */
export class CartographierCapability extends BaseCapability {
  readonly name = "Cartographier";
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

    const message = `Vous travaillez sur vos cartes (coût : ${paToUse} PA). Les administrateurs ont été notifiés et vous donneront les résultats de votre exploration.`;
    const publicMessage = `🗺️ **${character.name}** travaille sur ses cartes ! (**${paToUse} PA dépensés** {ADMIN_TAG})`;

    return {
      success: true,
      message,
      publicMessage,
      paConsumed: paToUse,
      loot: {},
      metadata: {
        bonusApplied: [],
      },
    };
  }
}

import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError } from "../../../shared/errors";
import { getAdminInterpretedBonusObjects } from "../../../util/character-validators";

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
    params?: { paToUse?: number; locations?: string[] }
  ): Promise<CapabilityExecutionResult> {
    const paToUse = params?.paToUse ?? 1;
    const locations = params?.locations ?? [];

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    // Récupérer les objets avec bonus ADMIN_INTERPRETED
    const bonusObjects = await getAdminInterpretedBonusObjects(
      characterId,
      capabilityId,
      this.prisma
    );

    const message = `Vous travaillez sur vos cartes (coût : ${paToUse} PA). Les administrateurs ont été notifiés et vous donneront les résultats de votre exploration.`;
    const publicMessage = `🗺️ **${character.name}** travaille sur ses cartes ! (**${paToUse} PA dépensés** {ADMIN_TAG})`;

    return {
      success: true,
      message,
      publicMessage,
      paConsumed: paToUse,
      loot: {},
      metadata: {
        bonusApplied: bonusObjects.length > 0 ? ['ADMIN_INTERPRETED'] : [],
        bonusObjects, // Stocker les noms des objets donnant le bonus
        locations, // Stocker les coordonnées dans metadata
      },
    };
  }
}

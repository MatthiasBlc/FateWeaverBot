import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError, BadRequestError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";

/**
 * Capacité Pêcher
 * Permet de pêcher pour obtenir des ressources ou des objets (Coquillage)
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur index)
 */
export class PecherCapability extends BaseCapability {
  readonly name = "Pêcher";
  readonly category = "HARVEST" as const;

  async execute(
    characterId: string,
    capabilityId: string,
    params?: { paToUse?: 1 | 2 }
  ): Promise<CapabilityExecutionResult> {
    const paToUse = (params?.paToUse ?? 1) as 1 | 2;

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
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

    // Récupérer les entrées de loot depuis la DB
    const lootEntries = await this.capabilityRepo.getFishingLootEntries(paToUse);

    if (lootEntries.length === 0) {
      throw new BadRequestError(
        `Aucune table de loot trouvée pour ${paToUse} PA`
      );
    }

    // Tirer aléatoirement une entrée (ou deux si LUCKY_ROLL)
    let lootEntry;
    if (hasBonus) {
      // LUCKY_ROLL : deux tirages, on garde l'index le plus élevé (meilleur dans la table)
      const randomIndex1 = Math.floor(Math.random() * lootEntries.length);
      const randomIndex2 = Math.floor(Math.random() * lootEntries.length);
      const bestIndex = Math.max(randomIndex1, randomIndex2);
      lootEntry = lootEntries[bestIndex];
      console.log(
        `[LUCKY_FISH] PA: ${paToUse} | Index 1: ${randomIndex1} (${lootEntries[randomIndex1].resourceName} x${lootEntries[randomIndex1].quantity}) | Index 2: ${randomIndex2} (${lootEntries[randomIndex2].resourceName} x${lootEntries[randomIndex2].quantity}) | Meilleur index: ${bestIndex} | Résultat: ${lootEntry.resourceName} x${lootEntry.quantity}`
      );
    } else {
      const randomIndex = Math.floor(Math.random() * lootEntries.length);
      lootEntry = lootEntries[randomIndex];
    }

    // Cas spécial pour Coquillage (objet)
    if (lootEntry.resourceName === "Coquillage") {
      const message = hasBonus
        ? `${character.name} a trouvé un coquillage ! ⭐ (Lucky Roll)`
        : `${character.name} a trouvé un coquillage !`;

      return {
        success: true,
        message,
        publicMessage: `🐚 ${character.name} a trouvé un coquillage${hasBonus ? ' ⭐' : ' !'}`,
        paConsumed: paToUse,
        metadata: {
          bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
          objectFound: 'Coquillage',
        },
      };
    }

    // Cas normal : retourner la ressource dans le loot
    const message = hasBonus
      ? `Vous avez pêché ${lootEntry.quantity} ${lootEntry.resourceName} ⭐ (Lucky Roll)`
      : `Vous avez pêché ${lootEntry.quantity} ${lootEntry.resourceName}`;

    const publicMessage = hasBonus
      ? `🎣 ${character.name} a pêché ${lootEntry.quantity} ${lootEntry.resourceName} ⭐`
      : `🎣 ${character.name} a pêché ${lootEntry.quantity} ${lootEntry.resourceName}`;

    return {
      success: true,
      message,
      publicMessage,
      paConsumed: paToUse,
      loot: { [lootEntry.resourceName]: lootEntry.quantity },
      metadata: {
        bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
      },
    };
  }
}

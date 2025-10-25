import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError, BadRequestError } from "../../../shared/errors";
import { hasLuckyRollBonus } from "../../../util/character-validators";
import { RESOURCES, CHARACTER, CAPABILITIES } from "@shared/index";

/**
 * Capacité Pêcher
 * Permet de pêcher pour obtenir des ressources ou des objets (Coquillage)
 * Bonus: LUCKY_ROLL (deux tirages, garde le meilleur index)
 */
export class PecherCapability extends BaseCapability {
  readonly name = "Pêcher";
  readonly category = "HARVEST" as const;

  private getPrivateMessage(resourceName: string, quantity: number, paToUse: number): string {
    if (resourceName === "Coquillage") {
      return `De retour d'une pêche… inattendue ! Tu as dépensé ${paToUse} ${CHARACTER.PA} et trouvé un énorme coquillage aux reflets nacrés. Il chante la mer, ses vagues et ses colères… `;
    }

    if (resourceName === "Vivres") {
      if (quantity === 10) {
        return `Une pêche miraculeuse ! Tu as dépensé ${paToUse} ${CHARACTER.PA} et rapporté 10 ${RESOURCES.FOOD} !`;
      } else if (quantity > 0) {
        return `De retour de la pêche ! Tu as dépensé ${paToUse} ${CHARACTER.PA} et rapporté ${quantity} ${RESOURCES.FOOD}`;
      } else {
        return `Ce n'est pas une pêche très fructueuse aujourd'hui… Tu as dépensé ${paToUse} ${CHARACTER.PA} et rapporté 0 ${RESOURCES.FOOD}.`;
      }
    }

    if (resourceName === "Bois") {
      return `Pas de poisson aujourd'hui, mais des débris se sont pris dans ton filet. Tu as dépensé ${paToUse} ${CHARACTER.PA} et rapporté ${quantity} ${RESOURCES.WOOD}.`;
    }

    if (resourceName === "Minerai") {
      return `Pas de poisson aujourd'hui, mais des débris se sont pris dans ton filet. Tu as dépensé ${paToUse} ${CHARACTER.PA} et rapporté ${quantity} ${RESOURCES.MINERAL}.`;
    }

    // Fallback
    return `De retour de la pêche ! Tu as dépensé ${paToUse} ${CHARACTER.PA} et rapporté ${quantity} ${resourceName}`;
  }


  private getPublicMessage(characterName: string, resourceName: string, quantity: number): string {
    if (resourceName === "Coquillage") {
      return `${CAPABILITIES.FISH} ${characterName} revient de la pêche avec un superbe coquillage aux reflets nacrés. Il chante la mer, ses vagues et ses colères… `;
    }

    if (resourceName === "Vivres") {
      if (quantity === 10) {
        return `${CAPABILITIES.FISH} Une pêche miraculeuse ! ${characterName} a rapporté 10 ${RESOURCES.FOOD} !`;
      } else if (quantity > 0) {
        return `${CAPABILITIES.FISH} ${characterName} revient de la pêche avec ${quantity} ${RESOURCES.FOOD}.`;
      } else {
        return `${CAPABILITIES.FISH} ${characterName} revient de la pêche les mains vides !`;
      }
    }

    if (resourceName === "Bois") {
      return `${CAPABILITIES.FISH} Des débris se sont pris dans son filet de ${characterName} qui revient de la pêche sans poisson mais avec ${quantity} ${RESOURCES.WOOD}.`;
    }

    if (resourceName === "Minerai") {
      return `${CAPABILITIES.FISH} Des débris se sont pris dans son filet de ${characterName} qui revient de la pêche sans poisson mais avec ${quantity} ${RESOURCES.MINERAL}.`;
    }

    // Fallback
    return `${CAPABILITIES.FISH} ${characterName} revient de la pêche avec ${quantity} ${resourceName}.`;
  }


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

    // Vérifier si quelqu'un dans la ville a déjà trouvé un coquillage
    const coquillageFound = await this.prisma.characterInventorySlot.findFirst({
      where: {
        inventory: {
          character: {
            townId: character.townId,
          },
        },
        objectType: {
          name: "Coquillage",
        },
      },
    });

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

    // Si on tire un coquillage mais qu'il a déjà été trouvé, le remplacer par 8 vivres + 4 bois + 4 minerais
    if (lootEntry.resourceName === "Coquillage" && coquillageFound) {
      return {
        success: true,
        message: `De retour de la pêche ! Tu as dépensé ${paToUse} ${CHARACTER.PA} et rapporté 8 ${RESOURCES.FOOD}, 4 ${RESOURCES.WOOD} et 4 ${RESOURCES.MINERAL}`,
        publicMessage: `${CAPABILITIES.FISH} ${character.name} revient de la pêche avec 8 ${RESOURCES.FOOD}, 4 ${RESOURCES.WOOD} et 4 ${RESOURCES.MINERAL}.`,
        paConsumed: paToUse,
        loot: {
          Vivres: 8,
          Bois: 4,
          Minerai: 4,
        },
        metadata: {
          bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
        },
      };
    }

    // Cas spécial pour Coquillage (objet)
    if (lootEntry.resourceName === "Coquillage") {
      return {
        success: true,
        message: this.getPrivateMessage("Coquillage", lootEntry.quantity, paToUse),
        publicMessage: this.getPublicMessage(character.name, "Coquillage", lootEntry.quantity),
        paConsumed: paToUse,
        loot: { [lootEntry.resourceName]: lootEntry.quantity },
        metadata: {
          bonusApplied: hasBonus ? ['LUCKY_ROLL'] : [],
          objectFound: 'Coquillage',
        },
      };
    }

    // Cas normal : retourner la ressource dans le loot
    const message = this.getPrivateMessage(lootEntry.resourceName, lootEntry.quantity, paToUse);
    const publicMessage = this.getPublicMessage(character.name, lootEntry.resourceName, lootEntry.quantity);

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

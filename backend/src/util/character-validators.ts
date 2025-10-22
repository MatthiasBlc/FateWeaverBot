import { Character } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { BadRequestError } from "../shared/errors";

/**
 * Valide qu'un personnage peut utiliser des PA
 * @throws Error si le personnage ne peut pas utiliser de PA
 */
export function validateCanUsePA(character: Character, paRequired: number): void {
  // Agonie (HP=1) : ne peut plus utiliser de PA
  if (character.hp <= 1) {
    throw new BadRequestError("Personnage en agonie : impossible d'utiliser des PA");
  }

  // Déprime (PM=1) ou Dépression (PM=0) : max 1 PA/jour
  if (character.pm <= 1) {
    if (character.paUsedToday + paRequired > 1) {
      const status = character.pm === 1 ? "Déprime" : "Dépression";
      throw new BadRequestError(`${status} : vous ne pouvez utiliser qu'1 PA par jour`);
    }
  }

  // PA insuffisants
  if (character.paTotal < paRequired) {
    throw new BadRequestError("Pas assez de points d'action");
  }
}

/**
 * Consomme des PA et incrémente le compteur quotidien
 */
export async function consumePA(
  characterId: string,
  paAmount: number,
  prisma: PrismaClient
): Promise<void> {
  await prisma.character.update({
    where: { id: characterId },
    data: {
      paTotal: { decrement: paAmount },
      paUsedToday: { increment: paAmount }
    }
  });
}

/**
 * Vérifie si un personnage possède un objet avec le bonus LUCKY_ROLL pour une capacité donnée
 * @param characterId ID du personnage
 * @param capabilityId ID de la capacité
 * @param prisma Instance Prisma
 * @returns true si le personnage a le bonus LUCKY_ROLL pour cette capacité
 */
export async function hasLuckyRollBonus(
  characterId: string,
  capabilityId: string,
  prisma: PrismaClient
): Promise<boolean> {
  // Récupérer l'inventaire du personnage avec les bonus de capacité
  const inventory = await prisma.characterInventory.findUnique({
    where: { characterId },
    include: {
      slots: {
        include: {
          objectType: {
            include: {
              capacityBonuses: {
                where: {
                  capabilityId,
                  bonusType: 'LUCKY_ROLL'
                }
              }
            }
          }
        }
      }
    }
  });

  if (!inventory) {
    return false;
  }

  // Vérifier si au moins un objet a le bonus LUCKY_ROLL pour cette capacité
  return inventory.slots.some(
    slot => slot.objectType.capacityBonuses.length > 0
  );
}

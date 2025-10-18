import { Character } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

/**
 * Valide qu'un personnage peut utiliser des PA
 * @throws Error si le personnage ne peut pas utiliser de PA
 */
export function validateCanUsePA(character: Character, paRequired: number): void {
  // Agonie (HP=1) : ne peut plus utiliser de PA
  if (character.hp <= 1) {
    throw new Error("Personnage en agonie : impossible d'utiliser des PA");
  }

  // Déprime (PM=1) ou Dépression (PM=0) : max 1 PA/jour
  if (character.pm <= 1) {
    if (character.paUsedToday + paRequired > 1) {
      const status = character.pm === 1 ? "Déprime" : "Dépression";
      throw new Error(`${status} : vous ne pouvez utiliser qu'1 PA par jour`);
    }
  }

  // PA insuffisants
  if (character.paTotal < paRequired) {
    throw new Error("Pas assez de points d'action");
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

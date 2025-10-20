import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ActionPointService {
  /**
   * Récupère le nombre de points d'action disponibles pour un personnage
   * Note: La régénération des PA est gérée automatiquement par le CRON à minuit
   */
  async getAvailablePoints(characterId: string): Promise<number> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { paTotal: true },
    });
    return character?.paTotal || 0;
  }

  /**
   * Utilise un point d'action pour un personnage
   * @throws {Error} Si le personnage n'a pas assez de points ou est dans un état bloquant
   */
  async useActionPoint(characterId: string) {
    return await prisma.$transaction(async (tx) => {
      const character = await tx.character.findUnique({
        where: { id: characterId },
        select: { paTotal: true, hp: true, pm: true, isDead: true },
      });

      if (!character) {
        throw new Error("Personnage non trouvé");
      }

      if (character.isDead) {
        throw new Error("Ce personnage est mort");
      }

      // Block PA usage if HP ≤ 1 (Agonie)
      if (character.hp <= 1) {
        throw new Error("Vous êtes en agonie et ne pouvez pas utiliser de PA");
      }

      // PM ≤ 1 (Déprime or Dépression): limit to 1 PA/day
      // This check is now handled by paUsedToday counter in character-validators.ts
      // No need to block here, just let the daily limit apply

      if (character.paTotal <= 0) {
        throw new Error("Pas assez de points d'action disponibles");
      }

      return await tx.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: 1 },
          updatedAt: new Date(),
        },
      });
    });
  }
}

export const actionPointService = new ActionPointService();

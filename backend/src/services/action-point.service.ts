import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ActionPointService {
  /**
   * Récupère le nombre de points d'action disponibles pour un personnage
   * Met à jour le compteur si nécessaire
   */
  async getAvailablePoints(characterId: string): Promise<number> {
    await this.updateCharacterPoints(characterId);
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

      // Block PA usage if PM ≤ 1 (Déprime or Dépression)
      if (character.pm <= 1) {
        throw new Error("Votre moral est trop bas pour utiliser des PA");
      }

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

  /**
   * Met à jour les points d'action d'un personnage en fonction de la dernière mise à jour
   */
  private async updateCharacterPoints(characterId: string): Promise<void> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { lastPaUpdate: true, paTotal: true },
    });

    if (!character) return;

    const now = new Date();
    const lastUpdate = character.lastPaUpdate;
    const daysSinceLastUpdate = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastUpdate > 0) {
      const pointsToAdd = Math.min(
        daysSinceLastUpdate * 2,
        4 - character.paTotal
      );

      if (pointsToAdd > 0) {
        await prisma.character.update({
          where: { id: characterId },
          data: {
            paTotal: { increment: pointsToAdd },
            lastPaUpdate: now,
            updatedAt: now,
          },
        });
      }
    }
  }
}

export const actionPointService = new ActionPointService();

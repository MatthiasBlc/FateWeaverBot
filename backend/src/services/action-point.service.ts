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
   * @throws {Error} Si le personnage n'a pas assez de points
   */
  async useActionPoint(characterId: string) {
    return await prisma.$transaction(async (tx) => {
      const character = await tx.character.findUnique({
        where: { id: characterId },
        select: { paTotal: true },
      });

      if (!character || character.paTotal <= 0) {
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

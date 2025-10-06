import {
  PrismaClient,
  Capability as PrismaCapability,
  CapabilityCategory,
} from "@prisma/client";
import { getHuntYield, getGatherYield } from "../util/capacityRandom";

type CapabilityWithRelations = PrismaCapability & {
  characters: { characterId: string }[];
};

export class CapabilityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Récupère toutes les capacités disponibles
   */
  async getAllCapabilities(): Promise<PrismaCapability[]> {
    return this.prisma.capability.findMany();
  }

  /**
   * Récupère une capacité par son ID
   */
  async getCapabilityById(id: string): Promise<CapabilityWithRelations | null> {
    return this.prisma.capability.findUnique({
      where: { id },
      include: {
        characters: {
          select: { characterId: true },
        },
      },
    });
  }

  /**
   * Récupère une capacité par son nom
   */
  async getCapabilityByName(name: string): Promise<PrismaCapability | null> {
    return this.prisma.capability.findUnique({
      where: { name },
    });
  }

  /**
   * Crée une nouvelle capacité
   */
  async createCapability(data: {
    name: string;
    category: CapabilityCategory;
    costPA: number;
    description?: string;
  }): Promise<PrismaCapability> {
    return this.prisma.capability.create({
      data: {
        name: data.name,
        category: data.category,
        costPA: data.costPA,
        description: data.description,
      },
    });
  }

  /**
   * Met à jour une capacité existante
   */
  async updateCapability(
    id: string,
    data: {
      name?: string;
      category?: CapabilityCategory;
      costPA?: number;
      description?: string | null;
    }
  ): Promise<PrismaCapability> {
    return this.prisma.capability.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        costPA: data.costPA,
        description: data.description,
      },
    });
  }

  /**
   * Supprime une capacité
   */
  async deleteCapability(id: string): Promise<void> {
    await this.prisma.capability.delete({
      where: { id },
    });
  }

  /**
   * Vérifie si un personnage possède une capacité
   */
  async hasCapability(
    characterId: string,
    capabilityId: string
  ): Promise<boolean> {
    const count = await this.prisma.characterCapability.count({
      where: {
        characterId,
        capabilityId,
      },
    });
    return count > 0;
  }

  /**
   * Ajoute une capacité à un personnage
   */
  async addCapabilityToCharacter(
    characterId: string,
    capabilityId: string
  ): Promise<void> {
    await this.prisma.characterCapability.create({
      data: {
        characterId,
        capabilityId,
      },
    });
  }

  /**
   * Supprime une capacité d'un personnage
   */
  async removeCapabilityFromCharacter(
    characterId: string,
    capabilityId: string
  ): Promise<void> {
    await this.prisma.characterCapability.delete({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId,
        },
      },
    });
  }

  /**
   * Récupère toutes les capacités d'un personnage
   */
  async getCharacterCapabilities(
    characterId: string
  ): Promise<PrismaCapability[]> {
    const capabilities = await this.prisma.characterCapability.findMany({
      where: { characterId },
      include: { capability: true },
    });

    return capabilities.map((c) => c.capability);
  }

  /**
   * Incrémente le compteur de divertissement d'un personnage
   * Retourne true si un spectacle a été déclenché
   */
  async incrementDivertCounter(
    characterId: string
  ): Promise<{ success: boolean; showPerformed: boolean }> {
    const character = await this.prisma.character.update({
      where: { id: characterId },
      data: {
        divertCounter: { increment: 1 },
      },
    });

    // Vérifie si un spectacle doit être déclenché (tous les 5)
    if (character.divertCounter >= 5) {
      await this.prisma.character.update({
        where: { id: characterId },
        data: { divertCounter: 0 },
      });
      return { success: true, showPerformed: true };
    }

    return { success: true, showPerformed: false };
  }

  /**
   * Exécute une capacité de récolte (chasse, cueillette, pêche)
   */
  async executeHarvestCapacity(
    characterId: string,
    capabilityName: string,
    isSummer: boolean,
    luckyRoll: boolean = false
  ): Promise<{ success: boolean; foodGained: number; message: string }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    const capability = await this.getCapabilityByName(capabilityName);
    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier que le personnage a la capacité
    const hasCapability = await this.hasCapability(characterId, capability.id);
    if (!hasCapability) {
      throw new Error("Le personnage ne possède pas cette capacité");
    }

    // Vérifier les PA
    if (character.paTotal < capability.costPA) {
      throw new Error("Pas assez de points d'action");
    }

    // Calculer la récolte en fonction de la capacité et de la saison
    let foodGained = 0;
    let message = "";

    switch (capabilityName.toLowerCase()) {
      case "chasser":
        foodGained = getHuntYield(isSummer);
        message = `🦌 ${character.name} est revenu de la chasse avec ${foodGained} vivres !`;
        break;

      case "cueillir":
        foodGained = getGatherYield(isSummer);
        message = `🌿 ${character.name} a cueilli ${foodGained} vivres.`;
        break;

      case "pêcher":
        if (luckyRoll && character.paTotal >= 2) {
          // Double le coût en PA pour le lucky roll
          const roll1 = Math.floor(Math.random() * (isSummer ? 5 : 3));
          const roll2 = Math.floor(Math.random() * (isSummer ? 5 : 3));
          foodGained = Math.max(roll1, roll2);
          message = `🎣 ${character.name} a pêché avec succès et a obtenu ${foodGained} vivres (lucky roll)!`;
        } else {
          foodGained = Math.floor(Math.random() * (isSummer ? 5 : 3));
          message = `🎣 ${character.name} a pêché ${foodGained} vivres.`;
        }
        break;

      default:
        throw new Error("Capacité de récolte non reconnue");
    }

    // Mettre à jour les PA et le stock de nourriture
    await this.prisma.$transaction([
      this.prisma.character.update({
        where: { id: characterId },
        data: {
          paTotal: { decrement: capability.costPA * (luckyRoll ? 2 : 1) },
        },
      }),
      this.prisma.town.update({
        where: { id: character.townId },
        data: { foodStock: { increment: foodGained } },
      }),
    ]);

    return { success: true, foodGained, message };
  }
}

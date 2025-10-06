import {
  PrismaClient,
  Character,
  User,
  Town,
  Guild,
  Capability,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Interface pour les données de création d'un personnage
 */
export interface CreateCharacterData {
  name: string;
  userId: string;
  townId: string;
}

/**
 * Interface pour le résultat d'une capacité
 */
export interface CapabilityResult {
  success: boolean;
  message: string;
  publicMessage: string;
  loot?: {
    food?: number;
    morale?: number;
    foodSupplies?: number;
    [key: string]: number | undefined;
  };
  updatedCharacter?: Character;
  divertCounter?: number;
  pmGained?: number;
}

export interface CharacterWithCapabilities extends Character {
  capabilities?: Array<{
    characterId: string;
    capabilityId: string;
    capability: Capability;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * Type pour un personnage avec ses détails complets
 */
export type CharacterWithDetails = Character & {
  user: User;
  town: Town & { guild: Guild };
  characterRoles: Array<{
    id: string;
    characterId: string;
    roleId: string;
    assignedAt: Date;
    username: string;
    roleName: string;
    role: {
      id: string;
      discordId: string;
      name: string;
      color: string | null;
    };
  }>;
};

export class CharacterService {
  async getCharacterCapabilities(characterId: string) {
    return await prisma.characterCapability.findMany({
      where: { characterId },
      include: {
        capability: true,
      },
      orderBy: {
        capability: {
          name: "asc",
        },
      },
    });
  }

  async getActiveCharacter(
    userId: string,
    townId: string
  ): Promise<CharacterWithDetails | null> {
    return await prisma.character.findFirst({
      where: { userId, townId, isActive: true, isDead: false },
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRerollableCharacters(
    userId: string,
    townId: string
  ): Promise<Character[]> {
    return await prisma.character.findMany({
      where: { userId, townId, isDead: true, canReroll: true, isActive: true },
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
      },
    });
  }

  async createCharacter(data: CreateCharacterData): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      // Désactiver tous les autres personnages de l'utilisateur dans cette ville
      await tx.character.updateMany({
        where: { userId: data.userId, townId: data.townId },
        data: { isActive: false },
      });

      // Créer le nouveau personnage actif
      return await tx.character.create({
        data: {
          name: data.name,
          user: { connect: { id: data.userId } },
          town: { connect: { id: data.townId } },
          isActive: true,
          isDead: false,
          canReroll: false,
          hungerLevel: 4,
          paTotal: 2,
          hp: 5, // Points de vie initiaux
          pm: 5, // Points mentaux initiaux
        },
      });
    });
  }

  async createRerollCharacter(
    userId: string,
    townId: string,
    name: string
  ): Promise<Character> {
    return await prisma.$transaction(async (prisma) => {
      console.log(
        `[createRerollCharacter] Début - userId: ${userId}, townId: ${townId}, name: ${name}`
      );

      // LOGIQUE SIMPLE : Trouver le personnage ACTIF actuel (mort ou vivant)
      // Il y a TOUJOURS un personnage actif par utilisateur par ville
      const currentActiveCharacter = await prisma.character.findFirst({
        where: { userId, townId, isActive: true },
        include: {
          user: true,
          town: { include: { guild: true } },
          characterRoles: { include: { role: true } },
        },
      });

      if (!currentActiveCharacter) {
        throw new Error("No active character found - this should never happen");
      }

      console.log(
        `[createRerollCharacter] Personnage actif actuel: ${currentActiveCharacter.id}, isDead: ${currentActiveCharacter.isDead}, canReroll: ${currentActiveCharacter.canReroll}`
      );

      // SOLUTION ULTRA-SIMPLE : Utiliser la fonction createCharacter existante
      // qui gère déjà correctement la logique de désactivation/création
      const newCharacterData: CreateCharacterData = {
        userId,
        townId,
        name,
      };

      // Créer le nouveau personnage (désactive automatiquement l'ancien)
      const newCharacter = await this.createCharacter(newCharacterData);

      console.log(
        `[createRerollCharacter] ✅ Nouveau personnage créé: ${newCharacter.id}`
      );

      // Nettoyer la permission de reroll si l'ancien personnage était mort
      if (currentActiveCharacter.isDead && currentActiveCharacter.canReroll) {
        await prisma.character.update({
          where: { id: currentActiveCharacter.id },
          data: { canReroll: false },
        });
        console.log(
          `[createRerollCharacter] Permission de reroll nettoyée: ${currentActiveCharacter.id}`
        );
      }

      return newCharacter;
    });
  }

  async killCharacter(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: { isDead: true, hungerLevel: 0, paTotal: 0, hp: 0, pm: 0 },
    });
  }

  async grantRerollPermission(characterId: string): Promise<Character> {
    return await prisma.character.update({
      where: { id: characterId },
      data: { canReroll: true },
    });
  }

  async switchActiveCharacter(
    userId: string,
    townId: string,
    characterId: string
  ): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      await tx.character.updateMany({
        where: { userId, townId, isActive: true },
        data: { isActive: false },
      });
      return await tx.character.update({
        where: { id: characterId, userId, townId, isDead: false },
        data: { isActive: true },
      });
    });
  }

  async getTownCharacters(townId: string): Promise<CharacterWithDetails[]> {
    return await prisma.character.findMany({
      where: {
        townId,
        isActive: true,
        isDead: false,
      },
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
      },
    });
  }

  async needsCharacterCreation(
    userId: string,
    townId: string
  ): Promise<boolean> {
    // Vérifier s'il y a un personnage actif (mort ou vivant)
    const activeCharacter = await prisma.character.findFirst({
      where: { userId, townId, isActive: true },
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
      },
    });

    // Retourne true si aucun personnage actif n'est trouvé (nécessite création)
    return !activeCharacter;
  }

  async addCharacterCapability(characterId: string, capabilityId: string) {
    // Vérifier que la capacité existe
    const capability = await prisma.capability.findUnique({
      where: { id: capabilityId },
    });

    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Vérifier si le personnage a déjà cette capacité
    const existingCapability = await prisma.characterCapability.findUnique({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId,
        },
      },
    });

    if (existingCapability) {
      throw new Error("Le personnage possède déjà cette capacité");
    }

    // Ajouter la capacité au personnage
    await prisma.characterCapability.create({
      data: {
        characterId,
        capabilityId,
      },
    });

    return capability;
  }

  /**
   * Retire une capacité d'un personnage
   */
  async removeCharacterCapability(characterId: string, capabilityId: string) {
    // Vérifier que la capacité existe
    const capability = await prisma.capability.findUnique({
      where: { id: capabilityId },
    });

    if (!capability) {
      throw new Error("Capacité non trouvée");
    }

    // Supprimer la capacité du personnage
    const deleted = await prisma.characterCapability.delete({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId,
        },
      },
      include: {
        capability: true,
      },
    });

    return deleted.capability;
  }

  /**
   * Récupère les capacités disponibles pour un personnage
   * (celles qu'il ne possède pas encore)
   */
  async getAvailableCapabilities(characterId: string) {
    // Récupérer les capacités du personnage
    const characterCapabilities = await prisma.characterCapability.findMany({
      where: { characterId },
      select: { capabilityId: true },
    });

    const characterCapabilityIds = characterCapabilities.map(
      (cc) => cc.capabilityId
    );

    // Récupérer toutes les capacités sauf celles que le personnage possède déjà
    const availableCapabilities = await prisma.capability.findMany({
      where: {
        id: { notIn: characterCapabilityIds },
      },
      orderBy: {
        name: "asc",
      },
    });

    return availableCapabilities;
  }

  /**
   * Utilise une capacité d'un personnage
   */
  async useCharacterCapability(
    characterId: string,
    capabilityIdentifier: string,
    isSummer?: boolean
  ) {
    // Récupérer le personnage avec ses capacités
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        capabilities: {
          include: {
            capability: true,
          },
        },
      },
    }) as CharacterWithCapabilities;

    if (!character) {
      throw new Error("Personnage non trouvé");
    }

    // Vérifier que les capacités sont chargées
    if (!character.capabilities || character.capabilities.length === 0) {
      throw new Error("Capacité non trouvée");
    }

    // Trouver la capacité par ID ou par nom
    const characterCapability = character.capabilities.find(
      (cc) =>
        cc.capability.id === capabilityIdentifier ||
        cc.capability.name === capabilityIdentifier
    );

    if (!characterCapability) {
      throw new Error("Capacité non trouvée");
    }

    const capability = characterCapability.capability;

    // Vérifier les PA nécessaires
    if (character.paTotal < capability.costPA) {
      throw new Error(
        `Pas assez de PA (${character.paTotal}/${capability.costPA} requis)`
      );
    }

    // Logique spécifique selon la capacité
    let result: CapabilityResult = {
      success: true,
      message: "",
      publicMessage: "",
      loot: {},
    };

    switch (capability.name.toLowerCase()) {
      case "chasser":
        result = await this.useHuntingCapability(
          character,
          capability,
          isSummer
        );
        break;
      case "cueillir":
        result = await this.useGatheringCapability(
          character,
          capability,
          isSummer
        );
        break;
      case "pêcher":
        result = await this.useFishingCapability(character, capability, isSummer);
        break;
      case "divertir":
        result = await this.useEntertainmentCapability(character, capability);
        break;
      default:
        throw new Error("Capacité non implémentée");
    }

    // Mettre à jour les PA du personnage et ajouter les ressources à la ville
    const updatedCharacter = await prisma.$transaction(async (tx) => {
      // Mettre à jour les PA du personnage
      const characterUpdate = await tx.character.update({
        where: { id: characterId },
        data: {
          paTotal: character.paTotal - capability.costPA,
          lastPaUpdate: new Date(),
          updatedAt: new Date(),
        },
      });

      // Ajouter les ressources générées au stock de la ville
      if (result.loot && result.loot.foodSupplies && result.loot.foodSupplies > 0) {
        await tx.town.update({
          where: { id: character.townId },
          data: {
            foodStock: {
              increment: result.loot.foodSupplies
            }
          },
        });
      }

      return characterUpdate;
    });

    result.updatedCharacter = updatedCharacter;
    return result;
  }

  /**
   * Capacité de chasse
   */
  /**
   * Utilise la capacité de chasse
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param isSummer Si c'est l'été (affecte le taux de réussite)
   */
  private async useHuntingCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    isSummer?: boolean
  ): Promise<CapabilityResult> {
    // Chasse : été = 2-8 vivres, hiver = 1-4 vivres
    const foodAmount = isSummer
      ? Math.floor(Math.random() * 7) + 2  // 2-8
      : Math.floor(Math.random() * 4) + 1; // 1-4

    if (foodAmount > 0) {
      return {
        success: true,
        message: `Vous avez chassé avec succès ! Vous avez dépensé ${capability.costPA} PA et obtenu ${foodAmount} vivres.`,
        publicMessage: `🏹 ${character.name} est revenu de la chasse avec ${foodAmount} vivres.`,
        loot: { foodSupplies: foodAmount },
      };
    } else {
      return {
        success: false,
        message: `La chasse n'a rien donné cette fois. Vous avez dépensé ${capability.costPA} PA.`,
        publicMessage: `🏹 ${character.name} n'a rien trouvé à chasser.`,
        loot: { foodSupplies: 0 },
      };
    }
  }

  /**
   * Capacité de cueillette
   */
  /**
   * Utilise la capacité de cueillette
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param isSummer Si c'est l'été (affecte le taux de réussite)
   */
  private async useGatheringCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    isSummer?: boolean
  ): Promise<CapabilityResult> {
    // Cueillette : été = 1-3 vivres, hiver = 0-2 vivres
    const foodAmount = isSummer
      ? Math.floor(Math.random() * 3) + 1  // 1-3
      : Math.floor(Math.random() * 3);     // 0-2

    if (foodAmount > 0) {
      return {
        success: true,
        message: `Vous avez cueilli avec succès ! Vous avez dépensé ${capability.costPA} PA et obtenu ${foodAmount} vivres.`,
        publicMessage: `🌿 ${character.name} a cueilli ${foodAmount} vivres.`,
        loot: { foodSupplies: foodAmount },
      };
    } else {
      return {
        success: false,
        message: `La cueillette n'a rien donné cette fois. Vous avez dépensé ${capability.costPA} PA.`,
        publicMessage: `🌿 ${character.name} n'a rien trouvé à cueillir.`,
        loot: { foodSupplies: 0 },
      };
    }
  }

  /**
   * Capacité de pêche
   */
  /**
   * Utilise la capacité de pêche
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   */
  private async useFishingCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    isSummer?: boolean
  ): Promise<CapabilityResult> {
    // Pêche normale : été = 0-4 vivres, hiver = 0-2 vivres
    const maxFood = isSummer ? 4 : 2;
    const foodAmount = Math.floor(Math.random() * (maxFood + 1)); // 0 à maxFood inclus

    if (foodAmount > 0) {
      return {
        success: true,
        message: `Vous avez pêché avec succès ! Vous avez dépensé ${capability.costPA} PA et obtenu ${foodAmount} vivres.`,
        publicMessage: `🎣 ${character.name} a pêché ${foodAmount} vivres.`,
        loot: { foodSupplies: foodAmount },
      };
    } else {
      return {
        success: false,
        message: `La pêche n'a rien donné cette fois. Vous avez dépensé ${capability.costPA} PA.`,
        publicMessage: `🎣 ${character.name} n'a rien attrapé.`,
        loot: { foodSupplies: 0 },
      };
    }
  }

  /**
   * Capacité de divertissement
   */
  /**
   * Utilise la capacité de divertissement
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   */
  private async useEntertainmentCapability(
    character: CharacterWithCapabilities,
    capability: Capability
  ): Promise<CapabilityResult> {
    // Incrémenter le compteur de divertissement
    const newDivertCounter = (character.divertCounter || 0) + 1;

    const pmGained = newDivertCounter >= 5 ? 1 : 0;

    let message = `Vous avez diverti la ville (coût : ${capability.costPA} PA).`;
    if (pmGained > 0) {
      message += ` Tous les habitants gagnent 1 PM !`;
    }

    return {
      success: true,
      message,
      publicMessage: `🎭 ${character.name} a donné un spectacle !${pmGained > 0 ? ' Tout le monde regagne 1 PM.' : ''}`,
      divertCounter: newDivertCounter,
      pmGained,
    };
  }
}

import {
  PrismaClient,
  Character,
  User,
  Town,
  Guild,
  Capability,
} from "@prisma/client";
import { getHuntYield, getGatherYield } from "../util/capacityRandom";

const prisma = new PrismaClient();

/**
 * Interface pour les données de création d'un personnage
 */
export interface CreateCharacterData {
  name: string;
  userId: string;
  townId: string;
  jobId?: number;
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
  paUsed?: number;
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
        job: {
          include: {
            startingAbility: true,
            optionalAbility: true,
          },
        },
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
        job: {
          include: {
            startingAbility: true,
            optionalAbility: true,
          },
        },
      },
    });
  }

  async createCharacter(data: CreateCharacterData): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      // RÈGLE MÉTIER CRITIQUE : Un utilisateur ne peut avoir qu'UN SEUL personnage actif par ville
      // Désactiver TOUS les personnages actifs (morts ou vivants) avant de créer le nouveau
      await tx.character.updateMany({
        where: {
          userId: data.userId,
          townId: data.townId,
          isActive: true,
          // Pas de filtre isDead : on désactive TOUS les personnages actifs
        },
        data: { isActive: false },
      });

      // Créer le nouveau personnage
      const character = await tx.character.create({
        data: {
          name: data.name,
          userId: data.userId,
          townId: data.townId,
          jobId: data.jobId,
          paTotal: 2,
          hungerLevel: 4,
          hp: 5,
          pm: 5,
          isActive: true,
          divertCounter: 0,
        },
      });

      // Lui donner les capacités de base
      const baseCapabilities = ["Couper du bois"];

      for (const capabilityName of baseCapabilities) {
        const capability = await tx.capability.findUnique({
          where: { name: capabilityName },
        });

        if (capability) {
          await tx.characterCapability.create({
            data: {
              characterId: character.id,
              capabilityId: capability.id,
            },
          });
        }
      }

      // Si un métier est fourni, attribuer la capacité de départ
      if (data.jobId) {
        const job = await tx.job.findUnique({
          where: { id: data.jobId },
          include: { startingAbility: true },
        });

        if (job && job.startingAbility) {
          // Vérifier si le personnage a déjà cette capacité
          const hasCapability = await tx.characterCapability.findUnique({
            where: {
              characterId_capabilityId: {
                characterId: character.id,
                capabilityId: job.startingAbility.id,
              },
            },
          });

          // Ajouter la capacité si elle n'existe pas
          if (!hasCapability) {
            await tx.characterCapability.create({
              data: {
                characterId: character.id,
                capabilityId: job.startingAbility.id,
              },
            });
          }
        }
      }

      // Récupérer le personnage avec toutes ses relations (job inclus)
      return await tx.character.findUniqueOrThrow({
        where: { id: character.id },
        include: {
          user: true,
          town: { include: { guild: true } },
          characterRoles: { include: { role: true } },
          job: {
            include: {
              startingAbility: true,
              optionalAbility: true,
            },
          },
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
          job: {
            include: {
              startingAbility: true,
              optionalAbility: true,
            },
          },
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
        // Retourner TOUS les personnages (vivants, morts, actifs, inactifs)
        // pour que character-admin et /profil puissent voir tous les états
      },
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
        job: {
          include: {
            startingAbility: true,
            optionalAbility: true,
          },
        },
      },
      orderBy: [
        { isDead: "asc" }, // Vivants en premier
        { isActive: "desc" }, // Actifs en premier
        { createdAt: "desc" }, // Plus récents en premier
      ],
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
        job: {
          include: {
            startingAbility: true,
            optionalAbility: true,
          },
        },
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
    isSummer?: boolean,
    paToUse?: number,
    inputQuantity?: number
  ) {
    // Récupérer le personnage avec ses capacités
    const character = (await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        capabilities: {
          include: {
            capability: true,
          },
        },
      },
    })) as CharacterWithCapabilities;

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
    if (character.paTotal <= 0) {
      throw new Error(
        `Vous n'avez plus de PA disponibles. Attendez la prochaine régénération quotidienne pour utiliser vos capacités.`
      );
    } else if (character.paTotal < capability.costPA) {
      throw new Error(
        `PA insuffisants : vous avez ${character.paTotal} PA mais ${capability.name} nécessite ${capability.costPA} PA.`
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
        result = await this.useFishingCapability(
          character,
          capability,
          paToUse || 1
        );
        break;
      case "divertir":
        result = await this.useEntertainmentCapability(character, capability);
        break;
      case "couper du bois":
        result = await this.useLoggingCapability(character, capability);
        break;
      case "cuisiner":
        result = await this.useCookingCapability(character, capability, paToUse, inputQuantity);
        break;
      default:
        throw new Error("Capacité non implémentée");
    }

    // Mettre à jour les PA du personnage et ajouter les ressources à la ville
    const updatedCharacter = await prisma.$transaction(async (tx) => {
      // Déterminer le nombre de PA à déduire (utiliser paUsed si défini, sinon costPA)
      const paToDeduct = result.paUsed !== undefined ? result.paUsed : capability.costPA;

      // Mettre à jour les PA du personnage
      const characterUpdate = await tx.character.update({
        where: { id: characterId },
        data: {
          paTotal: character.paTotal - paToDeduct,
          lastPaUpdate: new Date(),
          updatedAt: new Date(),
        },
      });

      // Ajouter les ressources générées au stock de la ville
      if (
        result.loot &&
        result.loot.foodSupplies &&
        result.loot.foodSupplies !== 0
      ) {
        // Récupérer le type de ressource "Vivres"
        const vivresType = await tx.resourceType.findFirst({
          where: { name: "Vivres" },
        });

        if (vivresType) {
          if (result.loot.foodSupplies > 0) {
            // Production de vivres
            await tx.resourceStock.upsert({
              where: {
                locationType_locationId_resourceTypeId: {
                  locationType: "CITY",
                  locationId: character.townId,
                  resourceTypeId: vivresType.id,
                },
              },
              update: {
                quantity: { increment: result.loot.foodSupplies },
              },
              create: {
                locationType: "CITY",
                locationId: character.townId,
                resourceTypeId: vivresType.id,
                quantity: result.loot.foodSupplies,
              },
            });
          } else {
            // Consommation de vivres (valeur négative)
            await tx.resourceStock.update({
              where: {
                locationType_locationId_resourceTypeId: {
                  locationType: "CITY",
                  locationId: character.townId,
                  resourceTypeId: vivresType.id,
                },
              },
              data: {
                quantity: { increment: result.loot.foodSupplies }, // increment avec une valeur négative = décrément
              },
            });
          }
        }
      }

      // Ajouter les repas générés au stock de la ville (pour la capacité cuisiner)
      if (result.loot && result.loot.preparedFood && result.loot.preparedFood > 0) {
        const repasType = await tx.resourceType.findFirst({
          where: { name: "Repas" },
        });

        if (repasType) {
          await tx.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: character.townId,
                resourceTypeId: repasType.id,
              },
            },
            update: {
              quantity: { increment: result.loot.preparedFood },
            },
            create: {
              locationType: "CITY",
              locationId: character.townId,
              resourceTypeId: repasType.id,
              quantity: result.loot.preparedFood,
            },
          });
        }
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
    // Utiliser les nouvelles fonctions de tirage pondéré selon la saison
    const foodAmount = getHuntYield(isSummer ?? true);

    return {
      success: foodAmount > 0,
      message: `Vous avez chassé avec succès ! Vous avez dépensé ${capability.costPA} PA et obtenu ${foodAmount} vivres.`,
      publicMessage: `🦌 ${character.name} est revenu de la chasse avec ${foodAmount} vivres !`,
      loot: { foodSupplies: foodAmount },
    };
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
    // Utiliser les nouvelles fonctions de tirage pondéré selon la saison
    const foodAmount = getGatherYield(isSummer ?? true);

    return {
      success: foodAmount > 0,
      message: `Vous avez cueilli avec succès ! Vous avez dépensé ${capability.costPA} PA et obtenu ${foodAmount} vivres.`,
      publicMessage: `🌿 ${character.name} a cueilli ${foodAmount} vivres.`,
      loot: { foodSupplies: foodAmount },
    };
  }

  /**
   * Capacité de bûcheronnage
   */
  /**
   * Utilise la capacité de bûcheronnage
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param isSummer Si c'est l'été (affecte le taux de réussite)
   */
  private async useLoggingCapability(
    character: CharacterWithCapabilities,
    capability: Capability
  ): Promise<CapabilityResult> {
    // Logique de bûcheronnage : produit du bois (à implémenter selon les besoins)
    // Pour l'instant, on utilise une logique similaire à la pêche
    const woodAmount = Math.floor(Math.random() * 3) + 1; // 1-3 unités de bois

    return {
      success: woodAmount > 0,
      message: `Vous avez bûcheronné avec succès ! Vous avez dépensé ${capability.costPA} PA et obtenu ${woodAmount} unités de bois.`,
      publicMessage: `🌲 ${character.name} a coupé du bois et a obtenu ${woodAmount} unités.`,
      loot: { wood: woodAmount },
    };
  }

  /**
   * Capacité de pêche
   */
  /**
   * Utilise la capacité de pêche
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param paToUse Nombre de PA à utiliser (1 ou 2)
   */
  private async useFishingCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    paToUse: number
  ): Promise<CapabilityResult> {
    // Utiliser le service capability pour exécuter la pêche avec les tables de loot de la DB
    const { CapabilityService } = await import('./capability.service');
    const capabilityService = new CapabilityService(prisma);

    const fishResult = await capabilityService.executeFish(character.id, paToUse as 1 | 2);

    return {
      success: fishResult.success,
      message: fishResult.message,
      publicMessage: `🎣 ${character.name} ${fishResult.message.includes('coquillage') ? 'a trouvé un coquillage !' : fishResult.message}`,
      loot: fishResult.loot || {},
      paUsed: paToUse, // Retourner le nombre de PA utilisés
    };
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
      publicMessage: `🎭 ${character.name} a donné un spectacle !${pmGained > 0 ? " Tout le monde regagne 1 PM." : ""
        }`,
      divertCounter: newDivertCounter,
      pmGained,
    };
  }

  /**
   * Capacité de cuisine
   */
  /**
   * Utilise la capacité de cuisine
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param paToUse Nombre de PA à utiliser (1 ou 2)
   * @param inputQuantity Nombre de vivres à transformer (optionnel)
   */
  private async useCookingCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    paToUse?: number,
    inputQuantity?: number
  ): Promise<CapabilityResult> {
    // Déterminer le nombre de PA à utiliser (par défaut 1)
    const actualPaToUse = paToUse || 1;

    // Valider que le nombre de PA est correct
    if (actualPaToUse !== 1 && actualPaToUse !== 2) {
      throw new Error("Vous devez utiliser 1 ou 2 PA pour cuisiner");
    }

    // Vérifier que le personnage a assez de PA
    if (character.paTotal < actualPaToUse) {
      throw new Error(
        `PA insuffisants : vous avez ${character.paTotal} PA mais vous voulez en utiliser ${actualPaToUse}.`
      );
    }

    // Déterminer le nombre maximum de vivres utilisables selon les PA
    const maxInput = actualPaToUse === 1 ? 1 : 5;

    // Vérifier qu'il y a des vivres disponibles dans la ville
    const vivresType = await prisma.resourceType.findFirst({
      where: { name: "Vivres" },
    });

    if (!vivresType) {
      throw new Error("Type de ressource Vivres non trouvé");
    }

    const vivresStock = await prisma.resourceStock.findUnique({
      where: {
        locationType_locationId_resourceTypeId: {
          locationType: "CITY",
          locationId: character.townId,
          resourceTypeId: vivresType.id,
        },
      },
    });

    const vivresAvailable = vivresStock?.quantity || 0;

    // Déterminer combien de vivres utiliser
    let vivresToConsume: number;
    if (inputQuantity !== undefined) {
      // L'utilisateur a spécifié une quantité
      if (inputQuantity < 1) {
        throw new Error("Vous devez utiliser au moins 1 vivre");
      }
      if (inputQuantity > maxInput) {
        throw new Error(
          `Avec ${actualPaToUse} PA, vous ne pouvez utiliser que ${maxInput} vivres maximum`
        );
      }
      vivresToConsume = inputQuantity;
    } else {
      // Utiliser le maximum possible
      vivresToConsume = Math.min(vivresAvailable, maxInput);
    }

    // Vérifier qu'il y a assez de vivres
    if (vivresAvailable < vivresToConsume) {
      throw new Error(
        `Vivres insuffisants : il y a ${vivresAvailable} vivres dans le stock de la ville mais vous voulez en utiliser ${vivresToConsume}.`
      );
    }

    // Calculer le nombre de repas créés avec la formule aléatoire
    // Output = random(Input - 1, Input × 3)
    const minOutput = vivresToConsume - 1;
    const maxOutput = vivresToConsume * 3;
    const repasCreated = Math.floor(Math.random() * (maxOutput - minOutput + 1)) + minOutput;

    return {
      success: true,
      message: `Vous avez cuisiné avec succès ! Vous avez transformé ${vivresToConsume} vivres en ${repasCreated} repas (coût : ${actualPaToUse} PA).`,
      publicMessage: `🍳 ${character.name} a préparé ${repasCreated} repas à partir de ${vivresToConsume} vivres.`,
      loot: {
        foodSupplies: -vivresToConsume, // Consommation de vivres
        preparedFood: repasCreated, // Production de repas
      },
      paUsed: actualPaToUse, // Retourner le nombre de PA utilisés
    };
  }

  /**
   * Changer le métier d'un personnage
   * Retire les capacités de l'ancien métier et ajoute celles du nouveau
   */
  async changeCharacterJob(
    characterId: string,
    newJobId: number
  ): Promise<Character> {
    return await prisma.$transaction(async (tx) => {
      // Récupérer le personnage avec son métier actuel
      const character = await tx.character.findUnique({
        where: { id: characterId },
        include: {
          job: {
            include: {
              startingAbility: true,
              optionalAbility: true,
            },
          },
        },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Récupérer le nouveau métier
      const newJob = await tx.job.findUnique({
        where: { id: newJobId },
        include: {
          startingAbility: true,
          optionalAbility: true,
        },
      });

      if (!newJob) {
        throw new Error("Job not found");
      }

      // Retirer les capacités de l'ancien métier
      if (character.job) {
        const oldJobAbilityIds: string[] = [];

        if (character.job.startingAbility) {
          oldJobAbilityIds.push(character.job.startingAbility.id);
        }

        if (character.job.optionalAbility) {
          oldJobAbilityIds.push(character.job.optionalAbility.id);
        }

        // Supprimer ces capacités du personnage
        if (oldJobAbilityIds.length > 0) {
          await tx.characterCapability.deleteMany({
            where: {
              characterId: character.id,
              capabilityId: { in: oldJobAbilityIds },
            },
          });
        }
      }

      // Ajouter les capacités du nouveau métier
      const newJobAbilityIds: string[] = [];

      if (newJob.startingAbility) {
        newJobAbilityIds.push(newJob.startingAbility.id);
      }

      if (newJob.optionalAbility) {
        newJobAbilityIds.push(newJob.optionalAbility.id);
      }

      // Créer les nouvelles capacités
      for (const abilityId of newJobAbilityIds) {
        await tx.characterCapability.upsert({
          where: {
            characterId_capabilityId: {
              characterId: character.id,
              capabilityId: abilityId,
            },
          },
          update: {},
          create: {
            characterId: character.id,
            capabilityId: abilityId,
          },
        });
      }

      // Mettre à jour le personnage avec le nouveau métier
      return await tx.character.update({
        where: { id: characterId },
        data: { jobId: newJobId },
        include: {
          job: {
            include: {
              startingAbility: true,
              optionalAbility: true,
            },
          },
          capabilities: {
            include: {
              capability: true,
            },
          },
        },
      });
    });
  }
}

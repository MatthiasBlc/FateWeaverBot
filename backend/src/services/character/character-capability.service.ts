import {
  Prisma,
  PrismaClient,
  Character,
  Capability,
} from "@prisma/client";
import { getHuntYield, getGatherYield } from "../../util/capacityRandom";
import { CapabilityService } from "../capability.service";
import { CharacterRepository } from "../../domain/repositories/character.repository";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../../shared/errors';

const prisma = new PrismaClient();

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

export class CharacterCapabilityService {
  private capabilityService: CapabilityService;
  private characterRepo: CharacterRepository;

  constructor(
    capabilityService: CapabilityService,
    characterRepo?: CharacterRepository
  ) {
    this.capabilityService = capabilityService;
    this.characterRepo = characterRepo || new CharacterRepository(prisma);
  }

  async getCharacterCapabilities(characterId: string) {
    return await this.characterRepo.getCapabilities(characterId);
  }

  async addCharacterCapability(characterId: string, capabilityId: string) {
    const capability = await this.characterRepo.findCapability(capabilityId);

    if (!capability) {
      throw new NotFoundError("Capability", capabilityId);
    }

    const existingCapability = await this.characterRepo.findCharacterCapability(characterId, capabilityId);

    if (existingCapability) {
      throw new BadRequestError("Le personnage possède déjà cette capacité");
    }

    await this.characterRepo.addCapability(characterId, capabilityId);

    return capability;
  }

  /**
   * Retire une capacité d'un personnage
   */
  async removeCharacterCapability(characterId: string, capabilityId: string) {
    const capability = await this.characterRepo.findCapability(capabilityId);

    if (!capability) {
      throw new NotFoundError("Capability", capabilityId);
    }

    await this.characterRepo.removeCapability(characterId, capabilityId);

    return capability;
  }

  /**
   * Récupère les capacités disponibles pour un personnage
   * (celles qu'il ne possède pas encore)
   */
  async getAvailableCapabilities(characterId: string) {
    return await this.characterRepo.findAvailableCapabilities(characterId);
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
    const character = (await this.characterRepo.findWithCapabilities(characterId)) as CharacterWithCapabilities;

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    // Vérifier que les capacités sont chargées
    if (!character.capabilities || character.capabilities.length === 0) {
      throw new NotFoundError("Capability", capabilityIdentifier);
    }

    // Trouver la capacité par ID ou par nom
    const characterCapability = character.capabilities.find(
      (cc) =>
        cc.capability.id === capabilityIdentifier ||
        cc.capability.name === capabilityIdentifier
    );

    if (!characterCapability) {
      throw new NotFoundError("Capability", capabilityIdentifier);
    }

    const capability = characterCapability.capability;
    const capabilityNameLower = capability.name.toLowerCase();

    // Déterminer le nombre de PA à vérifier/utiliser
    // Pour les capacités à coût variable (hasVariableCost = true), on utilise paToUse
    // Sinon on utilise le costPA de la capacité
    let paRequired = capability.costPA;

    if (capability.hasVariableCost && paToUse) {
      paRequired = paToUse;
    }

    // Vérifier les PA nécessaires
    if (character.paTotal <= 0) {
      throw new BadRequestError(
        `Vous n'avez plus de PA disponibles. Attendez la prochaine régénération quotidienne pour utiliser vos capacités.`
      );
    } else if (character.paTotal < paRequired) {
      throw new BadRequestError(
        `PA insuffisants : vous avez ${character.paTotal} PA mais cette action nécessite ${paRequired} PA.`
      );
    }

    // Logique spécifique selon la capacité
    let result: CapabilityResult = {
      success: true,
      message: "",
      publicMessage: "",
      loot: {},
    };

    switch (capabilityNameLower) {
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
      case "cartographier":
        result = await this.useCartographyCapability(
          character,
          capability,
          paToUse || 1
        );
        break;
      case "rechercher":
        result = await this.useResearchingCapability(
          character,
          capability,
          paToUse || 1
        );
        break;
      case "auspice":
        result = await this.useAuspiceCapability(
          character,
          capability,
          paToUse || 1
        );
        break;
      case "miner":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        result = await this.capabilityService.executeMiner(characterId);
        break;
      default:
        throw new BadRequestError("Capacité non implémentée");
    }

    // Mettre à jour les PA du personnage et ajouter les ressources à la ville
    const updatedCharacter = await prisma.$transaction(async (tx) => {
      // Déterminer le nombre de PA à déduire (utiliser paUsed si défini, sinon costPA)
      const paToDeduct = result.paUsed !== undefined ? result.paUsed : capability.costPA;

      // Préparer les données de mise à jour
      const updateData: any = {
        paTotal: character.paTotal - paToDeduct,
        updatedAt: new Date(),
      };

      // Si la capacité divertir a été utilisée, mettre à jour le compteur
      if (result.divertCounter !== undefined) {
        updateData.divertCounter = result.divertCounter;
      }

      // Si le spectacle a eu lieu (pmGained > 0), réinitialiser le compteur
      if (result.pmGained && result.pmGained > 0) {
        updateData.divertCounter = 0;
      }

      // Mettre à jour les PA du personnage
      const characterUpdate = await tx.character.update({
        where: { id: characterId },
        data: updateData,
      });

      // Ajouter les ressources générées au stock de la ville
      if (
        result.loot &&
        result.loot.foodSupplies &&
        result.loot.foodSupplies !== 0
      ) {
        // Récupérer le type de ressource "Vivres"
        const vivresType = await this.getResourceTypeByName("Vivres");

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
        const repasType = await this.getResourceTypeByName("Repas");

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

      // Ajouter le bois généré au stock de la ville (pour la capacité couper du bois)
      if (result.loot && result.loot.wood && result.loot.wood > 0) {
        const boisType = await this.getResourceTypeByName("Bois");

        if (boisType) {
          await tx.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType: "CITY",
                locationId: character.townId,
                resourceTypeId: boisType.id,
              },
            },
            update: {
              quantity: { increment: result.loot.wood },
            },
            create: {
              locationType: "CITY",
              locationId: character.townId,
              resourceTypeId: boisType.id,
              quantity: result.loot.wood,
            },
          });
        }
      }

      return tx.character.findUnique({
        where: { id: characterId },
        ...CharacterQueries.withCapabilities(),
      });
    });

    if (!updatedCharacter) {
      throw new BadRequestError("Erreur lors de la mise à jour du personnage");
    }

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
    const { CapabilityService } = await import('../capability.service');
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

    let message = `🎭 Un moment de tranquillité à réviser tes gammes.`;
    let publicMessage = `🎭 ${character.name} a joué du violon pendant des heures… avec quelques fausses notes !`;

    if (pmGained > 0) {
      message = `🎭 C'est le grand jour ! Installez tréteaux et calicots, le spectacle commence !`;
      publicMessage = `🎭 ${character.name} a donné un grand spectacle qui met du baume au cœur. Tous les spectateurs gagnent 1 PM !`;

      // Appliquer +1 PM à tous les personnages de la ville (pas en expédition DEPARTED)
      await prisma.$transaction(async (tx) => {
        const cityCharacters = await tx.character.findMany({
          where: {
            townId: character.townId,
            isDead: false,
            expeditionMembers: {
              none: {
                expedition: { status: "DEPARTED" }
              }
            }
          }
        });

        for (const char of cityCharacters) {
          if (char.pm < 5) {
            await tx.character.update({
              where: { id: char.id },
              data: { pm: Math.min(5, char.pm + 1) }
            });
          }
        }
      });
    }

    return {
      success: true,
      message,
      publicMessage,
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
      throw new BadRequestError("Vous devez utiliser 1 ou 2 PA pour cuisiner");
    }

    // Vérifier que le personnage a assez de PA
    if (character.paTotal < actualPaToUse) {
      throw new BadRequestError(
        `PA insuffisants : vous avez ${character.paTotal} PA mais vous voulez en utiliser ${actualPaToUse}.`
      );
    }

    // Déterminer le nombre maximum de vivres utilisables selon les PA
    const maxInput = actualPaToUse === 1 ? 2 : 5;

    // Vérifier qu'il y a des vivres disponibles dans la ville
    const vivresType = await this.getResourceTypeByName("Vivres");

    const vivresStock = await this.getStock("CITY", character.townId, vivresType.id);

    const vivresAvailable = vivresStock?.quantity || 0;

    // Déterminer combien de vivres utiliser
    let vivresToConsume: number;
    if (inputQuantity !== undefined) {
      // L'utilisateur a spécifié une quantité
      const minInput = actualPaToUse === 1 ? 1 : 2;
      if (inputQuantity < minInput) {
        throw new BadRequestError(`Avec ${actualPaToUse} PA, vous devez utiliser au moins ${minInput} vivre${minInput > 1 ? 's' : ''}`);
      }
      if (inputQuantity > maxInput) {
        throw new BadRequestError(
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
      throw new BadRequestError(
        `Vivres insuffisants : il y a ${vivresAvailable} vivres dans le stock de la ville mais vous voulez en utiliser ${vivresToConsume}.`
      );
    }

    // Calculer le nombre de repas créés avec la formule aléatoire
    // 1 PA: Output = random(0, Input × 2)
    // 2 PA: Output = random(0, Input × 3)
    const minOutput = 0;
    const maxOutput = actualPaToUse === 1 ? vivresToConsume * 2 : vivresToConsume * 3;
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
   * Capacité de cartographie
   */
  /**
   * Utilise la capacité de cartographie
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param paToUse Nombre de PA à utiliser (1 ou 2)
   */
  private async useCartographyCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    paToUse: number
  ): Promise<CapabilityResult> {
    // La cartographie est une capacité admin-interpreted
    // Elle ne génère pas de loot automatiquement, mais notifie les admins

    const message = `Vous travaillez sur vos cartes (coût : ${paToUse} PA). Les administrateurs ont été notifiés et vous donneront les résultats de votre exploration.`;
    const publicMessage = `🗺️ **${character.name}** travaille sur ses cartes ! (**${paToUse} PA dépensés** {ADMIN_TAG})`;

    return {
      success: true,
      message,
      publicMessage,
      loot: {},
      paUsed: paToUse,
    };
  }

  /**
   * Capacité de recherche
   */
  /**
   * Utilise la capacité de recherche
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param paToUse Nombre de PA à utiliser (1 ou 2)
   */
  private async useResearchingCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    paToUse: number
  ): Promise<CapabilityResult> {
    // La recherche est une capacité admin-interpreted
    // Elle ne génère pas de loot automatiquement, mais notifie les admins

    const infoCount = paToUse === 1 ? 1 : 3;
    const message = `Vous effectuez vos recherches (coût : ${paToUse} PA, ${infoCount} info(s)). Les administrateurs ont été notifiés et vous donneront les résultats de vos analyses.`;
    const publicMessage = `🔎 **${character.name}** effectue des recherches ! (**${paToUse} PA dépensés, ${infoCount} info(s)** {ADMIN_TAG})`;

    return {
      success: true,
      message,
      publicMessage,
      loot: {},
      paUsed: paToUse,
    };
  }

  /**
   * Capacité d'auspice (météo)
   */
  /**
   * Utilise la capacité d'auspice
   * @param character Le personnage qui utilise la capacité
   * @param capability La capacité utilisée
   * @param paToUse Nombre de PA à utiliser (1 ou 2)
   */
  private async useAuspiceCapability(
    character: CharacterWithCapabilities,
    capability: Capability,
    paToUse: number
  ): Promise<CapabilityResult> {
    // L'auspice est une capacité admin-interpreted
    // Elle ne génère pas de loot automatiquement, mais notifie les admins

    const daysCount = paToUse === 1 ? 1 : 3;
    const message = `Vous observez les cieux (coût : ${paToUse} PA, ${daysCount} jour(s)). Les administrateurs ont été notifiés et vous donneront les prévisions météorologiques.`;
    const publicMessage = `🌦️ **${character.name}** observe les cieux pour prédire la météo ! (**${paToUse} PA dépensés, ${daysCount} jour(s)** {ADMIN_TAG})`;

    return {
      success: true,
      message,
      publicMessage,
      loot: {},
      paUsed: paToUse,
    };
  }

  // Helper methods - need to be imported from original service or utils
  private async getResourceTypeByName(name: string) {
    const { ResourceUtils } = await import("../../shared/utils");
    return await ResourceUtils.getResourceTypeByName(name);
  }

  private async getStock(locationType: "CITY" | "EXPEDITION", locationId: string, resourceTypeId: number) {
    const { ResourceUtils } = await import("../../shared/utils");
    return await ResourceUtils.getStock(locationType, locationId, resourceTypeId);
  }
}

// Export singleton instance for backward compatibility
export const characterCapabilityService = new CharacterCapabilityService(new CapabilityService(prisma));

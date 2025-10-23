import {
  PrismaClient,
  Character,
  Capability,
} from "@prisma/client";
import { CapabilityService } from "../capability.service";
import { CharacterRepository } from "../../domain/repositories/character.repository";
import { CharacterQueries } from "../../infrastructure/database/query-builders/character.queries";
import { NotFoundError, BadRequestError } from '../../shared/errors';

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
  effects?: Array<{
    targetCharacterId: string;
    hpChange?: number;
    pmChange?: number;
    statusChange?: string;
  }>;
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
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const chasserResult = await this.capabilityService.executeChasser(characterId, capability.id, isSummer);
        result = this.convertExecutionResultToCapabilityResult(chasserResult);
        break;
      case "cueillir":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const cueillirResult = await this.capabilityService.executeCueillir(characterId, capability.id, isSummer);
        result = this.convertExecutionResultToCapabilityResult(cueillirResult);
        break;
      case "pêcher":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const pecherPa = (paToUse === 2 ? 2 : 1) as 1 | 2;
        const pecherResult = await this.capabilityService.executePecherV2(characterId, capability.id, pecherPa);
        result = this.convertExecutionResultToCapabilityResult(pecherResult);
        break;
      case "divertir":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const divertirResult = await this.capabilityService.executeDivertir(characterId, capability.id);
        result = this.convertExecutionResultToCapabilityResult(divertirResult);
        break;
      case "couper du bois":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const couperResult = await this.capabilityService.executeCouperDuBoisV2(characterId, capability.id);
        result = this.convertExecutionResultToCapabilityResult(couperResult);
        break;
      case "cuisiner":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const cuisinerResult = await this.capabilityService.executeCuisinerV2(characterId, capability.id, paToUse || 1, inputQuantity || 0);
        result = this.convertExecutionResultToCapabilityResult(cuisinerResult);
        break;
      case "cartographier":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const cartResult = await this.capabilityService.executeCartographierV2(characterId, capability.id, paToUse || 1);
        result = this.convertExecutionResultToCapabilityResult(cartResult);
        break;
      case "rechercher":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const rechResult = await this.capabilityService.executeRechercherV2(characterId, capability.id, paToUse || 1);
        result = this.convertExecutionResultToCapabilityResult(rechResult);
        break;
      case "auspice":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const auspResult = await this.capabilityService.executeAuspiceV2(characterId, capability.id, paToUse || 1);
        result = this.convertExecutionResultToCapabilityResult(auspResult);
        break;
      case "miner":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const minerResult = await this.capabilityService.executeMinerV2(characterId, capability.id);
        result = this.convertExecutionResultToCapabilityResult(minerResult);
        break;
      case "soigner":
        if (!this.capabilityService) {
          throw new BadRequestError("Service de capacité non initialisé");
        }
        const soignerResult = await this.capabilityService.executeSoignerV2(characterId, capability.id, paToUse === 2 ? "craft" : "heal", inputQuantity as string | undefined);
        result = this.convertExecutionResultToCapabilityResult(soignerResult);
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

      // Traiter les autres ressources génériques (Cataplasme, Minerai, etc.)
      if (result.loot) {
        // Lister les clés déjà traitées spécifiquement
        const handledKeys = ["foodSupplies", "food", "preparedFood", "wood"];
        // Mapping des noms anglais vers français pour les ressources converties
        const nameMapping: Record<string, string> = {
          ore: "Minerai",
          morale: "Morale",
        };

        for (const [resourceName, quantity] of Object.entries(result.loot)) {
          // Ignorer les ressources déjà traitées
          if (handledKeys.includes(resourceName) || !quantity) continue;

          // Ignorer les quantités nulles ou négatives (sauf si c'est une consommation)
          if (typeof quantity !== "number") continue;

          // Convertir le nom si c'est un alias anglais
          const actualResourceName = nameMapping[resourceName] || resourceName;

          // Récupérer le type de ressource
          let resourceType;
          try {
            resourceType = await this.getResourceTypeByName(actualResourceName);
          } catch (error) {
            // Ignorer les ressources qui n'existent pas
            continue;
          }

          if (resourceType) {
            if (quantity > 0) {
              // Production de ressource
              await tx.resourceStock.upsert({
                where: {
                  locationType_locationId_resourceTypeId: {
                    locationType: "CITY",
                    locationId: character.townId,
                    resourceTypeId: resourceType.id,
                  },
                },
                update: {
                  quantity: { increment: quantity },
                },
                create: {
                  locationType: "CITY",
                  locationId: character.townId,
                  resourceTypeId: resourceType.id,
                  quantity: quantity,
                },
              });
            } else {
              // Consommation de ressource (valeur négative)
              try {
                await tx.resourceStock.update({
                  where: {
                    locationType_locationId_resourceTypeId: {
                      locationType: "CITY",
                      locationId: character.townId,
                      resourceTypeId: resourceType.id,
                    },
                  },
                  data: {
                    quantity: { increment: quantity },
                  },
                });
              } catch (error) {
                // Ignorer si la ressource n'existe pas (peu importe si on consomme une ressource inexistante)
              }
            }
          }
        }
      }

      // Traiter les effects (changements de HP, PM, etc.)
      if (result.effects && result.effects.length > 0) {
        for (const effect of result.effects) {
          if (!effect.targetCharacterId) continue;

          // Récupérer le personnage cible
          const targetCharacter = await tx.character.findUnique({
            where: { id: effect.targetCharacterId },
          });

          if (targetCharacter) {
            const updateData: any = {};

            // Traiter les changements de HP
            if (effect.hpChange !== undefined) {
              // Calculer les nouveaux HP (min 0, max 5)
              const newHp = Math.max(0, Math.min(5, targetCharacter.hp + effect.hpChange));
              updateData.hp = newHp;
            }

            // Traiter les changements de PM
            if (effect.pmChange !== undefined) {
              // Calculer les nouveaux PM (min 0, max 5)
              const newPm = Math.max(0, Math.min(5, targetCharacter.pm + effect.pmChange));
              updateData.pm = newPm;
            }

            // Mettre à jour le personnage cible si des changements
            if (Object.keys(updateData).length > 0) {
              await tx.character.update({
                where: { id: effect.targetCharacterId },
                data: updateData,
              });
            }
          }
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

  // Helper methods - need to be imported from original service or utils
  private async getResourceTypeByName(name: string) {
    const { ResourceUtils } = await import("../../shared/utils");
    return await ResourceUtils.getResourceTypeByName(name);
  }

  private async getStock(locationType: "CITY" | "EXPEDITION", locationId: string, resourceTypeId: number) {
    const { ResourceUtils } = await import("../../shared/utils");
    return await ResourceUtils.getStock(locationType, locationId, resourceTypeId);
  }

  /**
   * Convertit CapabilityExecutionResult (nouveau format) vers CapabilityResult (ancien format)
   * Utilisé pour la compatibilité avec le code existant
   */
  private convertExecutionResultToCapabilityResult(execResult: any): CapabilityResult {
    const result: CapabilityResult = {
      success: execResult.success,
      message: execResult.message,
      publicMessage: execResult.publicMessage || "",
      loot: {},
      paUsed: execResult.paConsumed,
    };

    // Mapper les ressources du nouveau format vers l'ancien
    if (execResult.loot) {
      // Vivres → food ou foodSupplies
      if (execResult.loot["Vivres"]) {
        result.loot!.foodSupplies = execResult.loot["Vivres"];
        result.loot!.food = execResult.loot["Vivres"]; // pour compatibilité
      }
      // Autres ressources
      if (execResult.loot["Bois"]) result.loot!.wood = execResult.loot["Bois"];
      if (execResult.loot["Minerai"]) result.loot!.ore = execResult.loot["Minerai"];
      if (execResult.loot["Morale"]) result.loot!.morale = execResult.loot["Morale"];
      // Copier les autres loot comme-est
      Object.keys(execResult.loot).forEach(key => {
        if (!["Vivres", "Bois", "Minerai", "Morale"].includes(key)) {
          result.loot![key] = execResult.loot[key];
        }
      });
    }

    // Mapper les métadonnées spéciales
    if (execResult.metadata?.divertCounter !== undefined) {
      result.divertCounter = execResult.metadata.divertCounter;
    }
    if (execResult.metadata?.pmGained) {
      result.pmGained = execResult.metadata.pmGained;
    }

    // Copier les effects
    if (execResult.effects) {
      result.effects = execResult.effects;
    }

    return result;
  }
}

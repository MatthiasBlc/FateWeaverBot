import { PrismaClient, CraftType, ProjectStatus } from "@prisma/client";
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ProjectRepository } from "../domain/repositories/project.repository";
import {
  NotFoundError,
  BadRequestError,
  ValidationError,
} from "../shared/errors";

const prisma = new PrismaClient();

interface CreateProjectInput {
  name: string;
  paRequired: number;
  outputResourceTypeId?: number;
  outputObjectTypeId?: number;
  outputQuantity: number;
  townId: string;
  createdBy: string;
  craftTypes: CraftType[];
  resourceCosts?: Array<{
    resourceTypeId: number;
    quantityRequired: number;
  }>;
  // Blueprint fields
  paBlueprintRequired?: number;
  blueprintResourceCosts?: Array<{
    resourceTypeId: number;
    quantityRequired: number;
  }>;
}

interface ContributeToProjectInput {
  characterId: string;
  projectId: string;
  paAmount?: number;
  resourceContributions?: Array<{
    resourceTypeId: number;
    quantity: number;
  }>;
}

class ProjectServiceClass {
  private projectRepo: ProjectRepository;

  constructor(projectRepo?: ProjectRepository) {
    this.projectRepo = projectRepo || new ProjectRepository(prisma);
  }

  async createProject(input: CreateProjectInput) {
    const {
      name,
      paRequired,
      outputResourceTypeId,
      outputObjectTypeId,
      outputQuantity,
      townId,
      createdBy,
      craftTypes,
      resourceCosts,
      paBlueprintRequired,
      blueprintResourceCosts,
    } = input;

    const existingProject = await this.projectRepo.findFirst({ name, townId });

    if (existingProject) {
      throw new BadRequestError(
        `Un projet nommé "${name}" existe déjà dans cette ville`
      );
    }

    if (!outputResourceTypeId && !outputObjectTypeId) {
      throw new ValidationError(
        "Un projet doit produire une ressource ou un objet"
      );
    }

    if (outputResourceTypeId && outputObjectTypeId) {
      throw new ValidationError(
        "Un projet ne peut pas produire à la fois une ressource et un objet"
      );
    }

    if (outputResourceTypeId) {
      const outputResource = await prisma.resourceType.findUnique({
        where: { id: outputResourceTypeId },
      });

      if (!outputResource) {
        throw new BadRequestError("Type de ressource de sortie invalide");
      }
    }

    if (outputObjectTypeId) {
      const outputObject = await prisma.objectType.findUnique({
        where: { id: outputObjectTypeId },
      });

      if (!outputObject) {
        throw new BadRequestError("Type d'objet de sortie invalide");
      }
    }

    if (craftTypes.length === 0) {
      throw new ValidationError(
        "Au moins un type d'artisanat doit être spécifié"
      );
    }

    const project = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          name,
          paRequired,
          outputResourceTypeId: outputResourceTypeId ?? null,
          outputObjectTypeId: outputObjectTypeId ?? null,
          outputQuantity,
          townId,
          createdBy,
          paBlueprintRequired,
          craftTypes: {
            create: craftTypes.map((craftType) => ({ craftType })),
          },
          resourceCosts:
            resourceCosts && resourceCosts.length > 0
              ? {
                  create: resourceCosts.map((rc) => ({
                    resourceTypeId: rc.resourceTypeId,
                    quantityRequired: rc.quantityRequired,
                  })),
                }
              : undefined,
        },
      });

      if (blueprintResourceCosts && blueprintResourceCosts.length > 0) {
        await tx.projectBlueprintResourceCost.createMany({
          data: blueprintResourceCosts.map((cost) => ({
            projectId: createdProject.id,
            resourceTypeId: cost.resourceTypeId,
            quantityRequired: cost.quantityRequired,
            quantityProvided: 0,
          })),
        });
      }

      return await tx.project.findUnique({
        where: { id: createdProject.id },
        include: {
          craftTypes: true,
          resourceCosts: {
            ...ResourceQueries.withResourceType(),
          },
          blueprintResourceCosts: {
            ...ResourceQueries.withResourceType(),
          },
          outputResourceType: true,
          outputObjectType: true,
        },
      });
    });

    return project;
  }


  async getActiveProjectsForCraftType(townId: string, craftType: CraftType) {
    return this.projectRepo.findActiveProjectsForCraftType(townId, craftType);
  }

  async getProjectById(projectId: string) {
    const project = await this.projectRepo.findByIdWithBlueprint(projectId);

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    return project;
  }

  async contributeToProject(input: ContributeToProjectInput) {
    const {
      characterId,
      projectId,
      paAmount = 0,
      resourceContributions = [],
    } = input;

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        expeditionMembers: {
          include: {
            expedition: true,
          },
        },
      },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    const departedExpedition = character.expeditionMembers.find(
      (em) => em.expedition.status === "DEPARTED"
    );

    if (departedExpedition) {
      throw new BadRequestError(
        "Impossible de contribuer à un projet en étant en expédition DEPARTED"
      );
    }

    const project = await this.getProjectById(projectId);

    if (project.status === ProjectStatus.COMPLETED) {
      throw new BadRequestError("Ce projet est déjà terminé");
    }

    if (project.townId !== character.townId) {
      throw new BadRequestError(
        "Le personnage n'appartient pas à la ville de ce projet"
      );
    }

    return await prisma.$transaction(async (tx) => {
      let reward: any = undefined;

      if (paAmount > 0) {
        const newPaContributed = project.paContributed + paAmount;
        if (newPaContributed > project.paRequired) {
          throw new ValidationError(
            `Vous ne pouvez contribuer que ${
              project.paRequired - project.paContributed
            } PA maximum`
          );
        }

        // Vérifier que le personnage a assez de PA
        if (character.paTotal < paAmount) {
          throw new BadRequestError(
            `Vous n'avez que ${character.paTotal} PA disponibles`
          );
        }

        // Déduire les PA du personnage
        await tx.character.update({
          where: { id: characterId },
          data: { paTotal: { decrement: paAmount } },
        });

        await tx.project.update({
          where: { id: projectId },
          data: { paContributed: newPaContributed },
        });
      }

      for (const contribution of resourceContributions) {
        const resourceCost = project.resourceCosts.find(
          (rc) => rc.resourceTypeId === contribution.resourceTypeId
        );

        if (!resourceCost) {
          throw new BadRequestError(
            `Cette ressource n'est pas requise pour ce projet`
          );
        }

        const newQuantityContributed =
          resourceCost.quantityContributed + contribution.quantity;
        if (newQuantityContributed > resourceCost.quantityRequired) {
          throw new ValidationError(
            `Vous ne pouvez contribuer que ${
              resourceCost.quantityRequired - resourceCost.quantityContributed
            } ${resourceCost.resourceType.name} maximum`
          );
        }

        const locationType = "CITY";
        const locationId = character.townId;

        const currentStock = await tx.resourceStock.findUnique({
          where: ResourceQueries.stockWhere(
            locationType,
            locationId,
            contribution.resourceTypeId
          ),
        });

        if (!currentStock || currentStock.quantity < contribution.quantity) {
          throw new BadRequestError(
            `Stock insuffisant de ${resourceCost.resourceType.name} dans la ville`
          );
        }

        await tx.resourceStock.update({
          where: ResourceQueries.stockWhere(
            locationType,
            locationId,
            contribution.resourceTypeId
          ),
          data: {
            quantity: { decrement: contribution.quantity },
          },
        });

        await tx.projectResourceCost.update({
          where: { id: resourceCost.id },
          data: { quantityContributed: newQuantityContributed },
        });
      }

      const updatedProject = await tx.project.findUnique({
        where: { id: projectId },
        include: {
          craftTypes: true,
          resourceCosts: {
            ...ResourceQueries.withResourceType(),
          },
          blueprintResourceCosts: {
            ...ResourceQueries.withResourceType(),
          },
          outputResourceType: true,
          outputObjectType: true,
        },
      });

      const paComplete =
        updatedProject!.paContributed >= updatedProject!.paRequired;
      const resourcesComplete = updatedProject!.resourceCosts.every(
        (rc) => rc.quantityContributed >= rc.quantityRequired
      );

      if (paComplete && resourcesComplete) {
        // Si le projet produit une ressource (et non un objet)
        if (updatedProject!.outputResourceTypeId !== null) {
          await tx.resourceStock.upsert({
            where: ResourceQueries.stockWhere(
              "CITY",
              character.townId,
              updatedProject!.outputResourceTypeId
            ),
            update: {
              quantity: { increment: updatedProject!.outputQuantity },
            },
            create: {
              locationType: "CITY",
              locationId: character.townId,
              resourceTypeId: updatedProject!.outputResourceTypeId,
              quantity: updatedProject!.outputQuantity,
            },
          });

          reward = {
            type: "RESOURCE",
            resourceTypeId: updatedProject!.outputResourceTypeId,
            quantity: updatedProject!.outputQuantity,
          };
        } else if (updatedProject!.outputObjectTypeId !== null) {
          const objectType = await tx.objectType.findUnique({
            where: { id: updatedProject!.outputObjectTypeId },
            include: {
              resourceConversions: {
                include: {
                  resourceType: true,
                },
              },
            },
          });

          if (!objectType) {
            throw new NotFoundError(
              "ObjectType",
              updatedProject!.outputObjectTypeId
            );
          }

          if (objectType.resourceConversions.length > 0) {
            for (const conversion of objectType.resourceConversions) {
              await tx.resourceStock.upsert({
                where: ResourceQueries.stockWhere(
                  "CITY",
                  character.townId,
                  conversion.resourceTypeId
                ),
                update: {
                  quantity: { increment: conversion.quantity },
                },
                create: {
                  locationType: "CITY",
                  locationId: character.townId,
                  resourceTypeId: conversion.resourceTypeId,
                  quantity: conversion.quantity,
                },
              });
            }

            reward = {
              type: "RESOURCE_CONVERSION",
              resources: objectType.resourceConversions.map((conversion) => ({
                resourceTypeId: conversion.resourceTypeId,
                quantity: conversion.quantity,
                resourceName: conversion.resourceType.name,
              })),
            };
          } else {
            const inventory = await tx.characterInventory.upsert({
              where: { characterId },
              create: { characterId },
              update: {},
            });

            const slot = await tx.characterInventorySlot.create({
              data: {
                inventoryId: inventory.id,
                objectTypeId: objectType.id,
              },
            });

            reward = {
              type: "OBJECT",
              objectType: {
                id: objectType.id,
                name: objectType.name,
              },
              slotId: slot.id,
            };
          }
        }

        // Vérifier si le projet a des coûts blueprint
        const hasBlueprintCosts =
          updatedProject!.paBlueprintRequired !== null ||
          (updatedProject!.blueprintResourceCosts && updatedProject!.blueprintResourceCosts.length > 0);

        if (hasBlueprintCosts) {
          // BLUEPRINT: recycler le projet au lieu de le compléter
          // 1. Remettre les PA à 0
          await tx.project.update({
            where: { id: projectId },
            data: {
              paContributed: 0,
              paRequired: updatedProject!.paBlueprintRequired ?? updatedProject!.paRequired,
              isBlueprint: true,
              status: ProjectStatus.ACTIVE
            },
          });

          // 2. Supprimer les anciens resource costs
          await tx.projectResourceCost.deleteMany({
            where: { projectId },
          });

          // 3. Créer les nouveaux resource costs basés sur blueprintResourceCosts
          if (updatedProject!.blueprintResourceCosts && updatedProject!.blueprintResourceCosts.length > 0) {
            await tx.projectResourceCost.createMany({
              data: updatedProject!.blueprintResourceCosts.map((cost) => ({
                projectId,
                resourceTypeId: cost.resourceTypeId,
                quantityRequired: cost.quantityRequired,
                quantityContributed: 0,
              })),
            });
          }
        } else {
          // Projet normal sans blueprint: le compléter définitivement
          await tx.project.update({
            where: { id: projectId },
            data: { status: ProjectStatus.COMPLETED },
          });
        }

        const finalProject = await tx.project.findUnique({
          where: { id: projectId },
          include: {
            craftTypes: true,
            resourceCosts: {
              ...ResourceQueries.withResourceType(),
            },
            blueprintResourceCosts: {
              ...ResourceQueries.withResourceType(),
            },
            outputResourceType: true,
            outputObjectType: true,
          },
        });

        return { project: finalProject, completed: true, reward };
      }

      return { project: updatedProject, completed: false, reward };
    });
  }

  async getAllProjectsForTown(townId: string) {
    return this.projectRepo.findByTown(townId);
  }

  async deleteProject(projectId: string) {
    const project = await this.getProjectById(projectId);

    if (project.status === ProjectStatus.COMPLETED) {
      throw new BadRequestError("Impossible de supprimer un projet terminé");
    }

    if (
      project.paContributed > 0 ||
      project.resourceCosts.some((rc) => rc.quantityContributed > 0)
    ) {
      throw new BadRequestError(
        "Impossible de supprimer un projet avec des contributions"
      );
    }

    await this.projectRepo.delete(projectId);

    return { success: true };
  }
}

export const ProjectService = new ProjectServiceClass();

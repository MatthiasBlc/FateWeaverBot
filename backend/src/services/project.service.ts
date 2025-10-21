import { PrismaClient, CraftType, ProjectStatus } from '@prisma/client';
import { ResourceQueries } from "../infrastructure/database/query-builders/resource.queries";
import { ProjectRepository } from "../domain/repositories/project.repository";

const prisma = new PrismaClient();

interface CreateProjectInput {
  name: string;
  paRequired: number;
  outputResourceTypeId: number;
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
    const { name, paRequired, outputResourceTypeId, outputQuantity, townId, createdBy, craftTypes, resourceCosts, paBlueprintRequired, blueprintResourceCosts } = input;

    const existingProject = await this.projectRepo.findFirst({ name, townId });

    if (existingProject) {
      throw new Error(`Un projet nommé "${name}" existe déjà dans cette ville`);
    }

    const outputResource = await prisma.resourceType.findUnique({
      where: { id: outputResourceTypeId },
    });

    if (!outputResource) {
      throw new Error('Type de ressource de sortie invalide');
    }

    if (craftTypes.length === 0) {
      throw new Error('Au moins un type d\'artisanat doit être spécifié');
    }

    const project = await prisma.project.create({
      data: {
        name,
        paRequired,
        outputResourceTypeId,
        outputQuantity,
        townId,
        createdBy,
        paBlueprintRequired,
        craftTypes: {
          create: craftTypes.map(craftType => ({ craftType })),
        },
        resourceCosts: resourceCosts
          ? {
              create: resourceCosts.map(rc => ({
                resourceTypeId: rc.resourceTypeId,
                quantityRequired: rc.quantityRequired,
              })),
            }
          : undefined,
      },
      include: {
        craftTypes: true,
        resourceCosts: {
          ...ResourceQueries.withResourceType(),
        },
      },
    });

    // Create blueprint resource costs if provided
    if (blueprintResourceCosts && blueprintResourceCosts.length > 0) {
      await prisma.projectBlueprintResourceCost.createMany({
        data: blueprintResourceCosts.map((cost) => ({
          projectId: project.id,
          resourceTypeId: cost.resourceTypeId,
          quantityRequired: cost.quantityRequired,
          quantityProvided: 0,
        })),
      });
    }

    return project;
  }

  async convertToBlueprint(projectId: string): Promise<void> {
    await this.projectRepo.update(projectId, { isBlueprint: true });
  }

  async restartBlueprint(
    blueprintId: string,
    createdBy: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // Get the blueprint project
      const blueprint = await tx.project.findUnique({
        where: { id: blueprintId },
        include: {
          craftTypes: true,
          blueprintResourceCosts: {
            ...ResourceQueries.withResourceType(),
          },
        },
      });

      if (!blueprint) {
        throw new Error("Blueprint not found");
      }

      if (!blueprint.isBlueprint) {
        throw new Error("This project is not a blueprint");
      }

      // Use blueprint costs if available, otherwise use original costs
      const paRequired = blueprint.paBlueprintRequired ?? blueprint.paRequired;

      // Create new project from blueprint
      const newProject = await tx.project.create({
        data: {
          name: blueprint.name,
          paRequired,
          paContributed: 0,
          outputResourceTypeId: blueprint.outputResourceTypeId,
          outputQuantity: blueprint.outputQuantity,
          status: ProjectStatus.ACTIVE,
          townId: blueprint.townId,
          createdBy,
          originalProjectId: blueprintId,
          paBlueprintRequired: blueprint.paBlueprintRequired,
        },
      });

      // Copy craft types
      await tx.projectCraftType.createMany({
        data: blueprint.craftTypes.map((ct) => ({
          projectId: newProject.id,
          craftType: ct.craftType,
        })),
      });

      // Use blueprint resource costs if available
      if (blueprint.blueprintResourceCosts.length > 0) {
        // Copy blueprint costs as regular costs
        await tx.projectResourceCost.createMany({
          data: blueprint.blueprintResourceCosts.map((cost) => ({
            projectId: newProject.id,
            resourceTypeId: cost.resourceTypeId,
            quantityRequired: cost.quantityRequired,
            quantityProvided: 0,
          })),
        });

        // Also create blueprint costs for the new project
        await tx.projectBlueprintResourceCost.createMany({
          data: blueprint.blueprintResourceCosts.map((cost) => ({
            projectId: newProject.id,
            resourceTypeId: cost.resourceTypeId,
            quantityRequired: cost.quantityRequired,
            quantityProvided: 0,
          })),
        });
      } else {
        // No blueprint costs defined, use original costs from ProjectResourceCost
        const originalCosts = await tx.projectResourceCost.findMany({
          where: { projectId: blueprintId },
        });

        if (originalCosts.length > 0) {
          await tx.projectResourceCost.createMany({
            data: originalCosts.map((cost) => ({
              projectId: newProject.id,
              resourceTypeId: cost.resourceTypeId,
              quantityRequired: cost.quantityRequired,
              quantityProvided: 0,
            })),
          });
        }
      }

      return newProject;
    });
  }

  async getActiveProjectsForCraftType(townId: string, craftType: CraftType) {
    return this.projectRepo.findActiveProjectsForCraftType(townId, craftType);
  }

  async getProjectById(projectId: string) {
    const project = await this.projectRepo.findByIdWithBlueprint(projectId);

    if (!project) {
      throw new Error('Projet non trouvé');
    }

    return project;
  }

  async contributeToProject(input: ContributeToProjectInput) {
    const { characterId, projectId, paAmount = 0, resourceContributions = [] } = input;

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
      throw new Error('Personnage non trouvé');
    }

    const departedExpedition = character.expeditionMembers.find(
      em => em.expedition.status === 'DEPARTED'
    );

    if (departedExpedition) {
      throw new Error('Impossible de contribuer à un projet en étant en expédition DEPARTED');
    }

    const project = await this.getProjectById(projectId);

    if (project.status === ProjectStatus.COMPLETED) {
      throw new Error('Ce projet est déjà terminé');
    }

    if (project.townId !== character.townId) {
      throw new Error('Le personnage n\'appartient pas à la ville de ce projet');
    }

    return await prisma.$transaction(async tx => {
      if (paAmount > 0) {
        const newPaContributed = project.paContributed + paAmount;
        if (newPaContributed > project.paRequired) {
          throw new Error(`Vous ne pouvez contribuer que ${project.paRequired - project.paContributed} PA maximum`);
        }

        await tx.project.update({
          where: { id: projectId },
          data: { paContributed: newPaContributed },
        });
      }

      for (const contribution of resourceContributions) {
        const resourceCost = project.resourceCosts.find(
          rc => rc.resourceTypeId === contribution.resourceTypeId
        );

        if (!resourceCost) {
          throw new Error(`Cette ressource n'est pas requise pour ce projet`);
        }

        const newQuantityContributed = resourceCost.quantityContributed + contribution.quantity;
        if (newQuantityContributed > resourceCost.quantityRequired) {
          throw new Error(
            `Vous ne pouvez contribuer que ${resourceCost.quantityRequired - resourceCost.quantityContributed} ${resourceCost.resourceType.name} maximum`
          );
        }

        const locationType = 'CITY';
        const locationId = character.townId;

        const currentStock = await tx.resourceStock.findUnique({
          where: ResourceQueries.stockWhere(locationType, locationId, contribution.resourceTypeId),
        });

        if (!currentStock || currentStock.quantity < contribution.quantity) {
          throw new Error(`Stock insuffisant de ${resourceCost.resourceType.name} dans la ville`);
        }

        await tx.resourceStock.update({
          where: ResourceQueries.stockWhere(locationType, locationId, contribution.resourceTypeId),
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
          resourceCosts: true,
        },
      });

      const paComplete = updatedProject!.paContributed >= updatedProject!.paRequired;
      const resourcesComplete = updatedProject!.resourceCosts.every(
        rc => rc.quantityContributed >= rc.quantityRequired
      );

      if (paComplete && resourcesComplete) {
        await tx.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.COMPLETED },
        });

        // Si le projet produit une ressource (et non un objet)
        if (updatedProject!.outputResourceTypeId !== null) {
          await tx.resourceStock.upsert({
            where: ResourceQueries.stockWhere('CITY', character.townId, updatedProject!.outputResourceTypeId),
            update: {
              quantity: { increment: updatedProject!.outputQuantity },
            },
            create: {
              locationType: 'CITY',
              locationId: character.townId,
              resourceTypeId: updatedProject!.outputResourceTypeId,
              quantity: updatedProject!.outputQuantity,
              
            },
          });
        }
        // TODO: Si outputObjectTypeId !== null, ajouter l'objet à l'inventaire du créateur

        return { ...updatedProject, completed: true };
      }

      return { ...updatedProject, completed: false };
    });
  }

  async getAllProjectsForTown(townId: string) {
    return this.projectRepo.findByTown(townId);
  }

  async deleteProject(projectId: string) {
    const project = await this.getProjectById(projectId);

    if (project.status === ProjectStatus.COMPLETED) {
      throw new Error('Impossible de supprimer un projet terminé');
    }

    if (project.paContributed > 0 || project.resourceCosts.some(rc => rc.quantityContributed > 0)) {
      throw new Error('Impossible de supprimer un projet avec des contributions');
    }

    await this.projectRepo.delete(projectId);

    return { success: true };
  }
}

export const ProjectService = new ProjectServiceClass();

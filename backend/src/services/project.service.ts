import { PrismaClient, CraftType, ProjectStatus } from '@prisma/client';

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

export const ProjectService = {
  async createProject(input: CreateProjectInput) {
    const { name, paRequired, outputResourceTypeId, outputQuantity, townId, createdBy, craftTypes, resourceCosts } = input;

    const existingProject = await prisma.project.findFirst({
      where: { name, townId },
    });

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
          include: {
            resourceType: true,
          },
        },
      },
    });

    return project;
  },

  async getActiveProjectsForCraftType(townId: string, craftType: CraftType) {
    const projects = await prisma.project.findMany({
      where: {
        townId,
        status: ProjectStatus.ACTIVE,
        craftTypes: {
          some: {
            craftType,
          },
        },
      },
      include: {
        craftTypes: true,
        resourceCosts: {
          include: {
            resourceType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return projects;
  },

  async getProjectById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        craftTypes: true,
        resourceCosts: {
          include: {
            resourceType: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Projet non trouvé');
    }

    return project;
  },

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
          where: {
            locationType_locationId_resourceTypeId: {
              locationType,
              locationId,
              resourceTypeId: contribution.resourceTypeId,
            },
          },
        });

        if (!currentStock || currentStock.quantity < contribution.quantity) {
          throw new Error(`Stock insuffisant de ${resourceCost.resourceType.name} dans la ville`);
        }

        await tx.resourceStock.update({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType,
              locationId,
              resourceTypeId: contribution.resourceTypeId,
            },
          },
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

        await tx.resourceStock.upsert({
          where: {
            locationType_locationId_resourceTypeId: {
              locationType: 'CITY',
              locationId: character.townId,
              resourceTypeId: updatedProject!.outputResourceTypeId,
            },
          },
          update: {
            quantity: { increment: updatedProject!.outputQuantity },
          },
          create: {
            locationType: 'CITY',
            locationId: character.townId,
            resourceTypeId: updatedProject!.outputResourceTypeId,
            quantity: updatedProject!.outputQuantity,
            townId: character.townId,
          },
        });

        return { ...updatedProject, completed: true };
      }

      return { ...updatedProject, completed: false };
    });
  },

  async getAllProjectsForTown(townId: string) {
    return await prisma.project.findMany({
      where: { townId },
      include: {
        craftTypes: true,
        resourceCosts: {
          include: {
            resourceType: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  },

  async deleteProject(projectId: string) {
    const project = await this.getProjectById(projectId);

    if (project.status === ProjectStatus.COMPLETED) {
      throw new Error('Impossible de supprimer un projet terminé');
    }

    if (project.paContributed > 0 || project.resourceCosts.some(rc => rc.quantityContributed > 0)) {
      throw new Error('Impossible de supprimer un projet avec des contributions');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { success: true };
  },
};

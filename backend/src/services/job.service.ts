import { PrismaClient, Job } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateJobDto {
  name: string;
  description?: string;
  startingAbilityId: string;
  optionalAbilityId?: string | null;
}

export interface UpdateJobDto {
  name?: string;
  description?: string;
  startingAbilityId?: string;
  optionalAbilityId?: string | null;
}

export const JobService = {
  /**
   * Récupérer tous les métiers
   */
  async getAllJobs(): Promise<Job[]> {
    return await prisma.job.findMany({
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Récupérer un métier par ID
   */
  async getJobById(jobId: number): Promise<Job | null> {
    return await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
    });
  },

  /**
   * Créer un nouveau métier
   */
  async createJob(data: CreateJobDto): Promise<Job> {
    // Vérifier que les capacités existent
    const startingAbility = await prisma.capability.findUnique({
      where: { id: data.startingAbilityId },
    });

    if (!startingAbility) {
      throw new Error("Starting ability not found");
    }

    if (data.optionalAbilityId) {
      const optionalAbility = await prisma.capability.findUnique({
        where: { id: data.optionalAbilityId },
      });

      if (!optionalAbility) {
        throw new Error("Optional ability not found");
      }
    }

    return await prisma.job.create({
      data: {
        name: data.name,
        description: data.description,
        startingAbilityId: data.startingAbilityId,
        optionalAbilityId: data.optionalAbilityId,
      },
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
    });
  },

  /**
   * Mettre à jour un métier
   */
  async updateJob(jobId: number, data: UpdateJobDto): Promise<Job> {
    // Vérifier que les capacités existent si fournies
    if (data.startingAbilityId) {
      const startingAbility = await prisma.capability.findUnique({
        where: { id: data.startingAbilityId },
      });

      if (!startingAbility) {
        throw new Error("Starting ability not found");
      }
    }

    if (data.optionalAbilityId) {
      const optionalAbility = await prisma.capability.findUnique({
        where: { id: data.optionalAbilityId },
      });

      if (!optionalAbility) {
        throw new Error("Optional ability not found");
      }
    }

    return await prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        startingAbility: true,
        optionalAbility: true,
      },
    });
  },
};

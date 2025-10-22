import { PrismaClient, Job } from "@prisma/client";
import { JobRepository } from "../domain/repositories/job.repository";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';

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

class JobServiceClass {
  private jobRepo: JobRepository;

  constructor(jobRepo?: JobRepository) {
    this.jobRepo = jobRepo || new JobRepository(prisma);
  }

  /**
   * Récupérer tous les métiers
   */
  async getAllJobs(): Promise<Job[]> {
    return await this.jobRepo.findAll();
  }

  /**
   * Récupérer un métier par ID
   */
  async getJobById(jobId: number): Promise<Job | null> {
    return await this.jobRepo.findById(jobId);
  }

  /**
   * Créer un nouveau métier
   */
  async createJob(data: CreateJobDto): Promise<Job> {
    // Vérifier que les capacités existent
    const startingAbility = await this.jobRepo.findCapability(data.startingAbilityId);

    if (!startingAbility) {
      throw new NotFoundError("Starting ability", data.startingAbilityId);
    }

    if (data.optionalAbilityId) {
      const optionalAbility = await this.jobRepo.findCapability(data.optionalAbilityId);

      if (!optionalAbility) {
        throw new NotFoundError("Optional ability", data.optionalAbilityId);
      }
    }

    return await this.jobRepo.create(data);
  }

  /**
   * Mettre à jour un métier
   */
  async updateJob(jobId: number, data: UpdateJobDto): Promise<Job> {
    // Vérifier que les capacités existent si fournies
    if (data.startingAbilityId) {
      const startingAbility = await this.jobRepo.findCapability(data.startingAbilityId);

      if (!startingAbility) {
        throw new NotFoundError("Starting ability", data.startingAbilityId);
      }
    }

    if (data.optionalAbilityId) {
      const optionalAbility = await this.jobRepo.findCapability(data.optionalAbilityId);

      if (!optionalAbility) {
        throw new NotFoundError("Optional ability", data.optionalAbilityId);
      }
    }

    return await this.jobRepo.update(jobId, data);
  }
}

// Export singleton instance for backward compatibility
export const JobService = new JobServiceClass();

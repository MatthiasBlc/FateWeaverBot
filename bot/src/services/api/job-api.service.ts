/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseAPIService } from "./base-api.service";

export interface JobDto {
  id: number;
  name: string;
  description: string | null;
  startingAbilityId: string;
  optionalAbilityId: string | null;
  startingAbility?: {
    id: string;
    name: string;
    emojiTag: string;
  };
  optionalAbility?: {
    id: string;
    name: string;
    emojiTag: string;
  } | null;
}

export interface CreateJobDto {
  name: string;
  description?: string;
  startingAbilityId: string;
  optionalAbilityId?: string | null;
}

export class JobAPIService extends BaseAPIService {
  /**
   * Récupérer tous les métiers
   */
  async getAllJobs(): Promise<JobDto[]> {
    return await this.get<JobDto[]>("/jobs");
  }

  /**
   * Récupérer un métier par ID
   */
  async getJobById(jobId: number): Promise<JobDto> {
    return await this.get<JobDto>(`/jobs/${jobId}`);
  }

  /**
   * Créer un nouveau métier
   */
  async createJob(data: CreateJobDto): Promise<JobDto> {
    return await this.post<JobDto>("/jobs", data);
  }

  /**
   * Changer le métier d'un personnage
   */
  async changeCharacterJob(characterId: string, jobId: number): Promise<any> {
    return await this.post(
      `/characters/${characterId}/job`,
      { jobId }
    );
  }
}

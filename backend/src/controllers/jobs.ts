import { Request, Response, NextFunction } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { JobService } from "../services/job.service";

/**
 * GET /jobs - Récupérer tous les métiers
 */
export async function getAllJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const jobs = await JobService.getAllJobs();
    res.json(jobs);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /jobs/:id - Récupérer un métier par ID
 */
export async function getJobById(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = parseInt(req.params.id);
    const job = await JobService.getJobById(jobId);

    if (!job) {
      throw new NotFoundError("Job", jobId.toString());
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /jobs - Créer un nouveau métier
 */
export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, startingAbilityId, optionalAbilityId } = req.body;

    if (!name || !startingAbilityId) {
      throw new BadRequestError("name and startingAbilityId are required");
    }

    const job = await JobService.createJob({
      name,
      description,
      startingAbilityId,
      optionalAbilityId,
    });

    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /jobs/:id - Mettre à jour un métier
 */
export async function updateJob(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = parseInt(req.params.id);
    const { name, description, startingAbilityId, optionalAbilityId } = req.body;

    const job = await JobService.updateJob(jobId, {
      name,
      description,
      startingAbilityId,
      optionalAbilityId,
    });

    res.json(job);
  } catch (error) {
    next(error);
  }
}

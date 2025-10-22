import { Request, Response } from "express";
import { NotFoundError, BadRequestError, ValidationError, UnauthorizedError } from '../shared/errors';
import { JobService } from "../services/job.service";

/**
 * GET /jobs - Récupérer tous les métiers
 */
export async function getAllJobs(req: Request, res: Response) {
  try {
    const jobs = await JobService.getAllJobs();
    res.json(jobs);
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /jobs/:id - Récupérer un métier par ID
 */
export async function getJobById(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.id);
    const job = await JobService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error: any) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /jobs - Créer un nouveau métier
 */
export async function createJob(req: Request, res: Response) {
  try {
    const { name, description, startingAbilityId, optionalAbilityId } = req.body;

    if (!name || !startingAbilityId) {
      return res.status(400).json({
        error: "name and startingAbilityId are required"
      });
    }

    const job = await JobService.createJob({
      name,
      description,
      startingAbilityId,
      optionalAbilityId,
    });

    res.status(201).json(job);
  } catch (error: any) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PATCH /jobs/:id - Mettre à jour un métier
 */
export async function updateJob(req: Request, res: Response) {
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
  } catch (error: any) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: error.message });
  }
}

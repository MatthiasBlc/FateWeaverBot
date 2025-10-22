import { z } from "zod";

// POST /projects
export const CreateProjectSchema = z.object({
  body: z.object({
    townId: z.string().cuid(),
    blueprintId: z.number().int().positive(),
    characterId: z.string().cuid()
  })
});

// GET /projects/town/:townId
export const GetAllProjectsForTownSchema = z.object({
  params: z.object({
    townId: z.string().cuid()
  })
});

// GET /projects/town/:townId/craft-type/:craftType
export const GetProjectsByCraftTypeSchema = z.object({
  params: z.object({
    townId: z.string().cuid(),
    craftType: z.string().min(1)
  })
});

// GET /projects/:projectId
export const GetProjectByIdSchema = z.object({
  params: z.object({
    projectId: z.string().cuid()
  })
});

// POST /projects/characters/:characterId/projects/:projectId/contribute
export const ContributeToProjectSchema = z.object({
  params: z.object({
    characterId: z.string().cuid(),
    projectId: z.string().cuid()
  })
});

// DELETE /projects/:projectId
export const DeleteProjectSchema = z.object({
  params: z.object({
    projectId: z.string().cuid()
  })
});

// POST /projects/:projectId/restart
export const RestartBlueprintSchema = z.object({
  params: z.object({
    projectId: z.string().cuid()
  })
});

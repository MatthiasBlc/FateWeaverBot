import { z } from "zod";

const craftAliasSchema = z.string().min(1);

const resourceCostSchema = z.object({
  resourceTypeId: z.number().int().positive("resourceTypeId must be a positive integer"),
  quantityRequired: z.number().int().nonnegative("quantityRequired must be >= 0"),
});

// POST /projects
export const CreateProjectSchema = z.object({
  body: z.object({
    name: z.string(), // Nom optionnel (peut être vide)
    paRequired: z.number().int().positive("paRequired doit être > 0"),
    outputQuantity: z.number().int().positive("outputQuantity doit être > 0"),
    townId: z.string().cuid(),
    createdBy: z.string().min(1, "createdBy est requis"),
    craftTypes: z.array(craftAliasSchema).nonempty("Au moins un type d'artisanat est requis"),
    outputResourceTypeId: z.number().int().positive().nullable().optional(),
    outputObjectTypeId: z.number().int().positive().nullable().optional(),
    resourceCosts: z.array(resourceCostSchema).optional(),
    paBlueprintRequired: z.number().int().positive().optional(),
    blueprintResourceCosts: z.array(resourceCostSchema).optional(),
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

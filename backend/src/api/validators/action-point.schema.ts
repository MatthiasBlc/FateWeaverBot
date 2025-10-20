import { z } from "zod";

// GET /action-points/:characterId
export const GetActionPointsSchema = z.object({
  params: z.object({
    characterId: z.string().uuid()
  })
});

// POST /action-points/:characterId/use
export const UseActionPointSchema = z.object({
  params: z.object({
    characterId: z.string().uuid()
  }),
  body: z.object({
    amount: z.number().int().positive().optional()
  })
});

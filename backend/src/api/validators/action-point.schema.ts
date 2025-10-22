import { z } from "zod";

// GET /action-points/:characterId
export const GetActionPointsSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  })
});

// POST /action-points/:characterId/use
export const UseActionPointSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  }),
  body: z.object({
    amount: z.number().int().positive().optional()
  })
});

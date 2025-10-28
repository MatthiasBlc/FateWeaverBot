import { z } from "zod";

// POST /seasons/set
export const SetSeasonSchema = z.object({
  body: z.object({
    season: z.enum(["spring", "summer", "fall", "winter"]),
    startDate: z.string().datetime().optional()
  })
});

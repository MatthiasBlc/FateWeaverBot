import { z } from "zod";

// POST /towns
export const UpsertTownSchema = z.object({
  body: z.object({
    guildId: z.string().min(1),
    name: z.string().min(1).max(100),
    description: z.string().optional()
  })
});

// GET /towns/guild/:guildId
export const GetTownByGuildIdSchema = z.object({
  params: z.object({
    guildId: z.string().min(1)
  })
});

// GET /towns/:id
export const GetTownByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// PATCH /towns/:id/vivres-stock
export const UpdateTownVivresStockSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    quantity: z.number().int().min(0)
  })
});

// GET /towns/:id/weather
export const GetTownWeatherSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// GET /towns/:id/actions-recap
export const GetTownActionsRecapSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// GET /towns/:id/stocks-summary
export const GetTownStocksSummarySchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// GET /towns/:id/expeditions-summary
export const GetTownExpeditionsSummarySchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

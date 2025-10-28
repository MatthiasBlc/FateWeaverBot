import { z } from "zod";

// POST /chantier
export const CreateChantierSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    cost: z.number().int().positive().optional(),
    discordGuildId: z.string().optional(),
    townId: z.string().cuid().optional(),
    createdBy: z.string().optional(),
    completionText: z.string().optional(),
    resourceCosts: z.array(z.object({
      resourceTypeId: z.number().int().positive(),
      quantity: z.number().int().positive()
    })).optional()
  })
});

// GET /chantier/guild/:guildId
export const GetChantiersByGuildSchema = z.object({
  params: z.object({
    guildId: z.string().min(1)
  })
});

// GET /chantier/:id
export const GetChantierByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// DELETE /chantier/:id
export const DeleteChantierSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /chantier/:chantierId/invest
export const InvestInChantierSchema = z.object({
  params: z.object({
    chantierId: z.string().cuid()
  }),
  body: z.object({
    characterId: z.string().cuid(),
    points: z.number().int().positive()
  })
});

// POST /chantier/:id/contribute-resources
export const ContributeResourcesSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    characterId: z.string().cuid().optional(),
    townId: z.string().cuid().optional(),
    contributions: z.array(z.object({
      resourceTypeId: z.number().int().positive(),
      quantity: z.number().int().positive()
    })).optional(),
    resources: z.array(z.object({
      resourceTypeId: z.number().int().positive(),
      quantity: z.number().int().positive()
    })).optional()
  })
});

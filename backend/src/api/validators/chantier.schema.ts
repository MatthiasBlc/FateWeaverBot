import { z } from "zod";

// POST /chantier
export const CreateChantierSchema = z.object({
  body: z.object({
    guildId: z.string().min(1),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    requiredInvestment: z.number().int().positive(),
    requiredResources: z.array(z.object({
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
    id: z.string().uuid()
  })
});

// DELETE /chantier/:id
export const DeleteChantierSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// POST /chantier/:chantierId/invest
export const InvestInChantierSchema = z.object({
  params: z.object({
    chantierId: z.string().uuid()
  }),
  body: z.object({
    characterId: z.string().uuid(),
    actionPoints: z.number().int().positive()
  })
});

// POST /chantier/:id/contribute-resources
export const ContributeResourcesSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    townId: z.string().uuid(),
    resources: z.array(z.object({
      resourceTypeId: z.number().int().positive(),
      quantity: z.number().int().positive()
    }))
  })
});

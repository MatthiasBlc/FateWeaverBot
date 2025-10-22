import { z } from "zod";

// POST /capabilities
export const CreateCapabilitySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    apCost: z.number().int().min(0),
    cooldown: z.number().int().min(0).optional()
  })
});

// GET /capabilities/cataplasme-count/:townId
export const GetCataplasmeCountSchema = z.object({
  params: z.object({
    townId: z.string().cuid()
  })
});

// POST /capabilities/:characterId/couper-du-bois
export const ExecuteCouperDuBoisSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  })
});

// POST /capabilities/:characterId/miner
export const ExecuteMinerSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  })
});

// POST /capabilities/:characterId/pecher
export const ExecuteFishSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  })
});

// POST /capabilities/:characterId/harvest
export const ExecuteHarvestSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  })
});

// POST /capabilities/:characterId/craft
export const ExecuteCraftSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  }),
  body: z.object({
    blueprintId: z.number().int().positive(),
    quantity: z.number().int().positive().optional()
  })
});

// POST /capabilities/:characterId/soigner
export const ExecuteSoignerSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  }),
  body: z.object({
    targetCharacterId: z.string().cuid()
  })
});

// POST /capabilities/:characterId/research
export const ExecuteResearchSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  }),
  body: z.object({
    blueprintId: z.number().int().positive()
  })
});

// POST /capabilities/:characterId/divertir
export const ExecuteDivertirSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  })
});

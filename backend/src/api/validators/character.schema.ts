import { z } from "zod";

// GET /characters/active/:discordId/:townId
export const GetActiveCharacterSchema = z.object({
  params: z.object({
    discordId: z.string().min(1),
    townId: z.string().cuid()
  })
});

// POST /characters (upsert)
export const UpsertCharacterSchema = z.object({
  body: z.object({
    userId: z.string().cuid(),
    townId: z.string().cuid(),
    name: z.string().min(1).max(50),
    jobId: z.number().int().positive()
  })
});

// GET /characters/:id
export const GetCharacterByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// GET /characters/guild/:guildId
export const GetGuildCharactersSchema = z.object({
  params: z.object({
    guildId: z.string().min(1)
  })
});

// GET /characters/town/:townId
export const GetTownCharactersSchema = z.object({
  params: z.object({
    townId: z.string().cuid()
  })
});

// POST /characters/:id/kill
export const KillCharacterSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /characters/:id/grant-reroll
export const GrantRerollPermissionSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /characters/reroll
export const CreateRerollCharacterSchema = z.object({
  body: z.object({
    userId: z.string().cuid(),
    townId: z.string().cuid(),
    deadCharacterId: z.string().cuid(),
    name: z.string().min(1).max(50),
    jobId: z.number().int().positive()
  })
});

// POST /characters/switch-active
export const SwitchActiveCharacterSchema = z.object({
  body: z.object({
    userId: z.string().cuid(),
    characterId: z.string().cuid()
  })
});

// GET /characters/rerollable/:userId/:townId
export const GetRerollableCharactersSchema = z.object({
  params: z.object({
    userId: z.string().cuid(),
    townId: z.string().cuid()
  })
});

// GET /characters/needs-creation/:userId/:townId
export const NeedsCharacterCreationSchema = z.object({
  params: z.object({
    userId: z.string().cuid(),
    townId: z.string().cuid()
  })
});

// PATCH /characters/:id/stats
export const UpdateCharacterStatsSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    hp: z.number().int().min(0).max(5).optional(),
    pm: z.number().int().min(0).max(5).optional(),
    hungerLevel: z.number().int().min(0).max(4).optional(),
    agonyLevel: z.number().int().min(0).optional()
  })
});

// POST /characters/:id/eat
export const EatFoodSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /characters/:id/eat-alternative
export const EatFoodAlternativeSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    foodType: z.string().min(1)
  })
});

// GET /characters/:id/capabilities
export const GetCharacterCapabilitiesSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// GET /characters/:id/available-capabilities
export const GetAvailableCapabilitiesSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /characters/:id/capabilities/use
export const UseCharacterCapabilitySchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    capabilityId: z.string().cuid()
  })
});

// POST /characters/:id/capabilities/:capabilityId
export const AddCharacterCapabilitySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    capabilityId: z.string().regex(/^\d+$/).transform(Number)
  })
});

// DELETE /characters/:id/capabilities/:capabilityId
export const RemoveCharacterCapabilitySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    capabilityId: z.string().regex(/^\d+$/).transform(Number)
  })
});

// GET /characters/:id/skills
export const GetCharacterSkillsSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /characters/:id/skills/:skillId
export const AddCharacterSkillSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    skillId: z.string().regex(/^\d+$/).transform(Number)
  })
});

// DELETE /characters/:id/skills/:skillId
export const RemoveCharacterSkillSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    skillId: z.string().regex(/^\d+$/).transform(Number)
  })
});

// GET /characters/:id/objects
export const GetCharacterObjectsSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /characters/:id/objects/:objectId
export const AddObjectToCharacterByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    objectId: z.string().regex(/^\d+$/).transform(Number)
  })
});

// DELETE /characters/:id/objects/:objectId
export const RemoveObjectFromCharacterByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    objectId: z.string().regex(/^\d+$/).transform(Number)
  })
});

// GET /characters/:id/inventory
export const GetCharacterInventorySchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /characters/:id/inventory/add
export const AddObjectToCharacterSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    objectTypeId: z.number().int().positive(),
    quantity: z.number().int().positive().optional()
  })
});

// DELETE /characters/:id/inventory/:slotId
export const RemoveObjectFromCharacterSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
    slotId: z.string().cuid()
  })
});

// POST /characters/:id/inventory/transfer
export const TransferObjectSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    targetCharacterId: z.string().cuid(),
    slotId: z.string().cuid(),
    quantity: z.number().int().positive().optional()
  })
});

// POST /characters/:id/job
export const ChangeCharacterJobSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    jobId: z.number().int().positive()
  })
});

// POST /characters/:id/use-cataplasme
export const UseCataplasmeSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

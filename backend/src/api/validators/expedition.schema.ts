import { z } from "zod";

// POST /expedition
export const CreateExpeditionSchema = z.object({
  body: z.object({
    townId: z.string().cuid(),
    leaderId: z.string().cuid(),
    direction: z.string().min(1).optional()
  })
});

// GET /expedition/:id
export const GetExpeditionByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// GET /expedition/town/:townId
export const GetExpeditionsByTownSchema = z.object({
  params: z.object({
    townId: z.string().cuid()
  })
});

// POST /expedition/:id/join
export const JoinExpeditionSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    characterId: z.string().cuid()
  })
});

// POST /expedition/:id/leave
export const LeaveExpeditionSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    characterId: z.string().cuid()
  })
});

// GET /expedition/character/:characterId/active
export const GetActiveExpeditionsForCharacterSchema = z.object({
  params: z.object({
    characterId: z.string().cuid()
  })
});

// POST /expedition/:id/transfer
export const TransferExpeditionResourceSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    resourceTypeId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    direction: z.enum(["toExpedition", "toTown"])
  })
});

// POST /expedition/:id/emergency-vote
export const ToggleEmergencyVoteSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    characterId: z.string().cuid()
  })
});

// POST /expedition/:id/set-direction
export const SetExpeditionDirectionSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  }),
  body: z.object({
    direction: z.string().min(1)
  })
});

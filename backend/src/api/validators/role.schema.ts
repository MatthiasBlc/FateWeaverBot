import { z } from "zod";

// POST /roles
export const UpsertRoleSchema = z.object({
  body: z.object({
    discordId: z.string().min(1),
    guildId: z.string().min(1),
    name: z.string().min(1).max(100),
    color: z.string().optional()
  })
});

// GET /roles/discord/:discordId/guild/:guildId
export const GetRoleByDiscordIdSchema = z.object({
  params: z.object({
    discordId: z.string().min(1),
    guildId: z.string().min(1)
  })
});

// GET /roles/guild/:guildId
export const GetGuildRolesSchema = z.object({
  params: z.object({
    guildId: z.string().min(1)
  })
});

// DELETE /roles/:id
export const DeleteRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// PUT /roles/character/:characterId
export const UpdateCharacterRolesSchema = z.object({
  params: z.object({
    characterId: z.string().uuid()
  }),
  body: z.object({
    roleIds: z.array(z.string().uuid())
  })
});

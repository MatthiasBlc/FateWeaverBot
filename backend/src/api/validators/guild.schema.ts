import { z } from "zod";

// POST /guilds
export const UpsertGuildSchema = z.object({
  body: z.object({
    discordId: z.string().min(1),
    name: z.string().min(1).max(100),
    iconURL: z.string().url().optional(),
    logChannelId: z.string().min(1).optional(),
    dailyMessageChannelId: z.string().min(1).optional(),
    adminLogChannelId: z.string().min(1).optional()
  })
});

// GET /guilds/discord/:discordId
export const GetGuildByDiscordIdSchema = z.object({
  params: z.object({
    discordId: z.string().min(1)
  })
});

// GET /guilds/:id
export const GetGuildByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// PATCH /guilds/:discordId/log-channel
export const UpdateGuildLogChannelSchema = z.object({
  params: z.object({
    discordId: z.string().min(1)
  }),
  body: z.object({
    logChannelId: z.string().min(1)
  })
});

// PATCH /guilds/:discordId/daily-message-channel
export const UpdateGuildDailyMessageChannelSchema = z.object({
  params: z.object({
    discordId: z.string().min(1)
  }),
  body: z.object({
    dailyMessageChannelId: z.string().min(1)
  })
});

// PATCH /guilds/:discordId/admin-log-channel
export const UpdateGuildAdminLogChannelSchema = z.object({
  params: z.object({
    discordId: z.string().min(1)
  }),
  body: z.object({
    adminLogChannelId: z.string().min(1)
  })
});

// DELETE /guilds/:id
export const DeleteGuildSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

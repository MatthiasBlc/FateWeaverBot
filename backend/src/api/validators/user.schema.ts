import { z } from "zod";

// POST /users
export const UpsertUserSchema = z.object({
  body: z.object({
    discordId: z.string().min(1),
    username: z.string().min(1).max(100),
    discriminator: z.string().optional(),
    avatarURL: z.string().url().optional()
  })
});

// GET /users/discord/:discordId
export const GetUserByDiscordIdSchema = z.object({
  params: z.object({
    discordId: z.string().min(1)
  })
});

// PUT /users/discord/:discordId
export const UpdateUserByDiscordIdSchema = z.object({
  params: z.object({
    discordId: z.string().min(1)
  }),
  body: z.object({
    username: z.string().min(1).max(100).optional(),
    discriminator: z.string().optional(),
    avatarURL: z.string().url().optional()
  })
});

// DELETE /users/:id
export const DeleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

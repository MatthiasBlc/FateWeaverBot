import { z } from "zod";

// POST /admin/emojis
export const CreateEmojiSchema = z.object({
  body: z.object({
    type: z.string().min(1).max(50),
    key: z.string().min(1).max(100),
    emoji: z.string().min(1).max(10), // Emoji can be multiple bytes
  }),
});

// DELETE /admin/emojis/:type/:key
export const DeleteEmojiSchema = z.object({
  params: z.object({
    type: z.string().min(1),
    key: z.string().min(1),
  }),
});

// GET /admin/emojis/list?type=resource
export const ListEmojiSchema = z.object({
  query: z.object({
    type: z.string().optional(),
  }),
});

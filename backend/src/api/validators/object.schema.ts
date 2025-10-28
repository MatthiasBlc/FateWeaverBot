import { z } from "zod";

// GET /objects/:id
export const GetObjectTypeByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number)
  })
});

// POST /objects
export const CreateObjectTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    icon: z.string().optional(),
    isStackable: z.boolean().optional(),
    maxStackSize: z.number().int().positive().optional()
  })
});

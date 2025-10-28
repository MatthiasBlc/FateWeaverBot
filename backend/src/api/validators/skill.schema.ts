import { z } from "zod";

// GET /skills/:id
export const GetSkillByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
});

// POST /skills
export const CreateSkillSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    icon: z.string().optional()
  })
});

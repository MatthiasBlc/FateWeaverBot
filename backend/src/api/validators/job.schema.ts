import { z } from "zod";

// GET /jobs/:id
export const GetJobByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number)
  })
});

// POST /jobs
export const CreateJobSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    icon: z.string().optional()
  })
});

// PATCH /jobs/:id
export const UpdateJobSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number)
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    icon: z.string().optional()
  })
});

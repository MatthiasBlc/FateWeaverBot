import { z } from "zod";

// GET /resources/:locationType/:locationId
export const GetResourcesSchema = z.object({
  params: z.object({
    locationType: z.enum(["town", "expedition"]),
    locationId: z.string().uuid()
  })
});

// POST /resources/:locationType/:locationId/:resourceTypeId
export const AddResourceSchema = z.object({
  params: z.object({
    locationType: z.enum(["town", "expedition"]),
    locationId: z.string().uuid(),
    resourceTypeId: z.string().regex(/^\d+$/).transform(Number)
  }),
  body: z.object({
    quantity: z.number().int().positive()
  })
});

// PUT /resources/:locationType/:locationId/:resourceTypeId
export const UpdateResourceSchema = z.object({
  params: z.object({
    locationType: z.enum(["town", "expedition"]),
    locationId: z.string().uuid(),
    resourceTypeId: z.string().regex(/^\d+$/).transform(Number)
  }),
  body: z.object({
    quantity: z.number().int().min(0)
  })
});

// DELETE /resources/:locationType/:locationId/:resourceTypeId
export const RemoveResourceSchema = z.object({
  params: z.object({
    locationType: z.enum(["town", "expedition"]),
    locationId: z.string().uuid(),
    resourceTypeId: z.string().regex(/^\d+$/).transform(Number)
  }),
  body: z.object({
    quantity: z.number().int().positive()
  })
});

// POST /resources/:fromLocationType/:fromLocationId/:toLocationType/:toLocationId/:resourceTypeId/transfer
export const TransferResourceSchema = z.object({
  params: z.object({
    fromLocationType: z.enum(["town", "expedition"]),
    fromLocationId: z.string().uuid(),
    toLocationType: z.enum(["town", "expedition"]),
    toLocationId: z.string().uuid(),
    resourceTypeId: z.string().regex(/^\d+$/).transform(Number)
  }),
  body: z.object({
    quantity: z.number().int().positive()
  })
});

// POST /resources/types
export const CreateResourceTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    icon: z.string().optional()
  })
});

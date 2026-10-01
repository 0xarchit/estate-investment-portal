import { z } from "zod";

export const propertyMediaSchema = z.object({
  url: z.string().url("Valid URL required"),
  publicId: z.string().optional(),
  name: z.string().min(1, "Media name is required"),
});

export const createPropertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").trim(),
  description: z.string().min(10, "Description must be at least 10 characters").trim(),
  type: z.enum(["APARTMENT", "VILLA", "COMMERCIAL", "PLOT", "WAREHOUSE"]),
  address: z.string().min(5, "Address must be at least 5 characters").trim(),
  city: z.string().min(2, "City is required").trim(),
  state: z.string().min(2, "State is required").trim(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  geo: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  areaSqft: z.number().positive().optional(),
  images: z.array(propertyMediaSchema).default([]),
  documents: z.array(propertyMediaSchema).default([]),
  valuation: z.number().int().positive("Valuation must be a positive integer in paise"),
  totalUnits: z.number().int().positive("Total units must be a positive integer"),
  minUnits: z.number().int().min(1).default(1),
  maxUnitsPerInvestor: z.number().int().positive().optional(),
  expectedAppreciationPct: z.number().min(0).default(0),
  rentalYieldPct: z.number().min(0).default(0),
  holdingPeriodMonths: z.number().int().positive().default(36),
});

export const updatePropertySchema = createPropertySchema.partial();

export const rejectPropertySchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters long").trim(),
});

export const changePropertyStatusSchema = z.object({
  status: z.enum(["HOLDING", "CANCELLED"]),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type RejectPropertyInput = z.infer<typeof rejectPropertySchema>;
export type ChangePropertyStatusInput = z.infer<typeof changePropertyStatusSchema>;

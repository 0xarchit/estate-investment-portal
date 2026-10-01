import { z } from "zod";

export const propertyMediaItemSchema = z.object({
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
  images: z.array(propertyMediaItemSchema).default([]),
  documents: z.array(propertyMediaItemSchema).default([]),
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

// P5 wizard step schemas
export const propertyBasicsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  type: z.enum(["APARTMENT", "VILLA", "COMMERCIAL", "PLOT", "WAREHOUSE"]),
  areaSqft: z.coerce.number().positive("Area must be positive"),
});

export const propertyLocationSchema = z.object({
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export const propertyFinancialsSchema = z
  .object({
    valuationRupees: z.coerce
      .number()
      .positive("Valuation must be positive")
      .int("Valuation must be a whole number"),
    totalUnits: z.coerce
      .number()
      .int("Total units must be a whole number")
      .positive("Total units must be positive"),
    minUnits: z.coerce
      .number()
      .int("Min units must be a whole number")
      .min(1, "Minimum 1 unit"),
    maxUnitsPerInvestor: z.coerce
      .number()
      .int("Max units must be a whole number")
      .positive("Max units must be positive"),
    expectedAppreciationPct: z.coerce
      .number()
      .min(0)
      .max(100, "Must be between 0-100"),
    rentalYieldPct: z.coerce.number().min(0).max(100, "Must be between 0-100"),
    holdingPeriodMonths: z.coerce
      .number()
      .int()
      .positive("Holding period must be positive"),
  })
  .refine(
    (d) => d.valuationRupees % d.totalUnits === 0,
    {
      message: "Choose units so price per unit is a whole rupee",
      path: ["totalUnits"],
    }
  )
  .refine((d) => d.minUnits <= d.maxUnitsPerInvestor, {
    message: "Max units must be >= min units",
    path: ["maxUnitsPerInvestor"],
  });

export const propertyMediaSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string(),
        publicId: z.string().optional(),
        name: z.string(),
      })
    )
    .min(3, "At least 3 images are required"),
  documents: z
    .array(
      z.object({
        url: z.string(),
        publicId: z.string().optional(),
        name: z.string(),
      })
    )
    .optional()
    .default([]),
});

export const propertyFormSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  type: z.enum(["APARTMENT", "VILLA", "COMMERCIAL", "PLOT", "WAREHOUSE"]),
  areaSqft: z.coerce.number().positive(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  valuationRupees: z.coerce.number().positive(),
  totalUnits: z.coerce.number().int().positive(),
  minUnits: z.coerce.number().int().min(1),
  maxUnitsPerInvestor: z.coerce.number().int().positive(),
  expectedAppreciationPct: z.coerce.number().min(0).max(100),
  rentalYieldPct: z.coerce.number().min(0).max(100),
  holdingPeriodMonths: z.coerce.number().int().positive(),
  images: z
    .array(z.object({ url: z.string(), publicId: z.string().optional(), name: z.string() }))
    .default([]),
  documents: z
    .array(z.object({ url: z.string(), publicId: z.string().optional(), name: z.string() }))
    .default([]),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type RejectPropertyInput = z.infer<typeof rejectPropertySchema>;
export type ChangePropertyStatusInput = z.infer<typeof changePropertyStatusSchema>;
export type PropertyBasicsInput = z.infer<typeof propertyBasicsSchema>;
export type PropertyLocationInput = z.infer<typeof propertyLocationSchema>;
export type PropertyFinancialsInput = z.infer<typeof propertyFinancialsSchema>;
export type PropertyMediaInput = z.infer<typeof propertyMediaSchema>;
export type PropertyFormInput = z.infer<typeof propertyFormSchema>;

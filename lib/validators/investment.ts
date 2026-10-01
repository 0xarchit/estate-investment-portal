import { z } from "zod";

export const investSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  units: z.number().int().positive("Units must be a positive integer"),
  idempotencyKey: z.string().optional(),
});

export type InvestInput = z.infer<typeof investSchema>;

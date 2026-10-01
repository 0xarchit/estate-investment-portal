import { z } from 'zod';
import { moneySchema, paginationSchema } from './wallet';

export const saleSchema = z.object({ salePrice: moneySchema }).strict();
export const payoutPreviewSchema = z.object({ salePrice: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
export const reviewSchema = z.object({ action: z.enum(['APPROVE', 'REJECT']), reason: z.string().trim().min(5).max(1000).optional() }).strict()
  .refine(value => value.action !== 'REJECT' || Boolean(value.reason), { message: 'A rejection reason is required', path: ['reason'] });
export const userUpdateSchema = z.object({ isActive: z.boolean().optional(), role: z.enum(['ADMIN', 'BROKER', 'INVESTOR']).optional(), brokerApproved: z.boolean().optional() }).strict()
  .refine(value => Object.keys(value).length > 0, 'Supply at least one change');
export const userQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(), role: z.enum(['ADMIN', 'BROKER', 'INVESTOR']).optional(),
  isActive: z.enum(['true', 'false']).transform(value => value === 'true').optional(),
});
export const settingsSchema = z.object({
  platformFeePct: z.number().min(0).max(20).multipleOf(0.01).optional(),
  brokerCommissionPct: z.number().min(0).max(10).multipleOf(0.01).optional(),
  maxOwnershipPct: z.number().min(1).max(100).multipleOf(0.01).optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'Supply at least one setting');
export const withdrawalQuerySchema = paginationSchema.extend({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() });
export const brokerQuerySchema = paginationSchema.extend({ status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'LIVE', 'FUNDED', 'HOLDING', 'SOLD', 'CANCELLED']).optional() });

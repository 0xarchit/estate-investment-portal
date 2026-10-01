import { z } from 'zod';
import { paginationSchema } from './wallet';

export const kycSchema = z.object({ docs: z.array(z.object({ url: z.string().url().refine(value => new URL(value).protocol === 'https:', 'Use an HTTPS upload URL'), name: z.string().trim().min(1).max(200) }).strict()).min(1).max(3) }).strict();
export const kycQuerySchema = paginationSchema.extend({ status: z.enum(['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED']).default('PENDING') });

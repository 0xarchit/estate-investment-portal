import { z } from 'zod';

export const moneySchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const topupOrderSchema = z.object({ amount: moneySchema.min(10_000).max(100_000_000) }).strict();
export const topupVerifySchema = z.object({
  orderId: z.string().regex(/^order_[a-f0-9-]{36}$/),
  paymentId: z.string().regex(/^pay_[a-f0-9-]{36}$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();
export const bankDetailsSchema = z.object({
  accountName: z.string().trim().min(2).max(100),
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Use a dummy account number of 9–18 digits'),
  ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
}).strict();
export const withdrawalSchema = z.object({ amount: moneySchema, bankDetails: bankDetailsSchema }).strict();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid identifier');
export const transactionQuerySchema = paginationSchema.extend({
  propertyId: objectIdSchema.optional(),
  type: z.enum(['TOPUP', 'INVESTMENT', 'PAYOUT', 'REFUND', 'COMMISSION', 'WITHDRAWAL', 'FEE']).optional(),
  direction: z.enum(['CREDIT', 'DEBIT']).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  sort: z.literal('-createdAt').optional(),
}).refine(value => !value.from || !value.to || new Date(value.from) <= new Date(value.to), { message: 'from must precede to', path: ['to'] });
export type TopupVerification = z.infer<typeof topupVerifySchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;

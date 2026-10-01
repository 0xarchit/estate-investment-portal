/** ISOLATED TEST SUPPORT ONLY. This is not P1 implementation and is never imported by application code.
 * Used by docs/testing/vitest.config.ts while the real P1 foundation is unavailable.
 */
import mongoose, { Schema, Types, ClientSession } from 'mongoose';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { NextResponse } from 'next/server';

type Row = { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
interface UserRow extends Row { name: string; email: string; phone: string; passwordHash: string; role: 'ADMIN' | 'BROKER' | 'INVESTOR'; isActive: boolean; brokerApproved: boolean; walletBalance: number; kyc: { status: string; docs: { url: string; name: string }[]; reason?: string } }
interface PropertyRow extends Row { title: string; city: string; status: string; brokerId: Types.ObjectId; valuation: number; totalUnits: number; unitsSold: number; unitPrice: number; fundedAt?: Date; holdingPeriodMonths?: number; expectedAppreciationPct?: number; images: { url: string }[]; [key: string]: unknown }
interface InvestmentRow extends Row { investorId: Types.ObjectId; propertyId: Types.ObjectId; units: number; amount: number; status: string; payoutAmount?: number }
interface TransactionRow extends Row { userId: Types.ObjectId; type: string; direction: 'CREDIT' | 'DEBIT'; amount: number; balanceAfter: number; refType?: string; refId?: Types.ObjectId; gatewayPaymentId?: string; note?: string }
interface PayoutRow extends Row { propertyId: Types.ObjectId; salePrice: number; platformFee: number; distributable: number; items: { investorId: Types.ObjectId; units: number; amount: number }[]; executedBy: Types.ObjectId; executedAt: Date }
interface WithdrawalRow extends Row { userId: Types.ObjectId; amount: number; status: string; bankDetails: { accountName: string; accountNumber: string; ifsc: string }; reason?: string; processedBy?: Types.ObjectId }
interface NotificationRow extends Row { userId: Types.ObjectId; type: string; title: string; body: string; link?: string; read: boolean }
interface SettingsRow extends Row { platformFeePct: number; brokerCommissionPct: number; maxOwnershipPct: number }
interface GatewayRow extends Row { orderId: string; userId: Types.ObjectId; amount: number; status: string; paymentId?: string }
const id = Schema.Types.ObjectId;
function fixtureModel<T>(name: string, fields: Record<string, unknown>) {
  const schema = new Schema<T>(fields as mongoose.SchemaDefinition<T>, { timestamps: true });
  return (mongoose.models[name] as mongoose.Model<T>) ?? mongoose.model<T>(name, schema);
}
export const User = fixtureModel<UserRow>('User', { name: String, email: { type: String, unique: true }, phone: String, passwordHash: { type: String, select: false }, role: String, isActive: { type: Boolean, default: true }, brokerApproved: { type: Boolean, default: false }, walletBalance: { type: Number, default: 0 }, kyc: { status: { type: String, default: 'NOT_SUBMITTED' }, docs: [{ url: String, name: String }], reason: String } });
export const Property = fixtureModel<PropertyRow>('Property', { title: String, city: String, status: String, brokerId: id, valuation: Number, totalUnits: Number, unitsSold: Number, unitPrice: Number, fundedAt: Date, images: [{ url: String }], description: String, type: String, address: String, state: String, pincode: String, geo: { lat: Number, lng: Number }, areaSqft: Number, documents: [{ url: String, name: String }], minUnits: Number, maxUnitsPerInvestor: Number, expectedAppreciationPct: Number, rentalYieldPct: Number, holdingPeriodMonths: Number, approvedBy: id, liveAt: Date, salePrice: Number, soldAt: Date, rejectionReason: String });
export const Investment = fixtureModel<InvestmentRow>('Investment', { investorId: id, propertyId: id, units: Number, amount: Number, status: String, payoutAmount: Number });
export const Transaction = fixtureModel<TransactionRow>('Transaction', { userId: id, type: String, direction: String, amount: Number, balanceAfter: Number, refType: String, refId: id, gatewayPaymentId: { type: String, unique: true, sparse: true }, note: String });
export const Payout = fixtureModel<PayoutRow>('Payout', { propertyId: { type: id, unique: true }, salePrice: Number, platformFee: Number, distributable: Number, items: [{ investorId: id, units: Number, amount: Number }], executedBy: id, executedAt: Date });
export const Withdrawal = fixtureModel<WithdrawalRow>('Withdrawal', { userId: id, amount: Number, status: String, bankDetails: { accountName: String, accountNumber: String, ifsc: String }, reason: String, processedBy: id });
export const Notification = fixtureModel<NotificationRow>('Notification', { userId: id, type: String, title: String, body: String, link: String, read: { type: Boolean, default: false } });
export const Settings = fixtureModel<SettingsRow>('Settings', { platformFeePct: { type: Number, default: 2 }, brokerCommissionPct: { type: Number, default: 1 }, maxOwnershipPct: { type: Number, default: 49 } });
export const GatewayOrder = fixtureModel<GatewayRow>('GatewayOrder', { orderId: { type: String, unique: true }, userId: id, amount: Number, status: String, paymentId: String });
export class ApiError extends Error { constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); } }
export const ok = (data: unknown, message?: string, status = 200) => NextResponse.json({ success: true, data, ...(message ? { message } : {}) }, { status });
export function paginate({ page = 1, limit = 20 }: { page?: number; limit?: number }) { return { skip: (page - 1) * limit, limit }; }
export function listResult(items: unknown[], total: number, page: number, limit: number) { return { items, total, page, limit, totalPages: Math.ceil(total / limit) }; }
export async function getSettings(session?: ClientSession) {
  const settings = await Settings.findOne().session(session ?? null);
  if (!settings) throw new ApiError(503, 'SETTINGS_NOT_READY', 'Test settings missing');
  return settings;
}
export async function notify(userId: string, input: { type: string; title: string; body: string; link?: string }, session?: ClientSession) { const [notification] = await Notification.create([{ userId, ...input }], { session }); return notification; }
export function assertTransition(from: string, to: string) { if (from !== 'HOLDING' || to !== 'SOLD') throw new ApiError(409, 'INVALID_TRANSITION', 'Invalid property transition'); }
export function serializeProperty(doc: mongoose.HydratedDocument<PropertyRow>, extras?: Record<string, unknown>) { return { ...doc.toObject(), fundingPct: doc.totalUnits ? Math.round(doc.unitsSold / doc.totalUnits * 10000) / 100 : 0, remainingUnits: doc.totalUnits - doc.unitsSold, ...extras }; }
type LedgerInput = { userId: string; type: string; direction: 'CREDIT' | 'DEBIT'; amount: number; refType?: string; refId?: unknown; gatewayPaymentId?: string; note?: string; session?: ClientSession };
export const ledger = {
  async post(input: LedgerInput) {
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid ledger amount');
    const user = await User.findOneAndUpdate({ _id: input.userId, ...(input.direction === 'DEBIT' ? { walletBalance: { $gte: input.amount } } : {}) }, { $inc: { walletBalance: input.direction === 'CREDIT' ? input.amount : -input.amount } }, { new: true, session: input.session });
    if (!user) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance');
    const { session, ...entry } = input;
    const [row] = await Transaction.create([{ ...entry, balanceAfter: user.walletBalance }], { session });
    return row;
  },
  async getBalance(userId: string) { return (await User.findById(userId))?.walletBalance ?? 0; },
};
type TestContext<S extends z.ZodTypeAny> = { req: Request; params: Record<string, string>; query: Record<string, string>; body: z.infer<S>; user: mongoose.HydratedDocument<UserRow> };
export function route<S extends z.ZodTypeAny = z.ZodTypeAny>(options: { auth?: boolean; roles?: string[]; schema?: S }, fn: (context: TestContext<S>) => Promise<Response>) {
  return async (req: Request, context?: { params: Record<string, string> }) => {
    try {
      let sub: string;
      try { const payload = jwt.verify(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '', process.env.JWT_SECRET!); if (typeof payload === 'string' || !payload.sub) throw new Error(); sub = payload.sub; }
      catch { throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid token'); }
      const user = await User.findById(sub);
      if (!user || !user.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Account unavailable');
      if (options.roles && !options.roles.includes(user.role)) throw new ApiError(403, 'FORBIDDEN', 'Role not allowed');
      const body = options.schema ? options.schema.parse(await req.json()) : undefined;
      return await fn({ req, params: context?.params ?? {}, query: Object.fromEntries(new URL(req.url).searchParams), body, user });
    } catch (error) {
      const failure = error instanceof ApiError ? error : error instanceof z.ZodError ? new ApiError(400, 'VALIDATION_ERROR', 'Invalid request') : new ApiError(500, 'INTERNAL_ERROR', 'Unexpected error');
      return NextResponse.json({ success: false, error: { code: failure.code, message: failure.message } }, { status: failure.status });
    }
  };
}

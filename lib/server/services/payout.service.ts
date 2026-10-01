import mongoose, { ClientSession } from 'mongoose';
import { Property, Investment, Payout, User, Settings } from '@/lib/server/models';
import { env } from '@/lib/server/config/env';
import { ApiError } from '@/lib/server/errors';
import { ledger } from '@/lib/server/services/ledger.service';
import { getSettings } from '@/lib/server/services/settings.service';
import { notify } from '@/lib/server/services/notification.service';
import { assertTransition } from '@/lib/server/services/property.service';
import { moneySchema, objectIdSchema } from '@/lib/validators/wallet';

export type Holder = { investorId: string; units: number };
export type PayoutInput = { salePrice: number; platformFeePct: number; totalUnits: number; holders: Holder[] };
function positiveInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${field} must be a positive safe integer`);
}

/** Pure integer arithmetic. All units must be held: an unowned share is not a rounding remainder. */
export function computePayout({ salePrice, platformFeePct, totalUnits, holders }: PayoutInput) {
  positiveInteger(salePrice, 'salePrice'); positiveInteger(totalUnits, 'totalUnits');
  if (!Number.isFinite(platformFeePct) || platformFeePct < 0 || platformFeePct > 20) throw new Error('platformFeePct must be between 0 and 20');
  const seen = new Set<string>();
  let units = 0n;
  for (const holder of holders) {
    positiveInteger(holder.units, 'units');
    if (!holder.investorId || seen.has(holder.investorId)) throw new Error('Each holder must have a unique investorId');
    seen.add(holder.investorId); units += BigInt(holder.units);
  }
  if (units !== BigInt(totalUnits)) throw new Error('Holder units must exactly equal totalUnits');
  const platformFee = Number(BigInt(salePrice) * BigInt(Math.round(platformFeePct * 100)) / 10_000n);
  const distributable = salePrice - platformFee;
  const items = holders.map(holder => ({ ...holder, amount: Number(BigInt(distributable) * BigInt(holder.units) / BigInt(totalUnits)) }));
  const remainder = distributable - items.reduce((sum, item) => sum + item.amount, 0);
  const largest = [...items].sort((a, b) => b.units - a.units || (a.investorId < b.investorId ? -1 : a.investorId > b.investorId ? 1 : 0))[0];
  largest.amount += remainder;
  if (items.reduce((sum, item) => sum + item.amount, 0) !== distributable) throw new Error('Payout conservation failed');
  return { platformFee, distributable, items, remainder };
}

type AggregatedHolder = Holder & { invested: number };
async function loadHolders(propertyId: string, session?: ClientSession): Promise<AggregatedHolder[]> {
  const aggregation = Investment.aggregate<{ _id: mongoose.Types.ObjectId; units: number; invested: number }>([
    { $match: { propertyId: new mongoose.Types.ObjectId(propertyId), status: 'ACTIVE' } },
    { $group: { _id: '$investorId', units: { $sum: '$units' }, invested: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);
  if (session) aggregation.session(session);
  return (await aggregation).map(holder => ({ investorId: String(holder._id), units: holder.units, invested: holder.invested }));
}
function calculate(input: PayoutInput) {
  try { return computePayout(input); }
  catch { throw new ApiError(409, 'INVALID_HOLDINGS', 'Active holdings must account for every property unit before a sale'); }
}
export async function previewPayout(propertyId: string, salePrice: number) {
  objectIdSchema.parse(propertyId); moneySchema.parse(salePrice);
  const property = await Property.findById(propertyId);
  if (!property) throw new ApiError(404, 'NOT_FOUND', 'Property not found');
  if (!['FUNDED', 'HOLDING'].includes(property.status)) throw new ApiError(409, 'INVALID_TRANSITION', 'Payout preview requires a FUNDED or HOLDING property');
  const holders = await loadHolders(propertyId);
  // getSettings() creates defaults on a fresh database. Preview is a read-only GET.
  const settings = await Settings.findOne().lean() ?? { platformFeePct: env.PLATFORM_FEE_PCT };
  const computed = calculate({ salePrice, platformFeePct: settings.platformFeePct, totalUnits: property.totalUnits, holders });
  const users = await User.find({ _id: { $in: holders.map(holder => holder.investorId) } }).select('name');
  const names = new Map(users.map(user => [String(user._id), user.name]));
  const invested = new Map(holders.map(holder => [holder.investorId, holder.invested]));
  return {
    salePrice, platformFeePct: settings.platformFeePct, ...computed,
    items: computed.items.map(item => ({ ...item, name: names.get(item.investorId) ?? 'Investor', ownershipPct: item.units / property.totalUnits * 100, invested: invested.get(item.investorId) ?? 0, roiPct: invested.get(item.investorId) ? (item.amount / invested.get(item.investorId)! - 1) * 100 : 0 })),
    sumCheck: computed.items.reduce((sum, item) => sum + item.amount, 0) === computed.distributable,
  };
}

export async function executePayout(propertyId: string, salePrice: number, adminId: string) {
  objectIdSchema.parse(propertyId); objectIdSchema.parse(adminId); moneySchema.parse(salePrice);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      if (!await User.exists({ _id: adminId, role: 'ADMIN', isActive: true }).session(session)) {
        throw new ApiError(403, 'FORBIDDEN', 'An active admin is required to execute a payout');
      }
      if (await Payout.exists({ propertyId }).session(session)) throw new ApiError(409, 'ALREADY_SOLD', 'This property has already been sold');
      const property = await Property.findById(propertyId).session(session);
      if (!property) throw new ApiError(404, 'NOT_FOUND', 'Property not found');
      if (property.status === 'SOLD') throw new ApiError(409, 'ALREADY_SOLD', 'This property has already been sold');
      assertTransition(property.status, 'SOLD');
      const holders = await loadHolders(propertyId, session);
      const settings = await getSettings(session);
      const computed = calculate({ salePrice, platformFeePct: settings.platformFeePct, totalUnits: property.totalUnits, holders });
      // Claim the property inside the transaction. Concurrent executions conflict and retry.
      const claimed = await Property.findOneAndUpdate({ _id: propertyId, status: 'HOLDING' }, { $set: { status: 'SOLD', salePrice, soldAt: new Date() } }, { new: true, session });
      if (!claimed) throw new ApiError(409, 'ALREADY_SOLD', 'This property has already been sold');
      const [payout] = await Payout.create([{ propertyId, salePrice, platformFee: computed.platformFee, distributable: computed.distributable, items: computed.items, executedBy: adminId, executedAt: new Date() }], { session });
      for (const item of computed.items) {
        // Ledger contract requires positive amounts; a zero payout still exits the holding.
        if (item.amount > 0) await ledger.post({ userId: item.investorId, type: 'PAYOUT', direction: 'CREDIT', amount: item.amount, refType: 'Payout', refId: payout._id, session });
        const purchases = await Investment.find({ propertyId, investorId: item.investorId, status: 'ACTIVE' }).sort({ _id: 1 }).session(session);
        let allocated = 0;
        for (let index = 0; index < purchases.length; index++) {
          const purchase = purchases[index];
          const amount = index === purchases.length - 1 ? item.amount - allocated : Number(BigInt(item.amount) * BigInt(purchase.units) / BigInt(item.units));
          allocated += amount;
          await Investment.updateOne({ _id: purchase._id, status: 'ACTIVE' }, { $set: { status: 'EXITED', payoutAmount: amount } }, { session });
        }
        await notify(item.investorId, { type: 'PAYOUT', title: 'Property sold', body: `Payout credited: ₹${(item.amount / 100).toFixed(2)}`, link: '/investor/portfolio' }, session);
      }
      if (computed.platformFee > 0) await ledger.post({ userId: adminId, type: 'FEE', direction: 'CREDIT', amount: computed.platformFee, refType: 'Payout', refId: payout._id, session });
      return payout.toObject();
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000 &&
      'keyPattern' in error && error.keyPattern && typeof error.keyPattern === 'object' && 'propertyId' in error.keyPattern) {
      throw new ApiError(409, 'ALREADY_SOLD', 'This property has already been sold');
    }
    throw error;
  } finally { await session.endSession(); }
}

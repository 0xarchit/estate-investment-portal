import mongoose, { FilterQuery } from 'mongoose';
import { User, Property, Investment, Transaction, Withdrawal, Settings } from '@/lib/server/models';
import { ApiError } from '@/lib/server/errors';
import { getSettings } from '@/lib/server/services/settings.service';
import { notify } from '@/lib/server/services/notification.service';
import { serializeProperty } from '@/lib/server/services/property.service';
import { listResult, paginate } from '@/lib/server/http';
import { brokerQuerySchema, userQuerySchema, userUpdateSchema, reviewSchema } from '@/lib/validators/admin';
import { kycSchema, kycQuerySchema } from '@/lib/validators/kyc';
import { objectIdSchema } from '@/lib/validators/wallet';
import { z } from 'zod';

export function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
async function sum(model: typeof Investment | typeof Transaction, match: Record<string, unknown>, field = 'amount') {
  const result = await model.aggregate<{ total: number }>([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }]);
  return result[0]?.total ?? 0;
}
export async function getAdminStats(now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(today); start.setUTCDate(start.getUTCDate() - 29);
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [aum, usersByRole, liveProperties, fundsRaisedThisMonth, platformFeesEarned, daily, statuses, pendingProperties, pendingKyc, pendingBrokers, pendingWithdrawals] = await Promise.all([
    sum(Investment, { status: 'ACTIVE' }),
    User.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Property.countDocuments({ status: 'LIVE' }), sum(Transaction, { type: 'INVESTMENT', direction: 'DEBIT', createdAt: { $gte: month, $lte: now } }), sum(Transaction, { type: 'FEE', direction: 'CREDIT' }),
    Transaction.aggregate<{ _id: string; amount: number }>([{ $match: { type: 'INVESTMENT', direction: 'DEBIT', createdAt: { $gte: start, $lte: now } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, amount: { $sum: '$amount' } } }]),
    Property.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Property.countDocuments({ status: 'PENDING_APPROVAL' }), User.countDocuments({ role: 'INVESTOR', 'kyc.status': 'PENDING' }), User.countDocuments({ role: 'BROKER', brokerApproved: false, isActive: true }), Withdrawal.countDocuments({ status: 'PENDING' }),
  ]);
  const byDay = new Map(daily.map(day => [day._id, day.amount]));
  return {
    kpis: { aum, totalUsers: usersByRole.reduce((total, row) => total + row.count, 0), usersByRole: Object.fromEntries(['ADMIN', 'BROKER', 'INVESTOR'].map(role => [role, usersByRole.find(row => row._id === role)?.count ?? 0])), liveProperties, fundsRaisedThisMonth, platformFeesEarned },
    charts: { fundsRaisedOverTime: Array.from({ length: 30 }, (_, index) => { const date = new Date(start); date.setUTCDate(date.getUTCDate() + index); const key = date.toISOString().slice(0, 10); return { date: key, amount: byDay.get(key) ?? 0 }; }), propertiesByStatus: statuses.map(row => ({ status: row._id, count: row.count })) },
    queues: { pendingProperties, pendingKyc, pendingBrokers, pendingWithdrawals },
  };
}
export async function listUsers(query: Record<string, string>) {
  const { search, role, isActive, page, limit } = userQuerySchema.parse(query);
  const filter: FilterQuery<unknown> = {};
  if (search) filter.$or = [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }];
  if (role) filter.role = role; if (isActive !== undefined) filter.isActive = isActive;
  const { skip } = paginate({ page, limit });
  const [items, total] = await Promise.all([User.find(filter).select('-passwordHash').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  return listResult(items, total, page, limit);
}
export async function updateUser(id: string, adminId: string, input: z.infer<typeof userUpdateSchema>) {
  objectIdSchema.parse(id); objectIdSchema.parse(adminId); const body = userUpdateSchema.parse(input);
  if (id.toLowerCase() === adminId.toLowerCase() && (body.isActive === false || (body.role && body.role !== 'ADMIN'))) throw new ApiError(403, 'FORBIDDEN', 'You cannot deactivate or demote yourself');
  // Settings is the singleton lock for admin membership changes. This serializes
  // concurrent cross-demotions/deactivations so the last active admin is retained.
  await getSettings();
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const guard = await Settings.findOneAndUpdate({}, { $inc: { __v: 1 } }, { new: true, session });
      if (!guard) throw new ApiError(503, 'SETTINGS_NOT_READY', 'Initialize the singleton settings document first');
      const actor = await User.findOne({ _id: adminId, role: 'ADMIN', isActive: true }).session(session);
      if (!actor) throw new ApiError(403, 'FORBIDDEN', 'An active admin is required');
      const target = await User.findById(id).session(session);
      if (!target) throw new ApiError(404, 'NOT_FOUND', 'User not found');
      if (target.role === 'ADMIN' && target.isActive && (body.isActive === false || (body.role && body.role !== 'ADMIN'))) {
        if (await User.countDocuments({ role: 'ADMIN', isActive: true }).session(session) <= 1) throw new ApiError(409, 'LAST_ADMIN', 'The last active admin cannot be deactivated or demoted');
      }
      if (body.brokerApproved !== undefined && (body.role ?? target.role) !== 'BROKER') throw new ApiError(400, 'VALIDATION_ERROR', 'Broker approval applies only to brokers');
      const approved = body.brokerApproved === true && !target.brokerApproved;
      const updated = await User.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true, session }).select('-passwordHash');
      if (approved) await notify(id, { type: 'BROKER_APPROVED', title: 'Broker approved', body: 'You can now create and submit listings.', link: '/broker' }, session);
      return updated;
    });
  } finally { await session.endSession(); }
}
export async function submitKyc(userId: string, input: z.infer<typeof kycSchema>) {
  const body = kycSchema.parse(input);
  const user = await User.findOneAndUpdate({ _id: userId, role: 'INVESTOR', 'kyc.status': { $in: ['NOT_SUBMITTED', 'REJECTED'] } }, { $set: { 'kyc.status': 'PENDING', 'kyc.docs': body.docs }, $unset: { 'kyc.reason': 1 } }, { new: true, runValidators: true }).select('kyc');
  if (!user) throw new ApiError(409, 'CONFLICT', 'KYC has already been submitted or approved');
  return user.kyc;
}
export async function listKyc(query: Record<string, string>) {
  const { status, page, limit } = kycQuerySchema.parse(query); const filter = { role: 'INVESTOR', 'kyc.status': status }; const { skip } = paginate({ page, limit });
  const [users, total] = await Promise.all([User.find(filter).select('name email kyc').sort({ updatedAt: -1, _id: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  return listResult(users.map(user => ({ userId: String(user._id), name: user.name, email: user.email, kyc: user.kyc })), total, page, limit);
}
export async function reviewKyc(userId: string, input: z.infer<typeof reviewSchema>) {
  objectIdSchema.parse(userId); const body = reviewSchema.parse(input); const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const status = body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const updated = await User.findOneAndUpdate({ _id: userId, role: 'INVESTOR', 'kyc.status': 'PENDING' }, { $set: { 'kyc.status': status, ...(body.reason ? { 'kyc.reason': body.reason } : {}) }, ...(!body.reason ? { $unset: { 'kyc.reason': 1 } } : {}) }, { new: true, runValidators: true, session }).select('name email kyc');
      if (!updated) { if (!await User.exists({ _id: userId, role: 'INVESTOR' }).session(session)) throw new ApiError(404, 'NOT_FOUND', 'Investor not found'); throw new ApiError(409, 'CONFLICT', 'Only pending KYC can be reviewed'); }
      await notify(userId, { type: 'KYC', title: `KYC ${status.toLowerCase()}`, body: body.reason ?? 'Your KYC is approved.', link: '/investor/kyc' }, session);
      return { userId: String(updated._id), name: updated.name, email: updated.email, kyc: updated.kyc };
    });
  } finally { await session.endSession(); }
}
export async function getBrokerProperties(brokerId: string, query: Record<string, string>) {
  const { status, page, limit } = brokerQuerySchema.parse(query); const filter = { brokerId, ...(status ? { status } : {}) }; const { skip } = paginate({ page, limit });
  const [properties, total] = await Promise.all([Property.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit), Property.countDocuments(filter)]);
  const ids = properties.map(property => property._id);
  const [counts, commissions] = await Promise.all([
    Investment.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([{ $match: { propertyId: { $in: ids }, status: 'ACTIVE' } }, { $group: { _id: { propertyId: '$propertyId', investorId: '$investorId' } } }, { $group: { _id: '$_id.propertyId', count: { $sum: 1 } } }]),
    Transaction.aggregate<{ _id: mongoose.Types.ObjectId; amount: number }>([{ $match: { userId: new mongoose.Types.ObjectId(brokerId), type: 'COMMISSION', direction: 'CREDIT', refType: 'Property', refId: { $in: ids } } }, { $group: { _id: '$refId', amount: { $sum: '$amount' } } }]),
  ]);
  return listResult(properties.map(property => serializeProperty(property, { investorCount: counts.find(row => String(row._id) === String(property._id))?.count ?? 0, commissionEarned: commissions.find(row => String(row._id) === String(property._id))?.amount ?? 0 })), total, page, limit);
}
export async function getBrokerStats(brokerId: string) {
  const [properties, commissionEarned] = await Promise.all([Property.find({ brokerId }), sum(Transaction, { userId: new mongoose.Types.ObjectId(brokerId), type: 'COMMISSION', direction: 'CREDIT' })]);
  return { listed: properties.length, live: properties.filter(property => property.status === 'LIVE').length, funded: properties.filter(property => ['FUNDED', 'HOLDING', 'SOLD'].includes(property.status)).length, totalRaised: properties.filter(property => property.status !== 'CANCELLED').reduce((total, property) => total + (property.unitsSold ?? 0) * (property.unitPrice ?? 0), 0), commissionEarned, pendingApprovals: properties.filter(property => property.status === 'PENDING_APPROVAL').length, fundingByProperty: properties.map(property => ({ title: property.title, fundingPct: property.totalUnits ? Math.round(property.unitsSold / property.totalUnits * 10000) / 100 : 0 })) };
}
export async function getFundingTimeline(propertyId: string, brokerId: string) {
  objectIdSchema.parse(propertyId);
  const property = await Property.findOne({ _id: propertyId, brokerId });
  if (!property) throw new ApiError(404, 'NOT_FOUND', 'Property not found');
  const rows = await Investment.aggregate<{ _id: string; units: number }>([{ $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, units: { $sum: '$units' } } }, { $sort: { _id: 1 } }]);
  let unitsSold = 0;
  return rows.map(row => ({ date: row._id, unitsSold: unitsSold += row.units }));
}

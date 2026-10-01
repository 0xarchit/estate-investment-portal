import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import mongoose, { ClientSession, FilterQuery } from 'mongoose';
import { GatewayOrder, Transaction, Withdrawal, User, Investment, Payout } from '@/lib/server/models';
import { ApiError } from '@/lib/server/errors';
import { ledger } from '@/lib/server/services/ledger.service';
import { notify } from '@/lib/server/services/notification.service';
import { objectIdSchema, topupOrderSchema, topupVerifySchema, withdrawalSchema, transactionQuerySchema, TopupVerification, WithdrawalInput } from '@/lib/validators/wallet';
import { listResult, paginate } from '@/lib/server/http';
import { reviewSchema } from '@/lib/validators/admin';

/** The demo adapter represents a successful Razorpay request; it performs no network I/O. */
export async function demoRazorpayRequest(): Promise<true> { return true; }
async function activeInvestor(userId: string, session?: ClientSession) {
  const user = await User.findById(userId).session(session ?? null);
  if (!user || !user.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Account is unavailable');
  if (user.role !== 'INVESTOR') throw new ApiError(403, 'FORBIDDEN', 'An investor account is required');
  return user;
}

export function assertWalletCredit(balance: number, amount: number) {
  if (!Number.isSafeInteger(balance) || balance < 0 || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(balance + amount)) {
    throw new ApiError(409, 'BALANCE_LIMIT', 'This credit exceeds the supported wallet balance');
  }
}
function gatewaySecret() {
  const secret = process.env.MOCK_GATEWAY_SECRET || 'mock-payment-gateway-secret-for-timing-safe-hmac';
  return secret;
}
export function demoSignature(orderId: string, paymentId: string, secret = gatewaySecret()) { return createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex'); }
export function verifyDemoSignature(orderId: string, paymentId: string, signature: string, secret = gatewaySecret()) {
  if (!/^[a-f\d]{64}$/i.test(signature)) return false;
  return timingSafeEqual(Buffer.from(demoSignature(orderId, paymentId, secret), 'hex'), Buffer.from(signature, 'hex'));
}
export async function createTopupOrder(userId: string, amount: number) {
  objectIdSchema.parse(userId); topupOrderSchema.parse({ amount });
  await activeInvestor(userId);
  const orderId = `order_${randomUUID()}`, paymentId = `pay_${randomUUID()}`;
  const signature = demoSignature(orderId, paymentId);
  await demoRazorpayRequest();
  await GatewayOrder.create({ orderId, userId, amount, status: 'CREATED', paymentId });
  return { orderId, amount, mock: true, mockPayment: { paymentId, signature } };
}
export async function verifyTopup(userId: string, input: TopupVerification) {
  objectIdSchema.parse(userId);
  const { orderId, paymentId, signature } = topupVerifySchema.parse(input);
  if (!verifyDemoSignature(orderId, paymentId, signature)) throw new ApiError(400, 'INVALID_SIGNATURE', 'Invalid demo payment signature');
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const investor = await activeInvestor(userId, session);
      const order = await GatewayOrder.findOne({ orderId, userId }).session(session);
      if (!order) throw new ApiError(404, 'NOT_FOUND', 'Demo payment order not found');
      if (order.status !== 'CREATED' || await Transaction.exists({ gatewayPaymentId: paymentId }).session(session)) throw new ApiError(409, 'DUPLICATE_PAYMENT', 'This payment has already been credited');
      if (order.paymentId !== paymentId) throw new ApiError(400, 'INVALID_PAYMENT', 'Payment does not match the demo order');
      if (!topupOrderSchema.safeParse({ amount: order.amount }).success) throw new ApiError(409, 'INVALID_ORDER', 'Stored demo order amount is invalid');
      assertWalletCredit(investor.walletBalance, order.amount);
      const paymentSuccess = await demoRazorpayRequest();
      const claimed = await GatewayOrder.findOneAndUpdate({ orderId, userId, status: 'CREATED' }, { $set: { status: 'PAID', paymentId } }, { new: true, session });
      if (!claimed) throw new ApiError(409, 'DUPLICATE_PAYMENT', 'This payment has already been credited');
      const transaction = await ledger.post({ userId, type: 'TOPUP', direction: 'CREDIT', amount: order.amount, gatewayPaymentId: paymentId, refType: 'Gateway', refId: order._id, note: 'TEST MODE — simulated payment', session });
      return { balance: transaction.balanceAfter, mock: true, paymentSuccess };
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000 &&
      'keyPattern' in error && error.keyPattern && typeof error.keyPattern === 'object' && 'gatewayPaymentId' in error.keyPattern) {
      throw new ApiError(409, 'DUPLICATE_PAYMENT', 'This payment has already been credited');
    }
    throw error;
  } finally { await session.endSession(); }
}
export async function requestWithdrawal(userId: string, input: WithdrawalInput) {
  objectIdSchema.parse(userId); const body = withdrawalSchema.parse(input);
  const investor = await activeInvestor(userId);
  if (body.amount > investor.walletBalance) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance');
  // A request does not reserve/debit funds. Approval rechecks balance atomically through the ledger.
  return Withdrawal.create({ userId, ...body, status: 'PENDING' });
}
export async function processWithdrawal(id: string, adminId: string, input: { action: 'APPROVE' | 'REJECT'; reason?: string }) {
  objectIdSchema.parse(id); objectIdSchema.parse(adminId); const body = reviewSchema.parse(input);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      if (!await User.exists({ _id: adminId, role: 'ADMIN', isActive: true }).session(session)) {
        throw new ApiError(403, 'FORBIDDEN', 'An active admin is required to process a withdrawal');
      }
      const withdrawal = await Withdrawal.findById(id).session(session);
      if (!withdrawal) throw new ApiError(404, 'NOT_FOUND', 'Withdrawal not found');
      if (withdrawal.status !== 'PENDING') throw new ApiError(409, 'CONFLICT', 'Withdrawal has already been processed');
      const status = body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const updated = await Withdrawal.findOneAndUpdate({ _id: id, status: 'PENDING' }, { $set: { status, processedBy: adminId, ...(body.reason ? { reason: body.reason } : {}) } }, { new: true, session });
      if (!updated) throw new ApiError(409, 'CONFLICT', 'Withdrawal has already been processed');
      if (body.action === 'APPROVE') await ledger.post({ userId: String(withdrawal.userId), type: 'WITHDRAWAL', direction: 'DEBIT', amount: withdrawal.amount, refType: 'Withdrawal', refId: withdrawal._id, note: 'TEST MODE — dummy bank withdrawal', session });
      await notify(String(withdrawal.userId), { type: 'WITHDRAWAL', title: `Withdrawal ${status.toLowerCase()}`, body: body.reason ?? 'Demo withdrawal approved', link: '/investor/wallet' }, session);
      return updated.toObject();
    });
  } finally { await session.endSession(); }
}

/** Filter at the database so a property's older activity is not hidden behind unrelated pages. */
export async function listTransactions(userId: string, role: 'ADMIN' | 'BROKER' | 'INVESTOR', query: Record<string, string>) {
  objectIdSchema.parse(userId);
  const { page, limit, type, direction, from, to, propertyId } = transactionQuerySchema.parse(query);
  const filter: FilterQuery<unknown> = role === 'ADMIN' ? {} : { userId };
  if (type) filter.type = type;
  if (direction) filter.direction = direction;
  if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (propertyId) {
    const canonicalId = propertyId.toLowerCase();
    const [payouts, purchases] = await Promise.all([
      Payout.find({ propertyId: canonicalId }).select('_id'),
      Investment.find({ propertyId: canonicalId, ...(role === 'ADMIN' ? {} : { investorId: userId }) }).select('_id'),
    ]);
    filter.$or = [
      { refType: 'Property', refId: canonicalId },
      { refType: 'Payout', refId: { $in: payouts.map(row => String(row._id)) } },
      { refType: 'Investment', refId: { $in: purchases.map(row => String(row._id)) } },
    ];
  }
  const { skip } = paginate({ page, limit });
  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);
  return listResult(items, total, page, limit);
}

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import { GatewayOrder, Transaction, Withdrawal } from '@/lib/server/models';
import { ApiError } from '@/lib/server/errors';
import { ledger } from '@/lib/server/services/ledger.service';
import { notify } from '@/lib/server/services/notification.service';
import { objectIdSchema, topupOrderSchema, topupVerifySchema, withdrawalSchema, TopupVerification, WithdrawalInput } from '@/lib/validators/wallet';
import { reviewSchema } from '@/lib/validators/admin';

/** The demo adapter represents a successful Razorpay request; it performs no network I/O. */
export async function demoRazorpayRequest(): Promise<true> { return true; }
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
      const order = await GatewayOrder.findOne({ orderId, userId }).session(session);
      if (!order) throw new ApiError(404, 'NOT_FOUND', 'Demo payment order not found');
      if (order.status !== 'CREATED' || await Transaction.exists({ gatewayPaymentId: paymentId }).session(session)) throw new ApiError(409, 'DUPLICATE_PAYMENT', 'This payment has already been credited');
      if (order.paymentId && order.paymentId !== paymentId) throw new ApiError(400, 'INVALID_PAYMENT', 'Payment does not match the demo order');
      const paymentSuccess = await demoRazorpayRequest();
      const claimed = await GatewayOrder.findOneAndUpdate({ orderId, userId, status: 'CREATED' }, { $set: { status: 'PAID', paymentId } }, { new: true, session });
      if (!claimed) throw new ApiError(409, 'DUPLICATE_PAYMENT', 'This payment has already been credited');
      const transaction = await ledger.post({ userId, type: 'TOPUP', direction: 'CREDIT', amount: order.amount, gatewayPaymentId: paymentId, refType: 'Gateway', refId: order._id, note: 'TEST MODE — simulated payment', session });
      return { balance: transaction.balanceAfter, mock: true, paymentSuccess };
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000) throw new ApiError(409, 'DUPLICATE_PAYMENT', 'This payment has already been credited');
    throw error;
  } finally { await session.endSession(); }
}
export async function requestWithdrawal(userId: string, input: WithdrawalInput) {
  objectIdSchema.parse(userId); const body = withdrawalSchema.parse(input);
  if (body.amount > await ledger.getBalance(userId)) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance');
  // A request does not reserve/debit funds. Approval rechecks balance atomically through the ledger.
  return Withdrawal.create({ userId, ...body, status: 'PENDING' });
}
export async function processWithdrawal(id: string, adminId: string, input: { action: 'APPROVE' | 'REJECT'; reason?: string }) {
  objectIdSchema.parse(id); objectIdSchema.parse(adminId); const body = reviewSchema.parse(input);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
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

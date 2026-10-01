import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { User, GatewayOrder, Transaction } from '@/lib/server/models';
import { ledger } from '@/lib/server/services/ledger.service';
import { assertWalletCredit, createTopupOrder, demoSignature, verifyTopup } from '@/lib/server/services/wallet.service';

vi.mock('@/lib/server/models', () => ({
  User: { findById: vi.fn() }, GatewayOrder: { create: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn() },
  Transaction: { exists: vi.fn() }, Withdrawal: {},
}));
vi.mock('@/lib/server/services/ledger.service', () => ({ ledger: { post: vi.fn() } }));
vi.mock('@/lib/server/services/notification.service', () => ({ notify: vi.fn() }));
describe('wallet boundary guards', () => {
  const userId = '000000000000000000000001';
  const orderId = 'order_00000000-0000-0000-0000-000000000001';
  const paymentId = 'pay_00000000-0000-0000-0000-000000000002';
  const session = { withTransaction: async (callback: () => unknown) => callback(), endSession: vi.fn() };
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.MOCK_GATEWAY_SECRET = 'test-only-payment-signature-key';
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    vi.mocked(User.findById).mockReturnValue({ session: async () => ({ isActive: true, role: 'INVESTOR', walletBalance: 0 }) } as never);
    vi.mocked(Transaction.exists).mockReturnValue({ session: async () => null } as never);
    vi.mocked(GatewayOrder.findOne).mockReturnValue({ session: async () => ({ status: 'CREATED', paymentId, amount: 10000 }) } as never);
  });
  const payment = () => ({ orderId, paymentId, signature: demoSignature(orderId, paymentId) });
  it('rejects malformed persisted amounts before marking an order paid', async () => {
    vi.mocked(GatewayOrder.findOne).mockReturnValue({ session: async () => ({ status: 'CREATED', paymentId, amount: -10000 }) } as never);
    await expect(verifyTopup(userId, payment())).rejects.toMatchObject({ code: 'INVALID_ORDER' });
    expect(GatewayOrder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(ledger.post).not.toHaveBeenCalled();
  });
  it('requires the exact payment generated for an order', async () => {
    vi.mocked(GatewayOrder.findOne).mockReturnValue({ session: async () => ({ status: 'CREATED', amount: 10000 }) } as never);
    await expect(verifyTopup(userId, payment())).rejects.toMatchObject({ code: 'INVALID_PAYMENT' });
  });
  it('does not create orders for a deactivated account', async () => {
    vi.mocked(User.findById).mockReturnValue({ session: async () => ({ isActive: false, role: 'INVESTOR' }) } as never);
    await expect(createTopupOrder(userId, 10000)).rejects.toMatchObject({ status: 401 });
    expect(GatewayOrder.create).not.toHaveBeenCalled();
  });
  it('retains exact integer wallet balances at the safe-number boundary', () => {
    expect(() => assertWalletCredit(Number.MAX_SAFE_INTEGER - 10000, 10000)).not.toThrow();
    expect(() => assertWalletCredit(Number.MAX_SAFE_INTEGER, 1)).toThrow('supported wallet balance');
    expect(() => assertWalletCredit(0, 0.5)).toThrow();
  });
});

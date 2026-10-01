import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Transaction, Payout, Investment } from '@/lib/server/models';
import { listTransactions } from '@/lib/server/services/wallet.service';
import { transactionQuerySchema } from '@/lib/validators/wallet';

vi.mock('@/lib/server/models', () => ({
  User: {}, GatewayOrder: {}, Withdrawal: {},
  Transaction: { find: vi.fn(), countDocuments: vi.fn() },
  Payout: { find: vi.fn() }, Investment: { find: vi.fn() },
}));
describe('property ledger filters', () => {
  const userId = '000000000000000000000001', propertyId = '000000000000000000000002';
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Transaction.find).mockReturnValue({ sort: () => ({ skip: () => ({ limit: async () => [] }) }) } as never);
    vi.mocked(Transaction.countDocuments).mockResolvedValue(0);
    vi.mocked(Payout.find).mockReturnValue({ select: async () => [{ _id: 'payout-id' }] } as never);
    vi.mocked(Investment.find).mockReturnValue({ select: async () => [{ _id: 'investment-id' }] } as never);
  });
  it('includes property debits, investment refunds and sale payouts without removing ownership', async () => {
    await listTransactions(userId, 'INVESTOR', { propertyId });
    expect(Transaction.find).toHaveBeenCalledWith({ userId, $or: [
      { refType: 'Property', refId: propertyId },
      { refType: 'Payout', refId: { $in: ['payout-id'] } },
      { refType: 'Investment', refId: { $in: ['investment-id'] } },
    ] });
    expect(Investment.find).toHaveBeenCalledWith({ propertyId, investorId: userId });
  });
  it('keeps broker requests scoped to their own ledger', async () => {
    await listTransactions(userId, 'BROKER', { propertyId, type: 'COMMISSION' });
    expect(Transaction.find).toHaveBeenCalledWith(expect.objectContaining({ userId, type: 'COMMISSION' }));
  });
  it('permits admin reporting across users and rejects invalid ranges', async () => {
    await listTransactions(userId, 'ADMIN', {});
    expect(Transaction.find).toHaveBeenCalledWith({});
    expect(transactionQuerySchema.safeParse({ from: '2026-10-02T00:00:00Z', to: '2026-10-01T00:00:00Z' }).success).toBe(false);
    expect(transactionQuerySchema.safeParse({ propertyId: 'invalid' }).success).toBe(false);
  });
});

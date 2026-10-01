import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { getBrokerProperties } from '@/lib/server/services/stats.service';
import { Property, Investment, Transaction, User } from '@/lib/server/models';

vi.mock('@/lib/server/models', () => ({
  Property: { find: vi.fn(), countDocuments: vi.fn() },
  Investment: { aggregate: vi.fn() },
  Transaction: { aggregate: vi.fn() },
  User: { findById: vi.fn() },
  Withdrawal: {}, Settings: {},
}));

describe('broker listing integration contract', () => {
  const brokerId = '000000000000000000000001';
  const propertyId = new mongoose.Types.ObjectId('000000000000000000000002');
  beforeEach(() => {
    vi.clearAllMocks();
    const property = { _id: propertyId, title: 'Funded property', brokerId: new mongoose.Types.ObjectId(brokerId), totalUnits: 100, unitsSold: 100, createdAt: new Date(), updatedAt: new Date(), status: 'FUNDED' };
    vi.mocked(Property.find).mockReturnValue({ sort: () => ({ skip: () => ({ limit: async () => [property] }) }) } as never);
    vi.mocked(Property.countDocuments).mockResolvedValue(1);
    vi.mocked(Investment.aggregate).mockResolvedValue([{ _id: propertyId, count: 3 }]);
    vi.mocked(Transaction.aggregate).mockResolvedValue([{ _id: String(propertyId), amount: 5000 }]);
    vi.mocked(User.findById).mockReturnValue({ select: async () => ({ name: 'Rohit' }) } as never);
  });
  it('returns populated JSON items through the actual asynchronous P1 serializer', async () => {
    const result = await getBrokerProperties(brokerId, {});
    const json = JSON.parse(JSON.stringify(result));
    expect(json.items[0]).toMatchObject({ _id: String(propertyId), title: 'Funded property', fundingPct: 100, commissionEarned: 5000, investorCount: 3, broker: { name: 'Rohit' } });
    expect(User.findById).toHaveBeenCalledTimes(1);
  });
  it('matches commission references using the ledger string format', async () => {
    await getBrokerProperties(brokerId, {});
    expect(Transaction.aggregate).toHaveBeenCalledWith(expect.arrayContaining([{ $match: expect.objectContaining({ refId: { $in: [String(propertyId)] } }) }]));
  });
});

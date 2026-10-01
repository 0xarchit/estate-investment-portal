import { describe, expect, it, vi } from 'vitest';
import { Investment, Property, Transaction } from '@/lib/server/models';
import { ledger } from '@/lib/server/services/ledger.service';
import { getHoldings, getPortfolioSummary } from '@/lib/server/services/portfolio.service';

vi.mock('@/lib/server/models', () => ({ Investment: { find: vi.fn() }, Property: { find: vi.fn() }, Transaction: { find: vi.fn() } }));
vi.mock('@/lib/server/services/ledger.service', () => ({ ledger: { getBalance: vi.fn() } }));
describe('portfolio purchase dates', () => {
  const id = '000000000000000000000001';
  it('does not give new purchases the appreciation earned by older purchases', async () => {
    const now = new Date('2026-01-01');
    const earlier = new Date(now.getTime() - 365.25 * 86400000);
    vi.mocked(Investment.find).mockReturnValue({ sort: async () => [
      { propertyId: id, units: 10, amount: 10000, status: 'ACTIVE', createdAt: earlier },
      { propertyId: id, units: 10, amount: 10000, status: 'ACTIVE', createdAt: now },
    ] } as never);
    vi.mocked(Property.find).mockResolvedValue([{ _id: id, title: 'Two purchases', totalUnits: 100, status: 'LIVE', expectedAppreciationPct: 10, holdingPeriodMonths: 36, fundedAt: earlier }] as never);
    const [holding] = await getHoldings(id, now);
    expect(holding.invested).toBe(20000);
    expect(holding.estimatedValue).toBe(21000);
    expect(holding.ownershipPct).toBe(20);
  });
  it('excludes a fully refunded holding from summary ROI without losing the refund detail', async () => {
    vi.mocked(Investment.find).mockReturnValue({ sort: async () => [{ propertyId: id, units: 10, amount: 10000, status: 'REFUNDED', createdAt: new Date() }] } as never);
    vi.mocked(Property.find).mockResolvedValue([{ _id: id, title: 'Cancelled', totalUnits: 100, status: 'CANCELLED' }] as never);
    vi.mocked(Transaction.find).mockReturnValue({ sort: () => ({ limit: async () => [] }) } as never);
    vi.mocked(ledger.getBalance).mockResolvedValue(10000);
    expect((await getHoldings(id))[0].estimatedValue).toBe(10000);
    expect(await getPortfolioSummary(id)).toMatchObject({ totalInvested: 0, currentValue: 0, roiPct: 0, walletBalance: 10000, allocation: [] });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { previewPayout } from '@/lib/server/services/payout.service';
import { Property, Investment, User, Settings } from '@/lib/server/models';

vi.mock('@/lib/server/models', () => ({
  Property: { findById: vi.fn() }, Investment: { aggregate: vi.fn() },
  User: { find: vi.fn() }, Settings: { findOne: vi.fn() }, Payout: {},
}));
vi.mock('@/lib/server/services/settings.service', () => ({
  getSettings: () => { throw new Error('Preview attempted to initialize settings'); },
}));

describe('payout preview is read-only', () => {
  const id = '000000000000000000000001';
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Property.findById).mockResolvedValue({ totalUnits: 10, status: 'HOLDING' } as never);
    vi.mocked(Investment.aggregate).mockResolvedValue([{ _id: id, units: 10, invested: 10000 }]);
    vi.mocked(User.find).mockReturnValue({ select: async () => [{ _id: id, name: 'Investor' }] } as never);
    vi.mocked(Settings.findOne).mockReturnValue({ lean: async () => null } as never);
  });
  it('uses defaults without creating settings when none exist', async () => {
    const result = await previewPayout(id, 14000);
    expect(result).toMatchObject({ platformFeePct: 2, platformFee: 280, distributable: 13720, sumCheck: true });
  });
  it('uses configured fee values without invoking the initializing helper', async () => {
    vi.mocked(Settings.findOne).mockReturnValue({ lean: async () => ({ platformFeePct: 0 }) } as never);
    expect((await previewPayout(id, 14000)).platformFee).toBe(0);
  });
  it('rejects previews for unfinished funding and inconsistent holdings', async () => {
    vi.mocked(Property.findById).mockResolvedValue({ totalUnits: 10, status: 'LIVE' } as never);
    await expect(previewPayout(id, 14000)).rejects.toMatchObject({ status: 409, code: 'INVALID_TRANSITION' });
    vi.mocked(Property.findById).mockResolvedValue({ totalUnits: 11, status: 'HOLDING' } as never);
    await expect(previewPayout(id, 14000)).rejects.toMatchObject({ status: 409, code: 'INVALID_HOLDINGS' });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as sell } from '@/app/api/v1/properties/[id]/sell/route';
import { POST as topup } from '@/app/api/v1/wallet/topup/order/route';
import { PATCH as settings } from '@/app/api/v1/admin/settings/route';
import { User } from '@/lib/server/models/User';
import { executePayout } from '@/lib/server/services/payout.service';
import { createTopupOrder } from '@/lib/server/services/wallet.service';

vi.mock('@/lib/server/db', () => ({ connectDB: vi.fn() }));
vi.mock('@/lib/server/models/User', () => ({ User: { findById: vi.fn() } }));
vi.mock('@/lib/server/auth/jwt', () => ({ verifyJwt: () => ({ sub: '000000000000000000000001' }) }));
vi.mock('@/lib/server/services/payout.service', () => ({ executePayout: vi.fn() }));
vi.mock('@/lib/server/services/wallet.service', () => ({ createTopupOrder: vi.fn() }));

describe('P2 routes with absent request bodies', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it.each([
    ['sale', sell, 'ADMIN', 'POST'],
    ['topup order', topup, 'INVESTOR', 'POST'],
    ['settings', settings, 'ADMIN', 'PATCH'],
  ] as const)('returns 400 for a bodyless %s request through the real handler', async (_name, handler, role, method) => {
    vi.mocked(User.findById).mockResolvedValue({ _id: '000000000000000000000001', role, isActive: true } as never);
    const response = await handler(new NextRequest('http://localhost/api/v1/test', { method, headers: { authorization: 'Bearer test' } }), { params: { id: '000000000000000000000002' } });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
    expect(executePayout).not.toHaveBeenCalled(); expect(createTopupOrder).not.toHaveBeenCalled();
  });
});

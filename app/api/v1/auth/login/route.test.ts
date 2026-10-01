import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(), compare: vi.fn(), signJwt: vi.fn(),
}));

// Exercise the login handler without a database; integration tests cover the wrapper.
vi.mock('@/lib/server/handler', () => ({
  route: (_options: unknown, handler: unknown) => handler,
}));
vi.mock('@/lib/server/models/User', () => ({ User: { findOne: mocks.findOne } }));
vi.mock('bcryptjs', () => ({ default: { compare: mocks.compare } }));
vi.mock('@/lib/server/auth/jwt', () => ({ signJwt: mocks.signJwt }));
vi.mock('@/lib/server/http', () => ({ ok: (data: unknown) => data }));

import { POST } from './route';
import type { LoginInput } from '@/lib/validators/auth';

const invoke = POST as unknown as (context: { body: LoginInput }) => Promise<{
  token: string; user: { role: string; passwordHash?: string };
}>;

function account(role = 'INVESTOR') {
  return {
    _id: { toString: () => 'account-id' }, role, isActive: true,
    passwordHash: 'private-hash',
    toObject: () => ({ _id: 'account-id', role, passwordHash: 'private-hash' }),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(account()) });
  mocks.compare.mockResolvedValue(true);
  mocks.signJwt.mockReturnValue('signed-token');
});

describe('login role permissions', () => {
  it('rejects a valid password with the wrong role before issuing a token', async () => {
    await expect(invoke({ body: { email: 'user@demo.com', password: 'valid', role: 'ADMIN' } }))
      .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(mocks.compare).toHaveBeenCalled();
    expect(mocks.signJwt).not.toHaveBeenCalled();
  });

  it('does not expose role mismatch before password verification', async () => {
    mocks.compare.mockResolvedValue(false);
    await expect(invoke({ body: { email: 'user@demo.com', password: 'invalid', role: 'ADMIN' } }))
      .rejects.toMatchObject({ status: 401, message: 'Invalid email or password' });
    expect(mocks.signJwt).not.toHaveBeenCalled();
  });

  it.each(['INVESTOR', 'BROKER', 'ADMIN'] as const)('issues a token with persisted %s role', async role => {
    mocks.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(account(role)) });
    const result = await invoke({ body: { email: 'user@demo.com', password: 'valid', role } });
    expect(mocks.signJwt).toHaveBeenCalledWith({ sub: 'account-id', role });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('supports existing clients that omit role', async () => {
    const result = await invoke({ body: { email: 'user@demo.com', password: 'valid' } });
    expect(result.token).toBe('signed-token');
    expect(mocks.signJwt).toHaveBeenCalledWith({ sub: 'account-id', role: 'INVESTOR' });
  });

  it('does not authenticate deactivated accounts', async () => {
    mocks.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ ...account(), isActive: false }) });
    await expect(invoke({ body: { email: 'user@demo.com', password: 'valid' } }))
      .rejects.toMatchObject({ status: 401 });
    expect(mocks.signJwt).not.toHaveBeenCalled();
  });
});

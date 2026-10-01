import { describe, expect, it } from 'vitest';
import { resolveLoginRedirect } from './login-redirect';
import { loginSchema, registerSchema } from '../validators/auth';

describe('safe login destinations', () => {
  it.each(['INVESTOR', 'BROKER', 'ADMIN'] as const)('uses the %s account home by default', role => {
    expect(resolveLoginRedirect(null, role)).toBe(`/${role.toLowerCase()}`);
  });

  it.each([
    'https://evil.example', '//evil.example', '/\\evil.example',
    '/%5cevil.example', '/%2fevil.example', '/%00evil', '/%0aevil',
    '/%ZZ', '/admin', '/admin/users', '/broker/listings',
    '/investor/../admin', '/%61dmin', '/login?next=/investor', '/signup',
  ])('rejects an unsafe or wrong-role destination: %s', next => {
    expect(resolveLoginRedirect(next, 'INVESTOR')).toBe('/investor');
  });

  it('preserves a legitimate deep link with query and fragment', () => {
    expect(resolveLoginRedirect('/investor/wallet?page=2#transactions', 'INVESTOR'))
      .toBe('/investor/wallet?page=2#transactions');
  });

  it('permits public destinations for all account types', () => {
    expect(resolveLoginRedirect('/properties?city=Pune', 'ADMIN')).toBe('/properties?city=Pune');
  });
});

describe('role-aware login validation', () => {
  it('trims email before validating and normalizes case', () => {
    expect(loginSchema.parse({ email: '  INVESTOR@demo.com  ', password: 'pass' }).email)
      .toBe('investor@demo.com');
  });
  it.each(['INVESTOR', 'BROKER', 'ADMIN'])('accepts the %s login choice', role => {
    expect(loginSchema.safeParse({ email: 'user@demo.com', password: 'pass', role }).success).toBe(true);
  });
  it('keeps older callers without a role compatible', () => {
    expect(loginSchema.safeParse({ email: 'user@demo.com', password: 'pass' }).success).toBe(true);
  });
  it('rejects unknown login roles', () => {
    expect(loginSchema.safeParse({ email: 'user@demo.com', password: 'pass', role: 'OWNER' }).success).toBe(false);
  });
  it('continues to prohibit admin self-registration', () => {
    expect(registerSchema.safeParse({ name: 'Admin', email: 'admin@demo.com', phone: '9876543210', password: 'Admin@123', role: 'ADMIN' }).success).toBe(false);
  });
});

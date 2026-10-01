/**
 * P5 owns this file.
 * Auth API functions using the shared api client + unwrap from lib/api/client.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// We import from P3's client — code against the contract, swap stubs later
type ApiClient = { get: (url: string, cfg?: any) => Promise<any>; post: (url: string, data?: any, cfg?: any) => Promise<any> };
type Unwrap = <T>(p: Promise<any>) => Promise<T>;

let _api: ApiClient | undefined;
let _unwrap: Unwrap | undefined;

async function getClient(): Promise<{ api: ApiClient; unwrap: Unwrap }> {
  if (_api && _unwrap) return { api: _api, unwrap: _unwrap };
  try {
    const mod = await import('./client');
    _api = mod.api as ApiClient;
    _unwrap = mod.unwrap as Unwrap;
  } catch {
    // P3 hasn't pushed client.ts yet — use axios directly as fallback
    const axios = (await import('axios')).default;
    _api = axios.create({ baseURL: '/api/v1' });
    _unwrap = async <T>(p: Promise<any>): Promise<T> => {
      const res = await p;
      return res.data?.data ?? res.data;
    };
  }
  return { api: _api!, unwrap: _unwrap! };
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'BROKER' | 'INVESTOR';
  isActive: boolean;
  brokerApproved: boolean;
  walletBalance: number;
  kyc?: {
    status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    docs: Array<{ url: string; name: string }>;
    reason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'INVESTOR' | 'BROKER';
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: AuthUser['role'];
}

export async function registerApi(payload: RegisterPayload): Promise<{ user: AuthUser }> {
  const { api, unwrap } = await getClient();
  return unwrap<{ user: AuthUser }>(api.post('/auth/register', payload));
}

export async function loginApi(payload: LoginPayload): Promise<{ token: string; user: AuthUser }> {
  const { api, unwrap } = await getClient();
  return unwrap<{ token: string; user: AuthUser }>(api.post('/auth/login', payload));
}

export async function meApi(): Promise<{ user: AuthUser }> {
  const { api, unwrap } = await getClient();
  return unwrap<{ user: AuthUser }>(api.get('/auth/me'));
}

export async function logoutApi(): Promise<void> {
  const { api, unwrap } = await getClient();
  return unwrap<void>(api.post('/auth/logout'));
}

export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const { api, unwrap } = await getClient();
  return unwrap<void>(api.post('/auth/change-password', payload));
}

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  const { api, unwrap } = await getClient();
  return unwrap<{ message: string }>(api.post('/auth/forgot-password', { email }));
}

export async function resetPasswordApi(token: string, password: string): Promise<void> {
  const { api, unwrap } = await getClient();
  return unwrap<void>(api.post(`/auth/reset-password/${token}`, { password }));
}

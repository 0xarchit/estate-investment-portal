/**
 * P5 owns this file.
 * Typed broker API functions — all broker endpoints from §7 of 00_TEAM_CONTEXT.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type ApiClient = {
  get: (url: string, cfg?: any) => Promise<any>;
  post: (url: string, data?: any, cfg?: any) => Promise<any>;
  patch: (url: string, data?: any, cfg?: any) => Promise<any>;
};
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
    const axios = (await import('axios')).default;
    _api = axios.create({ baseURL: '/api/v1' });
    _unwrap = async <T>(p: Promise<any>): Promise<T> => {
      const res = await p;
      return res.data?.data ?? res.data;
    };
  }
  return { api: _api!, unwrap: _unwrap! };
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface BrokerStats {
  listed: number;
  live: number;
  funded: number;
  totalRaised: number; // paise
  commissionEarned: number; // paise
  pendingApprovals: number;
  fundingByProperty: Array<{ title: string; fundingPct: number }>;
}

export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'LIVE'
  | 'FUNDED'
  | 'HOLDING'
  | 'SOLD'
  | 'REJECTED'
  | 'CANCELLED';

export interface PropertyImage {
  url: string;
  publicId: string;
  name: string;
}

export interface BrokerProperty {
  _id: string;
  title: string;
  description: string;
  type: 'APARTMENT' | 'VILLA' | 'COMMERCIAL' | 'PLOT' | 'WAREHOUSE';
  address: string;
  city: string;
  state: string;
  pincode: string;
  geo?: { lat: number; lng: number };
  areaSqft: number;
  images: PropertyImage[];
  documents: PropertyImage[];
  valuation: number; // paise
  totalUnits: number;
  unitPrice: number; // paise
  minUnits: number;
  maxUnitsPerInvestor: number;
  unitsSold: number;
  expectedAppreciationPct: number;
  rentalYieldPct: number;
  holdingPeriodMonths: number;
  status: PropertyStatus;
  rejectionReason?: string;
  brokerId: string;
  fundingPct: number;
  remainingUnits: number;
  investorCount: number;
  commissionEarned?: number; // paise
  createdAt: string;
  updatedAt: string;
}

export interface FundingTimelinePoint {
  date: string;
  unitsSold: number;
}

export interface PropertyInvestor {
  investorId: string;
  name: string; // masked initials from API
  units: number;
  amount: number; // paise
  ownershipPct: number;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UploadResult {
  url: string;
  publicId: string;
  name: string;
}

export interface CreatePropertyPayload {
  title: string;
  description: string;
  type: string;
  areaSqft: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  geo?: { lat: number; lng: number };
  valuation: number; // paise
  totalUnits: number;
  minUnits: number;
  maxUnitsPerInvestor: number;
  expectedAppreciationPct: number;
  rentalYieldPct: number;
  holdingPeriodMonths: number;
  images?: PropertyImage[];
  documents?: PropertyImage[];
}

// ── API functions ──────────────────────────────────────────────────────────

export async function getBrokerStats(): Promise<BrokerStats> {
  const { api, unwrap } = await getClient();
  return unwrap<BrokerStats>(api.get('/broker/stats'));
}

export async function getBrokerProperties(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<ListResponse<BrokerProperty>> {
  const { api, unwrap } = await getClient();
  return unwrap<ListResponse<BrokerProperty>>(
    api.get('/broker/properties', { params })
  );
}

export async function createProperty(
  payload: CreatePropertyPayload
): Promise<BrokerProperty> {
  const { api, unwrap } = await getClient();
  return unwrap<BrokerProperty>(api.post('/properties', payload));
}

export async function patchProperty(
  id: string,
  payload: Partial<CreatePropertyPayload>
): Promise<BrokerProperty> {
  const { api, unwrap } = await getClient();
  return unwrap<BrokerProperty>(api.patch(`/properties/${id}`, payload));
}

export async function submitProperty(id: string): Promise<BrokerProperty> {
  const { api, unwrap } = await getClient();
  return unwrap<BrokerProperty>(api.post(`/properties/${id}/submit`));
}

export async function getPropertyById(id: string): Promise<BrokerProperty> {
  const { api, unwrap } = await getClient();
  return unwrap<BrokerProperty>(api.get(`/properties/${id}`));
}

export async function getFundingTimeline(id: string): Promise<FundingTimelinePoint[]> {
  const { api, unwrap } = await getClient();
  return unwrap<FundingTimelinePoint[]>(
    api.get(`/broker/properties/${id}/funding-timeline`)
  );
}

export async function getPropertyInvestors(
  id: string
): Promise<ListResponse<PropertyInvestor>> {
  const { api, unwrap } = await getClient();
  return unwrap<ListResponse<PropertyInvestor>>(
    api.get(`/properties/${id}/investors`)
  );
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const { api, unwrap } = await getClient();
  const form = new FormData();
  form.append('file', file);
  return unwrap<UploadResult>(
    api.post('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
}

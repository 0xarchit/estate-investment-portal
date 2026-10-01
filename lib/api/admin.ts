import { api, unwrap } from '@/lib/api/client';

export type UserRole = 'ADMIN' | 'BROKER' | 'INVESTOR';

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'LIVE'
  | 'FUNDED'
  | 'HOLDING'
  | 'SOLD'
  | 'REJECTED'
  | 'CANCELLED';

export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'COMMERCIAL'
  | 'PLOT'
  | 'WAREHOUSE';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  brokerApproved: boolean;
  walletBalance: number; // in paise
  kyc: {
    status: KycStatus;
    docs: { url: string; name: string }[];
    reason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  url: string;
  publicId?: string;
  name?: string;
}

export interface PropertyDoc {
  url: string;
  publicId?: string;
  name?: string;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  geo?: {
    lat: number;
    lng: number;
  };
  areaSqft: number;
  images: PropertyImage[];
  documents: PropertyDoc[];
  valuation: number; // in paise
  totalUnits: number;
  unitPrice: number; // in paise
  minUnits: number;
  maxUnitsPerInvestor: number;
  unitsSold: number;
  expectedAppreciationPct: number;
  rentalYieldPct: number;
  holdingPeriodMonths: number;
  status: PropertyStatus;
  rejectionReason?: string;
  brokerId: string;
  broker?: {
    _id: string;
    name: string;
    email?: string;
  };
  approvedBy?: string;
  salePrice?: number; // in paise
  soldAt?: string;
  fundedAt?: string;
  liveAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  // Computed extra fields
  fundingPct?: number;
  remainingUnits?: number;
  investorCount?: number;
}

export interface AdminStats {
  kpis: {
    aum: number; // in paise
    totalUsers: number;
    usersByRole: {
      ADMIN: number;
      BROKER: number;
      INVESTOR: number;
    };
    liveProperties: number;
    fundsRaisedThisMonth: number; // in paise
    platformFeesEarned: number; // in paise
  };
  charts: {
    fundsRaisedOverTime: {
      date: string;
      amount: number; // in paise
    }[];
    propertiesByStatus: {
      status: PropertyStatus | string;
      count: number;
    }[];
  };
  queues: {
    pendingProperties: number;
    pendingKyc: number;
    pendingBrokers: number;
    pendingWithdrawals: number;
  };
}

export interface PayoutItem {
  investorId: string;
  name: string;
  units: number;
  ownershipPct: number;
  invested: number; // in paise
  amount: number; // payout in paise
  roiPct: number;
}

export interface PayoutPreview {
  salePrice: number; // in paise
  platformFee: number; // in paise
  platformFeePct: number;
  distributable: number; // in paise
  items: PayoutItem[];
  remainder: number;
  sumCheck: boolean;
}

export interface Payout {
  _id: string;
  propertyId: string;
  salePrice: number; // in paise
  platformFee: number; // in paise
  distributable: number; // in paise
  items: {
    investorId: string;
    units: number;
    amount: number; // in paise
  }[];
  executedBy: string;
  executedAt: string;
}

export interface Withdrawal {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number; // in paise
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
  };
  reason?: string;
  processedBy?: string;
  createdAt: string;
}

export interface AdminKycItem {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  kyc: {
    status: KycStatus;
    docs: { url: string; name: string }[];
    reason?: string;
  };
}

export interface Settings {
  platformFeePct: number;
  brokerCommissionPct: number;
  maxOwnershipPct: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PropertyFilterParams {
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  search?: string;
  minFunding?: number;
  maxFunding?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface UserFilterParams {
  search?: string;
  role?: string;
  isActive?: boolean | string;
  page?: number;
  limit?: number;
}

// -------------------------------------------------------------
// Admin API Functions
// -------------------------------------------------------------

/**
 * Fetch platform stats and approval queues for the admin dashboard.
 */
export async function getAdminStats(): Promise<AdminStats> {
  return unwrap<AdminStats>(api.get('/admin/stats'));
}

/**
 * Fetch properties list with filtering and pagination. Admin token returns all statuses.
 */
export async function getProperties(
  params?: PropertyFilterParams
): Promise<PaginatedResponse<Property>> {
  return unwrap<PaginatedResponse<Property>>(
    api.get('/properties', { params })
  );
}

/**
 * Fetch a single property by its ID.
 */
export async function getProperty(id: string): Promise<Property> {
  return unwrap<Property>(api.get(`/properties/${id}`));
}

/**
 * Approve a broker-submitted property (PENDING_APPROVAL -> LIVE).
 */
export async function approveProperty(id: string): Promise<Property> {
  return unwrap<Property>(api.post(`/properties/${id}/approve`));
}

/**
 * Reject a broker-submitted property with a mandatory reason.
 */
export async function rejectProperty(
  id: string,
  reason: string
): Promise<Property> {
  return unwrap<Property>(api.post(`/properties/${id}/reject`, { reason }));
}

/**
 * Update property lifecycle status (e.g. FUNDED -> HOLDING, LIVE -> CANCELLED).
 */
export async function setPropertyStatus(
  id: string,
  status: 'HOLDING' | 'CANCELLED'
): Promise<Property> {
  return unwrap<Property>(api.post(`/properties/${id}/status`, { status }));
}

/**
 * Preview investor payout calculations without committing (HOLDING state).
 * @param salePrice Sale price in integer paise (₹1 = 100 paise)
 */
export async function previewPayout(
  id: string,
  salePrice: number
): Promise<PayoutPreview> {
  return unwrap<PayoutPreview>(
    api.get(`/properties/${id}/payout-preview`, {
      params: { salePrice },
    })
  );
}

/**
 * Execute sale and payout distribution for a property in HOLDING.
 * @param salePrice Sale price in integer paise (₹1 = 100 paise)
 */
export async function sellProperty(
  id: string,
  salePrice: number
): Promise<{ payout: Payout }> {
  return unwrap<{ payout: Payout }>(
    api.post(`/properties/${id}/sell`, { salePrice })
  );
}

/**
 * List and filter all users (Admin, Broker, Investor).
 */
export async function getAdminUsers(
  params?: UserFilterParams
): Promise<PaginatedResponse<User>> {
  return unwrap<PaginatedResponse<User>>(
    api.get('/admin/users', { params })
  );
}

/**
 * Update user fields: active state, role, or broker approval.
 */
export async function patchUser(
  id: string,
  data: {
    isActive?: boolean;
    role?: UserRole;
    brokerApproved?: boolean;
  }
): Promise<{ user: User }> {
  return unwrap<{ user: User }>(api.patch(`/admin/users/${id}`, data));
}

/**
 * Fetch KYC verification requests (defaults to PENDING).
 */
export async function getAdminKyc(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminKycItem>> {
  return unwrap<PaginatedResponse<AdminKycItem>>(
    api.get('/admin/kyc', {
      params: {
        status: params?.status ?? 'PENDING',
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      },
    })
  );
}

/**
 * Approve or reject a user's KYC documents.
 */
export async function reviewKyc(
  userId: string,
  action: 'APPROVE' | 'REJECT',
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  return unwrap<{ success: boolean; message?: string }>(
    api.patch(`/admin/kyc/${userId}`, { action, reason })
  );
}

/**
 * Fetch withdrawal requests list.
 */
export async function getWithdrawals(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Withdrawal>> {
  return unwrap<PaginatedResponse<Withdrawal>>(
    api.get('/admin/withdrawals', { params })
  );
}

/**
 * Approve or reject a withdrawal request.
 */
export async function reviewWithdrawal(
  id: string,
  action: 'APPROVE' | 'REJECT',
  reason?: string
): Promise<{ withdrawal: Withdrawal }> {
  return unwrap<{ withdrawal: Withdrawal }>(
    api.patch(`/admin/withdrawals/${id}`, { action, reason })
  );
}

/**
 * Fetch platform fee and investment limits configuration.
 */
export async function getSettings(): Promise<Settings> {
  return unwrap<Settings>(api.get('/admin/settings'));
}

/**
 * Update platform configuration settings.
 */
export async function patchSettings(
  data: Partial<Settings>
): Promise<Settings> {
  return unwrap<Settings>(api.patch('/admin/settings', data));
}

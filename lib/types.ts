export type Role = "ADMIN" | "BROKER" | "INVESTOR";
export type PropertyStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "LIVE"
  | "FUNDED"
  | "HOLDING"
  | "SOLD"
  | "REJECTED"
  | "CANCELLED";
export type User = import("./api/auth").AuthUser;
export interface ApiErrorShape {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
}
export interface Media {
  url: string;
  name: string;
  publicId?: string;
}
export interface Property {
  _id: string;
  title: string;
  description: string;
  type: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  geo?: { lat: number; lng: number };
  areaSqft?: number;
  images: Media[];
  documents: Media[];
  valuation: number;
  totalUnits: number;
  unitPrice: number;
  minUnits: number;
  maxUnitsPerInvestor: number;
  unitsSold: number;
  expectedAppreciationPct?: number;
  rentalYieldPct?: number;
  holdingPeriodMonths?: number;
  status: PropertyStatus;
  fundingPct: number;
  remainingUnits: number;
  investorCount: number;
  broker?: { _id: string; name: string };
  brokerId: string;
  createdAt: string;
  updatedAt: string;
  fundedAt?: string;
  liveAt?: string;
  soldAt?: string;
  salePrice?: number;
}
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface Investment {
  _id: string;
  investorId: string;
  propertyId: string;
  units: number;
  amount: number;
  status: "ACTIVE" | "EXITED" | "REFUNDED";
  payoutAmount?: number;
  idempotencyKey?: string;
  createdAt: string;
}
export interface Payout {
  _id: string;
  propertyId: string;
  salePrice: number;
  platformFee: number;
  distributable: number;
  items: { investorId: string; units: number; amount: number }[];
  executedBy: string;
  executedAt: string;
}
export type { Transaction, Withdrawal } from "./api/wallet";
export type { Notification } from "./api/notifications";
export type { Holding, PortfolioSummary } from "./api/portfolio";
export type { InvestResult } from "./api/investments";

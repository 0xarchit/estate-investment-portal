import { api, unwrap } from "./client";
import type { Transaction } from "./wallet";
export interface Holding {
  propertyId: string;
  property: {
    title: string;
    city: string;
    image: string | null;
    status: string;
    unitPrice: number;
    expectedAppreciationPct: number;
  };
  units: number;
  ownershipPct: number;
  invested: number;
  estimatedValue: number;
  payoutReceived: number;
  roiPct: number;
  status: string;
}
export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPayouts: number;
  roiPct: number;
  walletBalance: number;
  allocation: { propertyId: string; title: string; amount: number }[];
  recentTransactions: Transaction[];
}
export const getHoldings = () =>
  unwrap<{ items: Holding[] }>(api.get("/investments/me"));
export const getPortfolioSummary = () =>
  unwrap<PortfolioSummary>(api.get("/portfolio/summary"));

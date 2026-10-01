import { api, unwrap } from "./client";
export interface InvestResult {
  investment: {
    _id: string;
    units: number;
    amount: number;
    ownershipPct: number;
    status: string;
  };
  property: { unitsSold: number; fundingPct: number; status: string };
  walletBalance: number;
  message: string;
}
export const invest = (payload: {
  propertyId: string;
  units: number;
  idempotencyKey: string;
}) => unwrap<InvestResult>(api.post("/investments", payload));
export const createInvestment = invest;
export { getHoldings as getMyInvestments } from "./portfolio";
export function investmentLimits(
  property: {
    remainingUnits: number;
    maxUnitsPerInvestor: number;
    minUnits: number;
  },
  owned: number,
) {
  return {
    min: property.minUnits,
    max: Math.max(
      0,
      Math.min(property.remainingUnits, property.maxUnitsPerInvestor - owned),
    ),
  };
}

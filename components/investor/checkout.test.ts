import { describe, it, expect } from "vitest";
import { checkoutGuard } from "./checkout";
import { investmentLimits } from "@/lib/api/investments";
describe("checkout eligibility", () => {
  const valid = {
    min: 5,
    max: 20,
    units: 5,
    unitPrice: 100000,
    balance: 500000,
    kyc: "APPROVED",
    status: "LIVE",
    terms: true,
  };
  it("caps the purchase to remaining units and ownership capacity", () => {
    expect(
      investmentLimits(
        { remainingUnits: 10, maxUnitsPerInvestor: 49, minUnits: 1 },
        45,
      ).max,
    ).toBe(4);
    expect(
      investmentLimits(
        { remainingUnits: 2, maxUnitsPerInvestor: 49, minUnits: 1 },
        0,
      ).max,
    ).toBe(2);
  });
  it("prevents a purchase where cap is below minimum, including zero capacity", () => {
    expect(checkoutGuard({ ...valid, max: 4 }).eligible).toBe(false);
    expect(checkoutGuard({ ...valid, max: 0, units: 0 }).eligible).toBe(false);
  });
  it("calculates exact paise shortfall and accepts exact balance", () => {
    expect(checkoutGuard({ ...valid, balance: 490001 }).shortfall).toBe(9999);
    expect(checkoutGuard({ ...valid, balance: 490001 }).eligible).toBe(false);
    expect(checkoutGuard(valid).eligible).toBe(true);
  });
  it("rejects fractional units, closed funding, unapproved KYC and unchecked terms", () => {
    for (const changes of [
      { units: 5.5 },
      { status: "FUNDED" },
      { kyc: "PENDING" },
      { terms: false },
    ])
      expect(checkoutGuard({ ...valid, ...changes }).eligible).toBe(false);
  });
});

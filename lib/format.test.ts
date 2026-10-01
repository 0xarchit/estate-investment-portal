import { describe, expect, it } from "vitest";
import { formatINR, formatCompactINR, formatPct, formatDate } from "./format";

describe("Indian money and display formatting", () => {
  it("converts paise and groups a crore in the Indian numbering system", () => {
    expect(formatINR(1000000000)).toBe("₹1,00,00,000");
    expect(formatINR(12345678)).toBe("₹1,23,456.78");
    expect(formatINR(0)).toBe("₹0");
  });
  it("keeps lakh and crore boundaries consistent", () => {
    expect(formatCompactINR(1400000000)).toBe("₹1.4 Cr");
    expect(formatCompactINR(250000000)).toBe("₹25 L");
    expect(formatCompactINR(500000)).toBe("₹5,000");
    expect(formatCompactINR(10000000)).toBe("₹1 L");
  });
  it("renders invalid display values safely", () => {
    expect(formatINR(Number.NaN)).toBe("₹0");
    expect(formatPct(Number.NaN)).toBe("0.0%");
    expect(formatDate("invalid date")).toBe("—");
  });
  it("preserves loss signs and chosen precision", () => {
    expect(formatPct(-4.125, 2)).toBe("-4.13%");
    expect(formatINR(-150050)).toBe("-₹1,500.5");
  });
});

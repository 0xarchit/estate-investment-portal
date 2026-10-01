import { describe, expect, it } from "vitest";
import { ownershipPct, projectedValue } from "./calc";

describe("investment display calculations", () => {
  it("rounds fractional ownership to two decimals", () => {
    expect(ownershipPct(1, 3)).toBe(33.33);
    expect(ownershipPct(0, 100)).toBe(0);
    expect(ownershipPct(5, 0)).toBe(0);
  });
  it("compounds appreciation and rounds only the resulting integer paise", () => {
    expect(projectedValue(10001, 7.5, 2)).toBe(11557);
    expect(projectedValue(250000, 0, 5)).toBe(250000);
    expect(projectedValue(250000, 8, 0)).toBe(250000);
    expect(projectedValue(0, 8, 5)).toBe(0);
  });
  it("supports negative appreciation without making up a gain", () => {
    expect(projectedValue(100000, -10, 2)).toBe(81000);
  });
});

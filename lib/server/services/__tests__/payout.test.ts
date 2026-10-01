import { describe, expect, it } from 'vitest';
import { computePayout } from '../payout.service';
import { demoRazorpayRequest, demoSignature, verifyDemoSignature } from '../wallet.service';
import { estimateValue } from '../portfolio.service';
import { topupOrderSchema, withdrawalSchema } from '@/lib/validators/wallet';
import { reviewSchema, settingsSchema, userUpdateSchema } from '@/lib/validators/admin';

describe('integer payout conservation', () => {
  it('matches the PS sale example including all holders', () => {
    const result = computePayout({ salePrice: 1_400_000_000, platformFeePct: 2, totalUnits: 1000, holders: [{ investorId: 'aman', units: 20 }, { investorId: 'priya', units: 50 }, { investorId: 'karan', units: 400 }, { investorId: 'neha', units: 265 }, { investorId: 'vikram', units: 265 }] });
    expect(result.platformFee).toBe(28_000_000);
    expect(result.distributable).toBe(1_372_000_000);
    expect(result.items.slice(0, 3).map(item => item.amount)).toEqual([27_440_000, 68_600_000, 548_800_000]);
    expect(result.items.reduce((sum, item) => sum + item.amount, 0)).toBe(result.distributable);
  });
  it('assigns odd-paise rounding to the largest holder', () => {
    const result = computePayout({ salePrice: 100_003, platformFeePct: 2, totalUnits: 1000, holders: [{ investorId: 'a', units: 333 }, { investorId: 'b', units: 333 }, { investorId: 'c', units: 334 }] });
    expect(result.items.reduce((sum, item) => sum + item.amount, 0) + result.platformFee).toBe(100_003);
    expect(result.items[2].amount).toBe(Math.floor(result.distributable * 334 / 1000) + result.remainder);
  });
  it('breaks a largest-holder tie by lowest investorId independent of input order', () => {
    const result = computePayout({ salePrice: 101, platformFeePct: 0, totalUnits: 2, holders: [{ investorId: 'z', units: 1 }, { investorId: 'a', units: 1 }] });
    expect(result.items).toEqual([{ investorId: 'z', units: 1, amount: 50 }, { investorId: 'a', units: 1, amount: 51 }]);
  });
  it('supports losses and zero fees', () => {
    const result = computePayout({ salePrice: 700_000_000, platformFeePct: 0, totalUnits: 1000, holders: [{ investorId: 'a', units: 1000 }] });
    expect(result.items[0].amount).toBe(700_000_000);
    expect((result.items[0].amount - 1_000_000_000) / 1_000_000_000).toBe(-0.3);
  });
  it('does not distribute missing ownership as rounding remainder', () => {
    expect(() => computePayout({ salePrice: 1_400_000_000, platformFeePct: 2, totalUnits: 1000, holders: [{ investorId: 'aman', units: 20 }] })).toThrow('exactly equal');
  });
  it('rejects fractional/unsafe money and duplicate holders', () => {
    const input = { salePrice: 100, platformFeePct: 2, totalUnits: 2, holders: [{ investorId: 'a', units: 2 }] };
    expect(() => computePayout({ ...input, salePrice: 0.5 })).toThrow();
    expect(() => computePayout({ ...input, salePrice: Number.MAX_SAFE_INTEGER + 1 })).toThrow();
    expect(() => computePayout({ ...input, holders: [{ investorId: 'a', units: 1 }, { investorId: 'a', units: 1 }] })).toThrow('unique');
  });
  it('conserves funds near the safe-integer limit using BigInt', () => {
    const result = computePayout({ salePrice: Number.MAX_SAFE_INTEGER, platformFeePct: 1.25, totalUnits: 3, holders: [{ investorId: 'a', units: 1 }, { investorId: 'b', units: 2 }] });
    expect(BigInt(result.items[0].amount) + BigInt(result.items[1].amount) + BigInt(result.platformFee)).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });
});
describe('demo payments and validation', () => {
  it('always simulates gateway success', async () => { expect(await demoRazorpayRequest()).toBe(true); });
  it('verifies signed demo responses and rejects changed orders, payments and malformed signatures', () => {
    const signature = demoSignature('order_demo', 'pay_demo', 'local-test-secret');
    expect(verifyDemoSignature('order_demo', 'pay_demo', signature, 'local-test-secret')).toBe(true);
    expect(verifyDemoSignature('order_other', 'pay_demo', signature, 'local-test-secret')).toBe(false);
    expect(verifyDemoSignature('order_demo', 'pay_other', signature, 'local-test-secret')).toBe(false);
    expect(verifyDemoSignature('order_demo', 'pay_demo', 'true', 'local-test-secret')).toBe(false);
  });
  it('enforces demo topup bounds and integer paise', () => {
    expect(topupOrderSchema.safeParse({ amount: 10000 }).success).toBe(true);
    for (const amount of [9999, 100000001, 10000.5]) expect(topupOrderSchema.safeParse({ amount }).success).toBe(false);
  });
  it('requires rejection reasons and rejects administrative mass assignment', () => {
    expect(reviewSchema.safeParse({ action: 'REJECT' }).success).toBe(false);
    expect(userUpdateSchema.safeParse({ walletBalance: 1000000 }).success).toBe(false);
    expect(settingsSchema.safeParse({ platformFeePct: 21 }).success).toBe(false);
    expect(withdrawalSchema.safeParse({ amount: -1, bankDetails: {} }).success).toBe(false);
  });
});
describe('portfolio projection', () => {
  const base = { status: 'ACTIVE', invested: 10000, payoutReceived: 14000, expectedAppreciationPct: 10, firstInvestmentAt: new Date('2020-01-01'), holdingPeriodMonths: 12 };
  it('caps appreciation at the holding period', () => { expect(estimateValue(base, new Date('2026-01-01'))).toBe(11000); });
  it('uses actual exit payout and refunds', () => {
    expect(estimateValue({ ...base, status: 'SOLD' })).toBe(14000);
    expect(estimateValue({ ...base, status: 'REFUNDED' })).toBe(10000);
  });
  it('does not accrue appreciation before funding or produce NaN for empty holdings', () => {
    expect(estimateValue({ ...base, fundedAt: new Date('2027-01-01') }, new Date('2026-01-01'))).toBe(10000);
    expect(estimateValue({ ...base, invested: 0 })).toBe(0);
  });
});

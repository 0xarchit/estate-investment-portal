import { Investment, Property, Transaction } from '@/lib/server/models';
import { ledger } from '@/lib/server/services/ledger.service';
import { objectIdSchema } from '@/lib/validators/wallet';

export type ValuationInput = { status: string; invested: number; payoutReceived: number; expectedAppreciationPct: number; fundedAt?: Date | null; firstInvestmentAt: Date; holdingPeriodMonths?: number | null };
export function estimateValue(input: ValuationInput, now = new Date()) {
  if (input.status === 'SOLD' || input.status === 'EXITED') return input.payoutReceived;
  if (input.status === 'CANCELLED' || input.status === 'REFUNDED') return input.invested;
  // Academic projection: compound annual appreciation from funding (or first purchase),
  // capped at the advertised holding period. It is an estimate, never a wallet mutation.
  const start = input.fundedAt ?? input.firstInvestmentAt;
  const elapsed = Math.max(0, (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const years = Math.min(elapsed, (input.holdingPeriodMonths ?? 0) / 12);
  const value = Math.round(input.invested * Math.pow(Math.max(0, 1 + input.expectedAppreciationPct / 100), years));
  return Number.isSafeInteger(value) ? value : input.invested;
}
export async function getHoldings(userId: string, now = new Date()) {
  objectIdSchema.parse(userId);
  const purchases = await Investment.find({ investorId: userId, status: { $in: ['ACTIVE', 'EXITED', 'REFUNDED'] } }).sort({ createdAt: 1, _id: 1 });
  const groups = new Map<string, { units: number; invested: number; payoutReceived: number; firstInvestmentAt: Date; statuses: Set<string> }>();
  for (const purchase of purchases) {
    const id = String(purchase.propertyId);
    const group = groups.get(id) ?? { units: 0, invested: 0, payoutReceived: 0, firstInvestmentAt: purchase.createdAt, statuses: new Set<string>() };
    group.units += purchase.units; group.invested += purchase.amount; group.payoutReceived += purchase.payoutAmount ?? 0; group.statuses.add(purchase.status);
    groups.set(id, group);
  }
  const properties = await Property.find({ _id: { $in: [...groups.keys()] } });
  return properties.map(property => {
    const group = groups.get(String(property._id))!;
    const status = group.statuses.has('ACTIVE') ? 'ACTIVE' : group.statuses.has('EXITED') ? 'EXITED' : 'REFUNDED';
    const estimatedValue = estimateValue({ ...group, status: property.status === 'SOLD' || property.status === 'CANCELLED' ? property.status : status, expectedAppreciationPct: property.expectedAppreciationPct ?? 0, holdingPeriodMonths: property.holdingPeriodMonths, fundedAt: property.fundedAt }, now);
    return {
      propertyId: String(property._id), property: { title: property.title, city: property.city, image: property.images?.[0]?.url ?? null, status: property.status, unitPrice: property.unitPrice, expectedAppreciationPct: property.expectedAppreciationPct ?? 0 },
      units: group.units, ownershipPct: property.totalUnits ? group.units / property.totalUnits * 100 : 0,
      invested: group.invested, estimatedValue, payoutReceived: group.payoutReceived, roiPct: group.invested ? (estimatedValue / group.invested - 1) * 100 : 0, status,
    };
  });
}
export async function getPortfolioSummary(userId: string) {
  const [holdings, walletBalance, recentTransactions] = await Promise.all([getHoldings(userId), ledger.getBalance(userId), Transaction.find({ userId }).sort({ createdAt: -1, _id: -1 }).limit(5)]);
  // Exclude refunded holdings from both sides of ROI: a full refund has no investment loss.
  const included = holdings.filter(holding => holding.status !== 'REFUNDED');
  const totalInvested = included.reduce((sum, holding) => sum + holding.invested, 0);
  const currentValue = included.reduce((sum, holding) => sum + holding.estimatedValue, 0);
  return {
    totalInvested, currentValue, totalPayouts: holdings.reduce((sum, holding) => sum + holding.payoutReceived, 0), roiPct: totalInvested ? (currentValue / totalInvested - 1) * 100 : 0, walletBalance,
    allocation: included.map(holding => ({ propertyId: holding.propertyId, title: holding.property.title, amount: holding.estimatedValue })), recentTransactions,
  };
}

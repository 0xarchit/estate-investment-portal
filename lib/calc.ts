export const ownershipPct = (units: number, total: number): number =>
  total > 0 && Number.isFinite(units) && Number.isFinite(total)
    ? Math.round((units / total) * 10000) / 100
    : 0;

export const projectedValue = (
  amountPaise: number,
  appreciationPct: number,
  years: number,
): number =>
  Math.round(amountPaise * Math.pow(1 + appreciationPct / 100, years));

import type { Property } from "@/lib/types";
import { formatINR, formatPct } from "@/lib/format";
export function MetricsCard({ property: p }: { property: Property }) {
  const items = [
    ["Property valuation", formatINR(p.valuation)],
    ["Total units", p.totalUnits.toLocaleString("en-IN")],
    ["Price per unit", formatINR(p.unitPrice)],
    [
      "Expected appreciation",
      p.expectedAppreciationPct === undefined
        ? "Not specified"
        : formatPct(p.expectedAppreciationPct),
    ],
    [
      "Holding period",
      p.holdingPeriodMonths
        ? `${p.holdingPeriodMonths} months`
        : "Not specified",
    ],
    [
      "Area",
      p.areaSqft
        ? `${p.areaSqft.toLocaleString("en-IN")} sq ft`
        : "Not specified",
    ],
  ];
  return (
    <dl className="grid grid-cols-2 md:grid-cols-3 gap-y-7 gap-x-4 panel">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground mb-2">{label}</dt>
          <dd className="text-base font-semibold text-navy tabular-nums [overflow-wrap:anywhere]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

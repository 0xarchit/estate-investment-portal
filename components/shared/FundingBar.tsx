import { formatPct } from "@/lib/format";
export function FundingBar({ pct }: { pct: number }) {
  const value = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <div>
      <div className="flex justify-between mb-2 text-xs font-medium">
        <span>Funding progress</span>
        <span className="text-emerald-700">{formatPct(value, 0)} funded</span>
      </div>
      <div
        role="progressbar"
        aria-label="Property funding"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 overflow-hidden rounded bg-emerald-50"
      >
        <div className="h-full bg-emerald-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

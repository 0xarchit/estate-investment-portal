"use client";
import { useState } from "react";
import type { Property } from "@/lib/types";
import { formatINR, formatPct } from "@/lib/format";
import { ownershipPct, projectedValue } from "@/lib/calc";
export function ReturnCalculator({ property: p }: { property: Property }) {
  const [units, setUnits] = useState(p.minUnits);
  const [years, setYears] = useState((p.holdingPeriodMonths ?? 36) / 12);
  const max = Math.max(p.minUnits, p.maxUnitsPerInvestor);
  const amount = units * p.unitPrice;
  const future = projectedValue(amount, p.expectedAppreciationPct ?? 0, years);
  return (
    <section className="panel">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="eyebrow text-emerald-700 mb-2">
            Explore the possibilities
          </p>
          <h2 className="text-xl font-semibold text-navy">
            Your investment, in perspective
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          Illustrative, not guaranteed
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-5 mt-7">
        <label className="text-sm font-medium">
          Investment units
          <input
            className="field mt-2"
            type="number"
            min={p.minUnits}
            max={max}
            step="1"
            value={units}
            onChange={(e) =>
              setUnits(
                Math.max(
                  p.minUnits,
                  Math.min(
                    max,
                    Math.floor(Number(e.target.value) || p.minUnits),
                  ),
                ),
              )
            }
          />
        </label>
        <div>
          <label htmlFor="calc-years" className="text-sm font-medium">
            Holding period: {years} years
          </label>
          <input
            id="calc-years"
            className="w-full accent-emerald-700 mt-6"
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
          />
        </div>
      </div>
      <dl className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-5 bg-navy-50 p-5 rounded-lg mt-6">
        <div>
          <dt className="text-xs text-muted-foreground">Investment amount</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere] tabular-nums font-semibold mt-1 text-lg">
            {formatINR(amount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ownership share</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere] tabular-nums font-semibold mt-1 text-lg">
            {formatPct(ownershipPct(units, p.totalUnits), 2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Projected value</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere] tabular-nums font-semibold mt-1 text-xl text-emerald-700">
            {formatINR(future)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Projected gain</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere] tabular-nums font-semibold mt-1 text-lg text-emerald-700">
            {formatINR(future - amount)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground mt-4 leading-5">
        Based on {formatPct(p.expectedAppreciationPct ?? 0)} annual
        appreciation. Estimates exclude fees and taxes. Actual returns can
        differ and capital is at risk.
      </p>
    </section>
  );
}

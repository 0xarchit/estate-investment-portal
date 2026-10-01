import React from "react";

export function Progress({
  value = 0,
  max = 100,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.max(
    0,
    Math.min(safeMax, Number.isFinite(value) ? value : 0),
  );
  return (
    <div
      role="progressbar"
      aria-label="Progress"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      className={`h-2 overflow-hidden rounded bg-muted ${className}`}
      {...props}
    >
      <div
        className="h-full bg-emerald-700 motion-safe:transition-all"
        style={{ width: `${(safeValue / safeMax) * 100}%` }}
      />
    </div>
  );
}

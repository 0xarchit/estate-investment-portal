import { formatINR, formatCompactINR } from "@/lib/format";
export function Money({
  paise,
  compact = false,
  signed = false,
}: {
  paise: number;
  compact?: boolean;
  signed?: boolean;
}) {
  return (
    <span
      className={`tabular-nums ${signed ? (paise < 0 ? "text-red-700" : "text-emerald-700") : ""}`}
    >
      {signed && paise > 0 ? "+" : ""}
      {compact ? formatCompactINR(paise) : formatINR(paise)}
    </span>
  );
}

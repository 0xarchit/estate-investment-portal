export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((Number.isFinite(paise) ? paise : 0) / 100);
}
export function formatCompactINR(paise: number): string {
  const rupees = (Number.isFinite(paise) ? paise : 0) / 100;
  const n = Math.abs(rupees);
  const trim = (v: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(v);
  return n >= 1e7
    ? `₹${trim(rupees / 1e7)} Cr`
    : n >= 1e5
      ? `₹${trim(rupees / 1e5)} L`
      : formatINR(paise);
}
export function formatPct(n: number, dp = 1): string {
  return `${(Number.isFinite(n) ? n : 0).toFixed(dp)}%`;
}
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

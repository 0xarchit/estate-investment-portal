import type { LucideIcon } from "lucide-react";
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: string;
  loading?: boolean;
}) {
  return (
    <section className="panel stat-card min-w-0" aria-busy={loading}>
      <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs font-medium">
        <span>{label}</span>
        {Icon && <Icon size={16} />}
      </div>
      {loading ? (
        <div className="skeleton h-9 mt-3" />
      ) : (
        <p
          className={`mt-3 text-xl md:text-2xl min-w-0 [overflow-wrap:anywhere] tabular-nums font-semibold tracking-tight ${tone === "success" ? "text-emerald-700" : tone === "danger" ? "text-red-700" : "text-navy"}`}
        >
          {value}
        </p>
      )}
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </section>
  );
}

"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatINR, formatPct } from "@/lib/format";
const colors = [
  "#0F2A4A",
  "#047857",
  "#D4A017",
  "#3B6EA5",
  "#6FCFA8",
  "#6B7280",
];
export function DonutChart({
  data,
  centerLabel,
}: {
  data: { name: string; value: number }[];
  centerLabel?: string;
}) {
  const all = data
    .filter((d) => Number.isFinite(d.value) && d.value > 0)
    .sort((a, b) => b.value - a.value);
  const positive =
    all.length > 6
      ? [
          ...all.slice(0, 5),
          {
            name: "Other",
            value: all.slice(5).reduce((sum, item) => sum + item.value, 0),
          },
        ]
      : all;
  const total = positive.reduce((s, d) => s + d.value, 0);
  if (!total)
    return (
      <p className="text-muted-foreground py-16 text-center">No data yet</p>
    );
  return (
    <div>
      <div
        className="relative h-56"
        role="img"
        aria-label={positive
          .map((d) => `${d.name}: ${formatINR(d.value)}`)
          .join(", ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={positive}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={96}
              paddingAngle={3}
            >
              {positive.map((d, i) => (
                <Cell key={d.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatINR(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground">
            {centerLabel ?? "Total invested"}
          </span>
          <strong className="mt-1 text-lg">{formatINR(total)}</strong>
        </div>
      </div>
      <ul className="space-y-3 text-xs">
        {positive.map((d, i) => (
          <li key={d.name} className="flex justify-between gap-4">
            <span className="flex gap-2 items-center">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: colors[i % colors.length] }}
              />
              {d.name}
            </span>
            <span className="shrink-0">
              {formatINR(d.value)} · {formatPct((d.value / total) * 100)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

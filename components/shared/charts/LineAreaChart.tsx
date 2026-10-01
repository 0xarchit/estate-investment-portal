"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatINR } from "@/lib/format";
export function LineAreaChart({
  data,
  xKey,
  yKey,
  format = formatINR,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  format?: (n: number) => string;
}) {
  if (!data.length)
    return (
      <p className="py-12 text-center text-muted-foreground">No data yet</p>
    );
  return (
    <div
      role="img"
      aria-label={data
        .map((d) => `${d[xKey]}: ${format(Number(d[yKey]))}`)
        .join(", ")}
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={xKey} />
          <YAxis tickFormatter={format} width={90} />
          <Tooltip formatter={(n: number) => format(n)} />
          <Area dataKey={yKey} stroke="#047857" fill="#D1FAE5" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

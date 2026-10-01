"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/format";

export function BarChartH({
  data,
  format = formatINR,
}: {
  data: { label: string; value: number }[];
  format?: (n: number) => string;
}) {
  const summaryId = useId();
  const values = data.filter((item) => Number.isFinite(item.value));
  if (!values.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">No data yet</p>
    );
  }

  return (
    <figure aria-describedby={summaryId} className="min-w-0">
      <div
        className="w-full"
        style={{ height: Math.max(220, values.length * 48 + 56) }}
        role="img"
        aria-label={values
          .map((item) => `${item.label}: ${format(item.value)}`)
          .join(", ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={values}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 16, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} stroke="#E5E7EB" />
            <XAxis
              type="number"
              tickFormatter={format}
              tick={{ fontSize: 10, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
              tickCount={3}
            />
            <YAxis
              dataKey="label"
              type="category"
              width={96}
              tick={{ fontSize: 11, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(label: string) =>
                label.length > 15 ? `${label.slice(0, 14)}…` : label
              }
            />
            <Tooltip
              formatter={(value: number) => [format(value), "Value"]}
              cursor={{ fill: "#F0F5FA" }}
            />
            <Bar
              dataKey="value"
              fill="#0F2A4A"
              barSize={18}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption id={summaryId} className="sr-only">
        <table>
          <caption>Chart values</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {values.map((item, index) => (
              <tr key={`${item.label}-${index}`}>
                <th scope="row">{item.label}</th>
                <td>{format(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getHoldings, type Holding } from "@/lib/api/portfolio";
import { formatINR, formatPct } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { errorMessage } from "@/components/investor/common";
const columns: Column<Holding>[] = [
  {
    key: "title",
    header: "Property",
    sortable: true,
    render: (h) => (
      <>
        <Link
          className="font-semibold hover:underline"
          href={`/investor/portfolio/${h.propertyId}`}
        >
          {h.property.title}
        </Link>
        <p className="mt-1 text-xs text-slate-500">{h.property.city}</p>
      </>
    ),
  },
  { key: "units", header: "Units", sortable: true, align: "right" },
  {
    key: "ownershipPct",
    header: "Ownership",
    sortable: true,
    align: "right",
    render: (h) => formatPct(h.ownershipPct, 2),
  },
  {
    key: "invested",
    header: "Invested",
    sortable: true,
    align: "right",
    render: (h) => formatINR(h.invested),
  },
  {
    key: "estimatedValue",
    header: "Est. value",
    sortable: true,
    align: "right",
    render: (h) => formatINR(h.estimatedValue),
  },
  {
    key: "status",
    header: "Status",
    render: (h) => <StatusChip status={h.property.status} />,
  },
  {
    key: "payoutReceived",
    header: "Payout",
    sortable: true,
    align: "right",
    render: (h) => formatINR(h.payoutReceived),
  },
  {
    key: "roiPct",
    header: "ROI",
    sortable: true,
    align: "right",
    render: (h) => (
      <span
        className={
          h.roiPct > 0
            ? "text-emerald-700"
            : h.roiPct < 0
              ? "text-red-600"
              : "text-slate-600"
        }
      >
        {h.roiPct > 0 ? "+" : ""}
        {formatPct(h.roiPct)}
      </span>
    ),
  },
];
function sortValue(holding: Holding, key: string): number | string {
  return key === "title"
    ? holding.property.title
    : Number(holding[key as keyof Holding]);
}
export default function Portfolio() {
  const router = useRouter();
  const holdings = useQuery({
    queryKey: ["portfolio", "holdings"],
    queryFn: getHoldings,
  });
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "estimatedValue",
    direction: "desc",
  });
  if (holdings.isPending) return <PageSkeleton />;
  if (holdings.isError)
    return (
      <ErrorState
        message={errorMessage(holdings.error)}
        onRetry={() => holdings.refetch()}
      />
    );
  const all = holdings.data.items;
  const invested = all
    .filter((h) => h.status !== "REFUNDED")
    .reduce((sum, h) => sum + h.invested, 0);
  const value = all
    .filter((h) => h.status !== "REFUNDED")
    .reduce((sum, h) => sum + h.estimatedValue, 0);
  const rows = all
    .filter((h) => status === "ALL" || h.property.status === status)
    .sort((a, b) => {
      const first = sortValue(a, sort.key);
      const second = sortValue(b, sort.key);
      const comparison =
        typeof first === "string"
          ? first.localeCompare(String(second))
          : first - Number(second);
      return sort.direction === "asc" ? comparison : -comparison;
    });
  const totalPages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, totalPages);
  const roi = invested ? (value / invested - 1) * 100 : 0;
  return (
    <div className="page-stack">
      <PageHeader
        title="Your portfolio"
        subtitle="Every fraction. One clear picture."
        actions={
          <Link className="btn" href="/properties">
            Find an investment ↗
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total invested" value={formatINR(invested)} />
        <StatCard label="Estimated value" value={formatINR(value)} />
        <StatCard
          label="Overall ROI"
          value={`${roi > 0 ? "+" : ""}${formatPct(roi)}`}
          tone={roi > 0 ? "success" : roi < 0 ? "danger" : undefined}
          hint={
            roi > 0
              ? "Portfolio gain"
              : roi < 0
                ? "Portfolio loss"
                : "No change in value"
          }
        />
        <StatCard
          label="Payouts received"
          value={formatINR(all.reduce((sum, h) => sum + h.payoutReceived, 0))}
        />
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Filter holdings">
        {["ALL", "LIVE", "FUNDED", "HOLDING", "SOLD"].map((item) => (
          <button
            key={item}
            className={status === item ? "btn" : "btn-secondary"}
            aria-pressed={status === item}
            onClick={() => {
              setStatus(item);
              setPage(1);
            }}
          >
            {item === "ALL"
              ? "All holdings"
              : item.charAt(0) + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {!rows.length ? (
        <EmptyState
          title={all.length ? "No holdings in this stage" : "No holdings yet"}
          description="Your property investments will live here."
          action={
            <Link className="btn" href="/properties">
              Explore properties
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows.slice((currentPage - 1) * 10, currentPage * 10)}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            setPage(1);
          }}
          onRowClick={(row) =>
            router.push(`/investor/portfolio/${row.propertyId}`)
          }
        />
      )}
    </div>
  );
}

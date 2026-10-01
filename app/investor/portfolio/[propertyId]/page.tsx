"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getHoldings } from "@/lib/api/portfolio";
import { getProperty } from "@/lib/api/properties";
import { getTransactions } from "@/lib/api/wallet";
import { formatINR, formatPct, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusChip } from "@/components/shared/StatusChip";
import { StatCard } from "@/components/shared/StatCard";
import { TransactionList, errorMessage } from "@/components/investor/common";
export default function HoldingDetail() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const holdings = useQuery({
    queryKey: ["portfolio", "holdings"],
    queryFn: getHoldings,
  });
  const property = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => getProperty(propertyId),
  });
  const transactions = useInfiniteQuery({
    queryKey: ["transactions", "holding", propertyId],
    queryFn: ({ pageParam }) =>
      getTransactions({ page: pageParam, limit: 100 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
  });
  if (holdings.isPending) return <PageSkeleton />;
  if (holdings.isError)
    return (
      <ErrorState
        message={errorMessage(holdings.error)}
        onRetry={() => holdings.refetch()}
      />
    );
  const h = holdings.data.items.find((item) => item.propertyId === propertyId);
  if (!h)
    return (
      <EmptyState
        title="Holding not found"
        description="This property is not part of your portfolio."
        action={
          <Link className="btn" href="/investor/portfolio">
            Back to portfolio
          </Link>
        }
      />
    );
  const steps = ["LIVE", "FUNDED", "HOLDING", "SOLD"];
  const current = steps.indexOf(h.property.status);
  const dates = [
    property.data?.liveAt,
    property.data?.fundedAt,
    undefined,
    property.data?.soldAt,
  ];
  const ledger =
    transactions.data?.pages
      .flatMap((page) => page.items)
      .filter((tx) => tx.refType === "Property" && tx.refId === propertyId) ??
    [];
  return (
    <div className="page-stack">
      <Link
        href="/investor/portfolio"
        className="text-sm font-semibold text-emerald-800"
      >
        ← Portfolio
      </Link>
      <PageHeader
        title={h.property.title}
        subtitle={`${h.property.city} · ${h.units} units owned`}
        actions={
          <Link href={`/properties/${propertyId}`} className="btn-secondary">
            View property ↗
          </Link>
        }
      />
      <StatusChip status={h.property.status} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Your investment" value={formatINR(h.invested)} />
        <StatCard label="Estimated value" value={formatINR(h.estimatedValue)} />
        <StatCard label="Ownership" value={formatPct(h.ownershipPct, 2)} />
        <StatCard
          label="Return on investment"
          value={`${h.roiPct > 0 ? "+" : ""}${formatPct(h.roiPct)}`}
          tone={h.roiPct > 0 ? "success" : h.roiPct < 0 ? "danger" : undefined}
          hint={
            h.roiPct > 0
              ? "Investment gain"
              : h.roiPct < 0
                ? "Investment loss"
                : "No change in value"
          }
        />
      </div>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Your property's journey</h2>
        {current < 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            This property is {h.property.status.toLowerCase()}. Your holding
            status is {h.status.toLowerCase()}.
          </p>
        ) : (
          <ol className="mt-6 grid gap-5 md:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step}
                aria-current={index === current ? "step" : undefined}
                className={`border-l-2 pl-4 ${index <= current ? "border-emerald-700" : "border-slate-200"}`}
              >
                <p
                  className={`font-semibold ${index <= current ? "text-emerald-800" : "text-slate-500"}`}
                >
                  {index < current ? "✓ " : ""}
                  {step.charAt(0) + step.slice(1).toLowerCase()}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {index === current
                    ? "Current stage"
                    : index < current
                      ? "Complete"
                      : "Upcoming"}
                  {dates[index] ? ` · ${formatDate(dates[index]!)}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
      {h.property.status === "SOLD" && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-950">
            Your exit payout
          </h2>
          <p className="mt-3 text-3xl font-semibold text-emerald-800">
            {formatINR(h.payoutReceived)}
          </p>
          <p className="mt-2 text-sm text-emerald-900">
            Credited to your wallet after the property sale
            {property.data?.soldAt
              ? ` on ${formatDate(property.data.soldAt)}`
              : ""}
            . Final payout includes applicable platform fees.
          </p>
          <Link
            className="mt-4 inline-block font-semibold underline"
            href="/investor/wallet"
          >
            View wallet activity
          </Link>
        </section>
      )}
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Investment & refund activity</h2>
        <p className="mt-1 text-sm text-slate-500">
          Transactions referencing this property. Exit payouts are summarized
          above.
        </p>
        {transactions.isPending ? (
          <PageSkeleton />
        ) : transactions.isError ? (
          <ErrorState
            message={errorMessage(transactions.error)}
            onRetry={() => transactions.refetch()}
          />
        ) : ledger.length ? (
          <TransactionList items={ledger} />
        ) : (
          <EmptyState title="No matching activity in loaded transactions" />
        )}
        {transactions.hasNextPage && (
          <button
            className="btn-secondary mt-4"
            disabled={transactions.isFetchingNextPage}
            onClick={() => transactions.fetchNextPage()}
          >
            {transactions.isFetchingNextPage
              ? "Loading…"
              : "Search older transactions"}
          </button>
        )}
      </section>
    </div>
  );
}

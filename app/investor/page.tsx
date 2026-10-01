"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPortfolioSummary } from "@/lib/api/portfolio";
import { getProperties } from "@/lib/api/properties";
import { formatINR, formatPct } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { DonutChart } from "@/components/shared/charts/DonutChart";
import { PropertyCard } from "@/components/property/PropertyCard";
import {
  KycBanner,
  TransactionList,
  errorMessage,
} from "@/components/investor/common";
export default function InvestorDashboard() {
  const { user } = useAuth();
  const summary = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolioSummary,
  });
  const recommended = useQuery({
    queryKey: ["properties", { status: "LIVE", limit: 3 }],
    queryFn: () => getProperties({ status: "LIVE", limit: 3 }),
  });
  if (summary.isPending) return <PageSkeleton />;
  if (summary.isError)
    return (
      <ErrorState
        message={errorMessage(summary.error)}
        onRetry={() => summary.refetch()}
      />
    );
  const data = summary.data;
  return (
    <div className="page-stack">
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? "investor"}`}
        subtitle="A clear view of your real estate journey."
        actions={
          <Link href="/properties" className="btn">
            Explore properties ↗
          </Link>
        }
      />
      <KycBanner />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard
          label="Total invested"
          value={formatINR(data.totalInvested)}
          hint="Your invested capital"
        />
        <StatCard
          label="Current value"
          value={formatINR(data.currentValue)}
          hint="Estimated portfolio value"
        />
        <StatCard
          label="Total payouts"
          value={formatINR(data.totalPayouts)}
          hint="Credited from property exits"
        />
        <StatCard
          label="Overall ROI"
          value={`${data.roiPct > 0 ? "+" : ""}${formatPct(data.roiPct)}`}
          tone={
            data.roiPct > 0 ? "success" : data.roiPct < 0 ? "danger" : undefined
          }
          hint={
            data.roiPct > 0
              ? "Portfolio gain"
              : data.roiPct < 0
                ? "Portfolio loss"
                : "No change in value"
          }
        />
        <div className="col-span-2 xl:col-span-1">
          <StatCard
            label="Wallet balance"
            value={formatINR(data.walletBalance)}
            hint={
              <Link href="/investor/wallet" className="underline">
                Manage funds
              </Link>
            }
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="panel p-6 lg:col-span-5">
          <h2 className="text-lg font-semibold">Your allocation</h2>
          <p className="mt-1 text-sm text-slate-500">
            Estimated value across properties
          </p>
          {data.allocation.length ? (
            <DonutChart
              data={data.allocation.map((item) => ({
                name: item.title,
                value: item.amount,
              }))}
              centerLabel="Current value"
            />
          ) : (
            <EmptyState
              title="Your portfolio starts here"
              description="Start with a fraction. Build towards something bigger."
              action={
                <Link href="/properties" className="btn">
                  Browse properties
                </Link>
              }
            />
          )}
        </section>
        <section className="panel p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <Link
              className="text-sm font-medium text-emerald-800"
              href="/investor/wallet"
            >
              View all →
            </Link>
          </div>
          {data.recentTransactions.length ? (
            <TransactionList items={data.recentTransactions} />
          ) : (
            <EmptyState
              title="No activity yet"
              description="Your investments, deposits and payouts will appear here."
            />
          )}
        </section>
      </div>
      {data.totalInvested === 0 && (
        <section className="panel p-6">
          <h2 className="font-semibold">Your first investment, step by step</h2>
          <ol className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
            <li>✓ Create your account</li>
            <li>
              <Link className="underline" href="/investor/kyc">
                {user?.kyc?.status === "APPROVED" ? "✓" : "02"} Verify your
                identity
              </Link>
            </li>
            <li>
              <Link className="underline" href="/investor/wallet">
                {data.walletBalance > 0 ? "✓" : "03"} Add demo funds
              </Link>
            </li>
            <li>
              <Link className="underline" href="/properties">
                04 Find your property
              </Link>
            </li>
          </ol>
        </section>
      )}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Discover your next investment
          </h2>
          <Link
            className="text-sm font-medium text-emerald-800"
            href="/properties"
          >
            Marketplace →
          </Link>
        </div>
        {recommended.isError ? (
          <ErrorState
            message={errorMessage(recommended.error)}
            onRetry={() => recommended.refetch()}
          />
        ) : recommended.isPending ? (
          <PageSkeleton />
        ) : recommended.data.items.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recommended.data.items.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="New opportunities are on their way"
            description="Check the marketplace again soon."
          />
        )}
      </section>
    </div>
  );
}

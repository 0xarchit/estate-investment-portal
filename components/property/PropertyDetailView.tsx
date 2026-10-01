"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  Users,
  Clock3,
} from "lucide-react";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { MetricsCard } from "@/components/property/MetricsCard";
import { ReturnCalculator } from "@/components/property/ReturnCalculator";
import { MapEmbed } from "@/components/property/MapEmbed";
import { DocumentsList } from "@/components/property/DocumentsList";
import {
  StatusChip,
  FundingBar,
  PageSkeleton,
  ErrorState,
  EmptyState,
} from "@/components/shared";
import { getProperty } from "@/lib/api/properties";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatINR, formatPct } from "@/lib/format";
export function PropertyDetailView({ backHref }: { backHref: string }) {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: ["property", id],
    queryFn: () => getProperty(id),
  });
  const p = query.data;
  const error = query.error as { status?: number } | null;
  let cta = "Invest in this property";
  let href = `/investor/invest/${id}`;
  let blocked = false;
  let reason = "";
  if (authLoading) {
    cta = "Checking account…";
    blocked = true;
  } else if (p && (p.status !== "LIVE" || p.remainingUnits === 0)) {
    cta =
      p.status === "FUNDED" || p.remainingUnits === 0
        ? "Fully funded"
        : "Funding closed";
    reason = "This property is no longer accepting investments.";
    blocked = true;
  } else if (!user) {
    cta = "Log in to invest";
    href = `/login?next=${encodeURIComponent(href)}`;
  } else if (user.role !== "INVESTOR") {
    cta = "Only investors can invest";
    reason = "Investment is available to investor accounts.";
    blocked = true;
  } else if (user.kyc?.status !== "APPROVED") {
    cta = "Complete KYC to invest";
    href = "/investor/kyc";
  }
  const action = blocked ? (
    <button disabled className="btn w-full" title={reason}>
      {cta}
    </button>
  ) : (
    <Link href={href} className="btn w-full">
      {cta}
      <ArrowUpRight size={18} />
    </Link>
  );
  return (
    <div className="py-8 md:py-10 pb-24 lg:pb-10">
      <Link
        href={backHref}
        className="text-xs text-muted-foreground inline-flex gap-2 items-center mb-8"
      >
        <ArrowLeft size={14} /> Back to marketplace
      </Link>
        {query.isLoading ? (
          <PageSkeleton />
        ) : query.isError ? (
          <>
            {error?.status === 404 || error?.status === 403 ? (
              <EmptyState
                title={
                  error.status === 404
                    ? "Property not found"
                    : "This property is not available"
                }
                description="This listing may have been removed or is not publicly available."
                action={
                  <Link href={backHref} className="btn">
                    Browse properties
                  </Link>
                }
              />
            ) : (
              <ErrorState
                message="We couldn’t load this property. Please try again."
                onRetry={() => query.refetch()}
              />
            )}
          </>
        ) : p ? (
          <>
            <div className="flex flex-wrap gap-4 items-start justify-between mb-7">
              <div>
                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <StatusChip status={p.status} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {p.type.toLowerCase()}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy">
                  {p.title}
                </h1>
                <p className="text-sm text-muted-foreground flex gap-2 mt-3 items-center">
                  <MapPin size={16} />
                  {[p.city, p.state].filter(Boolean).join(", ")}
                </p>
              </div>
              {p.broker && (
                <p className="text-xs text-muted-foreground mt-2">
                  Listed by{" "}
                  <span className="text-navy font-medium">{p.broker.name}</span>
                </p>
              )}
            </div>
            <PropertyGallery images={p.images} title={p.title} />
            <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-9">
              <div className="min-w-0">
                <nav
                  aria-label="Property sections"
                  className="flex gap-6 border-b pb-4 mb-7 text-sm overflow-x-auto"
                >
                  {[
                    ["overview", "Overview"],
                    ["documents", "Documents"],
                    ["location", "Location"],
                    ["calculator", "Calculator"],
                  ].map(([anchor, label]) => (
                    <a
                      key={anchor}
                      href={`#${anchor}`}
                      className="text-navy whitespace-nowrap"
                    >
                      {label}
                    </a>
                  ))}
                </nav>
                <section id="overview" className="scroll-mt-24">
                  <h2 className="text-xl font-semibold text-navy mb-5">
                    The property at a glance
                  </h2>
                  <MetricsCard property={p} />
                  <h2 className="text-xl font-semibold text-navy mt-9 mb-4">
                    A little more about this place
                  </h2>
                  <p className="text-sm text-muted-foreground leading-7 whitespace-pre-line">
                    {p.description}
                  </p>
                </section>
                <section id="documents" className="scroll-mt-24 mt-10">
                  <h2 className="text-xl font-semibold text-navy mb-5">
                    Property documents
                  </h2>
                  <DocumentsList documents={p.documents} />
                </section>
                <section id="location" className="scroll-mt-24 mt-10">
                  <h2 className="text-xl font-semibold text-navy mb-5">
                    The neighbourhood
                  </h2>
                  <MapEmbed
                    geo={p.geo}
                    address={[p.address, p.city, p.state, p.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  />
                </section>
                <section id="calculator" className="scroll-mt-24 mt-10">
                  <ReturnCalculator property={p} />
                </section>
              </div>
              <aside>
                <div className="panel sticky top-24">
                  <p className="eyebrow text-muted-foreground mb-2">
                    Your share starts here
                  </p>
                  <p className="text-3xl font-semibold tracking-tight text-navy">
                    {formatINR(p.unitPrice)}{" "}
                    <span className="text-sm text-muted-foreground font-normal">
                      / unit
                    </span>
                  </p>
                  <div className="flex justify-between py-5 my-3 border-y text-sm">
                    <span className="text-muted-foreground">
                      Est. annual appreciation
                    </span>
                    <strong className="text-emerald-700">
                      {p.expectedAppreciationPct === undefined
                        ? "Not specified"
                        : formatPct(p.expectedAppreciationPct)}
                    </strong>
                  </div>
                  <FundingBar pct={p.fundingPct} />
                  <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                    <span>
                      {p.unitsSold.toLocaleString("en-IN")} /{" "}
                      {p.totalUnits.toLocaleString("en-IN")} units sold
                    </span>
                    <span>{p.remainingUnits.toLocaleString("en-IN")} left</span>
                  </div>
                  <div className="space-y-4 text-sm my-6">
                    <p className="flex items-center gap-2">
                      <Users size={16} className="text-slate-500" />
                      {p.investorCount} investors
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock3 size={16} className="text-slate-500" />
                      {p.holdingPeriodMonths
                        ? `${p.holdingPeriodMonths} month target hold`
                        : "Holding period not specified"}
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Minimum investment
                      </span>
                      <strong>{formatINR(p.minUnits * p.unitPrice)}</strong>
                    </div>
                  </div>
                  {user?.role === "INVESTOR" &&
                    user.kyc?.status !== "APPROVED" && (
                      <p className="text-xs text-amber-900 bg-amber-50 p-3 rounded-lg mb-4">
                        {user.kyc?.status === "PENDING"
                          ? "Your KYC is under review."
                          : "Complete your identity verification before investing."}
                      </p>
                    )}
                  {action}
                  {reason && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {reason}
                    </p>
                  )}
                  <p className="flex gap-2 mt-5 text-xs leading-5 text-muted-foreground">
                    <ShieldCheck
                      size={16}
                      className="shrink-0 text-emerald-700"
                    />
                    Review all documents and risks before investing. Returns are
                    illustrative, not guaranteed.
                  </p>
                </div>
              </aside>
            </div>
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t shadow-lg p-3 flex items-center gap-4">
              <div className="shrink-0">
                <p className="text-xs text-muted-foreground">Price per unit</p>
                <p className="font-semibold text-navy">
                  {formatINR(p.unitPrice)}
                </p>
              </div>
              <div className="flex-1">{action}</div>
            </div>
          </>
        ) : null}
    </div>
  );
}

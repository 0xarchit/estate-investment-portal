"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Wallet,
  ChartNoAxesCombined,
  UserRoundCheck,
  Building2,
  Layers3,
  MoveUpRight,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyImage } from "@/components/property/PropertyImage";
import { FundingBar } from "@/components/shared/FundingBar";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { getProperties } from "@/lib/api/properties";
import { formatINR, formatPct } from "@/lib/format";
const steps = [
  {
    icon: UserRoundCheck,
    title: "Make it official",
    text: "Create your account and complete identity verification.",
  },
  {
    icon: Wallet,
    title: "Fund your wallet",
    text: "Add test funds to your wallet, ready for your first investment.",
  },
  {
    icon: Building2,
    title: "Find your property",
    text: "Explore the details and choose how many units you want to own.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Follow your investment",
    text: "Track your ownership and receive your share when a property sells.",
  },
];
const faqs = [
  [
    "What is fractional property ownership?",
    "A property is divided into investment units. Purchasing units represents a proportional share of that property. Your ownership, investment amount, and eventual payout are shown in your portfolio.",
  ],
  [
    "How much do I need to get started?",
    "Each property has its own unit price and minimum unit requirement. You can see the exact minimum investment on the property detail page before making a decision.",
  ],
  [
    "How do I receive returns?",
    "Projected appreciation is an estimate, not a promise. When an acquired property is sold, the distributable sale proceeds, after applicable fees, are allocated proportionally to investors and credited to their wallets.",
  ],
  [
    "Can I withdraw my wallet balance?",
    "You can request a withdrawal of your available wallet balance. Withdrawal requests are reviewed by an administrator. Invested funds remain committed until a property exit or cancellation.",
  ],
  [
    "Is real money involved?",
    "No. This is an academic project using a test wallet and simulated payments. No real money or securities are involved.",
  ],
];
export default function Home() {
  const filters = { status: "LIVE", limit: 3 };
  const query = useQuery({
    queryKey: ["properties", filters],
    queryFn: () => getProperties(filters),
  });
  const featured = query.data?.items ?? [];
  const hero = featured[0];
  return (
    <PublicLayout>
      <section className="bg-navy text-white overflow-hidden">
        <div className="site-width grid lg:grid-cols-[1.05fr_1fr] gap-12 py-16 md:py-24 items-center">
          <div>
            <p className="eyebrow text-emerald-300 flex items-center gap-3">
              <span className="w-7 h-px bg-emerald-300" /> A share in something
              real
            </p>
            <h1 className="font-heading text-4xl md:text-6xl font-semibold tracking-tight leading-[1.12] mt-7 max-w-2xl">
              Great properties.
              <br />
              Smaller entry.
              <br />
              <span className="text-emerald-300">Bigger possibilities.</span>
            </h1>
            <p className="text-slate-300 text-base leading-7 mt-7 max-w-lg">
              Build your property portfolio, one share at a time. Explore
              fractional ownership with clear numbers and a view of the bigger
              picture.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/properties"
                className="btn bg-white text-navy hover:bg-slate-100"
              >
                Explore properties <ArrowUpRight size={18} />
              </Link>
              <Link
                href="#how-it-works"
                className="btn bg-transparent border border-white/40 hover:bg-white/10"
              >
                How it works
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-3 mt-10 text-xs text-slate-300">
              <span className="flex gap-1.5 items-center">
                <ShieldCheck size={16} className="text-emerald-300" />
                KYC-verified investors
              </span>
              <span className="flex gap-1.5 items-center">
                <Layers3 size={16} className="text-emerald-300" />
                Transparent ownership
              </span>
              <span className="flex gap-1.5 items-center">
                <Wallet size={16} className="text-emerald-300" />
                Track every transaction
              </span>
            </div>
          </div>
          <div className="relative lg:pl-8">
            <div className="border border-white/20 rounded-t-[140px] rounded-b-xl p-3 pb-20 relative">
              <div className="aspect-[4/3] overflow-hidden rounded-t-[130px] rounded-b-md">
                <PropertyImage
                  src={hero?.images?.[0]?.url}
                  alt={hero?.title ?? "Explore property ownership"}
                  className="min-h-0"
                />
              </div>
              <div className="absolute left-7 bottom-6 right-7 flex justify-between items-center gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-300">
                    {hero ? "Featured opportunity" : "Built around your future"}
                  </p>
                  <h2 className="font-semibold mt-1 text-sm md:text-base">
                    {hero?.title ??
                      "Property ownership. A little more accessible."}
                  </h2>
                </div>
                <Link
                  href={hero ? `/properties/${hero._id}` : "/properties"}
                  className="w-11 h-11 flex shrink-0 items-center justify-center rounded-full border border-white/30"
                  aria-label="Explore featured property"
                >
                  <MoveUpRight size={19} />
                </Link>
              </div>
            </div>
            {hero && (
              <div className="bg-white text-navy border border-slate-200 shadow-xl rounded-xl p-5 absolute -bottom-10 right-4 left-8 md:left-16">
                <div className="flex justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Start with {hero.minUnits}{" "}
                      {hero.minUnits === 1 ? "unit" : "units"}
                    </p>
                    <p className="text-xl font-semibold mt-1">
                      {formatINR(hero.unitPrice * hero.minUnits)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Est. annual appreciation
                    </p>
                    <p className="text-xl font-semibold text-emerald-700 mt-1">
                      {hero.expectedAppreciationPct !== undefined
                        ? formatPct(hero.expectedAppreciationPct)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                <FundingBar pct={hero.fundingPct} />
              </div>
            )}
          </div>
        </div>
      </section>
      <section
        id="how-it-works"
        className="site-width py-20 md:py-24 scroll-mt-20"
      >
        <div className="md:flex justify-between items-end gap-10 mb-12">
          <div>
            <p className="eyebrow text-emerald-700 mb-3">
              A clear path to ownership
            </p>
            <h2 className="section-title">
              Your first share.
              <br />
              Four simple steps.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm mt-5 leading-7">
            From exploring a property to tracking your investment, every step is
            designed to keep you informed.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="border-t border-slate-300 pt-6">
              <div className="flex justify-between items-start">
                <step.icon size={28} strokeWidth={1.5} className="text-navy" />
                <span className="font-heading text-sm text-slate-500">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold mt-5 mb-2 text-navy">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-6">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white border-y py-16">
        <div className="site-width">
          <div className="flex flex-wrap justify-between items-end gap-5 mb-9">
            <div>
              <p className="eyebrow text-emerald-700 mb-3">
                Open for investment
              </p>
              <h2 className="section-title">Find your next opportunity.</h2>
            </div>
            <Link
              href="/properties"
              className="text-sm font-semibold text-navy flex items-center gap-2"
            >
              View marketplace <ArrowRight size={17} />
            </Link>
          </div>
          {query.isLoading ? (
            <PageSkeleton />
          ) : query.isError ? (
            <ErrorState
              message="We couldn’t load available properties. Please try again."
              onRetry={() => query.refetch()}
            />
          ) : featured.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="New opportunities are on the way"
              description="Live properties will appear here as they become available."
              action={
                <Link className="btn btn-secondary" href="/properties">
                  Explore marketplace
                </Link>
              }
            />
          )}
        </div>
      </section>
      <section className="site-width py-20 grid lg:grid-cols-[1fr_1.15fr] gap-12 md:gap-20">
        <div>
          <p className="eyebrow text-emerald-700 mb-3">A different way in</p>
          <h2 className="section-title">
            You don’t need to own it all
            <br />
            to be part of it.
          </h2>
          <p className="text-sm text-muted-foreground leading-7 mt-6">
            Fractional ownership brings property investing into focus. Choose a
            share that fits your plans, understand where it goes, and follow its
            progress.
          </p>
        </div>
        <div className="space-y-7">
          {[
            [
              "A more accessible entry point",
              "Invest in units instead of purchasing an entire property. See minimums before committing.",
            ],
            [
              "A complete view of your investment",
              "Review valuations, funding progress, documents, and ownership in one place.",
            ],
            [
              "Every movement accounted for",
              "Follow investments, payouts, and wallet transactions with a clear record of your activity.",
            ],
          ].map(([title, text], i) => (
            <div className="flex gap-5 border-b pb-6" key={title}>
              <span className="text-gold-700 font-heading text-lg">
                0{i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-navy">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-6">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="faq" className="site-width pb-20 scroll-mt-24">
        <div className="text-center mb-10">
          <p className="eyebrow text-emerald-700 mb-3">
            Good questions. Clear answers.
          </p>
          <h2 className="section-title">Before you take the first step.</h2>
        </div>
        <div className="max-w-3xl mx-auto">
          {faqs.map(([q, a]) => (
            <details className="border-b py-5 group" key={q}>
              <summary className="flex justify-between gap-4 cursor-pointer font-medium list-none text-navy">
                {q}
                <span
                  className="text-emerald-700 group-open:rotate-45 text-xl"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="text-sm leading-7 text-muted-foreground mt-4 pr-5">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className="site-width">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 md:p-12 flex flex-wrap justify-between items-center gap-7">
          <div>
            <p className="eyebrow text-emerald-800 mb-3">
              Your next chapter starts here
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-navy">
              Make room for real estate.
            </h2>
            <p className="text-sm text-muted-foreground mt-3">
              Explore the properties. Understand the numbers. Find your share.
            </p>
          </div>
          <Link href="/properties" className="btn">
            Browse properties <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { getProperty } from "@/lib/api/properties";
import { getHoldings } from "@/lib/api/portfolio";
import { getWallet } from "@/lib/api/wallet";
import {
  invest,
  investmentLimits,
  type InvestResult,
} from "@/lib/api/investments";
import { checkoutGuard } from "@/components/investor/checkout";
import { formatINR, formatPct } from "@/lib/format";
import { ownershipPct, projectedValue } from "@/lib/calc";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusChip } from "@/components/shared/StatusChip";
import { FundingBar } from "@/components/shared/FundingBar";
import { Modal } from "@/components/shared/Modal";
import { KycBanner, errorMessage } from "@/components/investor/common";
export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const client = useQueryClient();
  const property = useQuery({
    queryKey: ["property", id],
    queryFn: () => getProperty(id),
  });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet });
  const holdings = useQuery({
    queryKey: ["portfolio", "holdings"],
    queryFn: getHoldings,
  });
  const [units, setUnits] = useState(0);
  const [terms, setTerms] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [issue, setIssue] = useState("");
  const [receipt, setReceipt] = useState<InvestResult | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const attemptUnits = useRef<number | null>(null);
  const initialized = useRef("");
  const key = useRef<string | null>(null);
  const lock = useRef(false);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const mine =
    holdings.data?.items.find(
      (h) => h.propertyId === id && h.status === "ACTIVE",
    )?.units ?? 0;
  const limits = property.data
    ? investmentLimits(property.data, mine)
    : { min: 1, max: 0 };
  useEffect(() => {
    if (!property.data || !holdings.data || unconfirmed) return;
    if (initialized.current !== id) {
      const saved = Number(sessionStorage.getItem(`investment-units:${id}`));
      setUnits(
        limits.max >= limits.min
          ? Math.min(limits.max, Math.max(limits.min, saved || limits.min))
          : 0,
      );
      initialized.current = id;
    } else
      setUnits((value) =>
        limits.max >= limits.min
          ? Math.min(limits.max, Math.max(limits.min, value))
          : 0,
      );
  }, [id, property.data, holdings.data, limits.min, limits.max, unconfirmed]);
  useEffect(() => {
    if (initialized.current === id)
      sessionStorage.setItem(`investment-units:${id}`, String(units));
  }, [id, units]);
  useEffect(() => {
    if (receipt) successHeading.current?.focus();
  }, [receipt]);
  const mutation = useMutation({
    mutationFn: () => {
      key.current ??= crypto.randomUUID();
      attemptUnits.current ??= units;
      return invest({
        propertyId: id,
        units: attemptUnits.current,
        idempotencyKey: key.current,
      });
    },
    onSuccess: async (result) => {
      setReceipt(result);
      setConfirm(false);
      sessionStorage.removeItem(`investment-units:${id}`);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["wallet"] }),
        client.invalidateQueries({ queryKey: ["portfolio"] }),
        client.invalidateQueries({ queryKey: ["property", id] }),
        client.invalidateQueries({ queryKey: ["properties"] }),
        client.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      await refreshUser().catch(() => {});
    },
    onError: async (error: unknown) => {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      const messages: Record<string, string> = {
        NETWORK_ERROR:
          "The connection was interrupted. Retry confirmation to check the same investment safely; your order will not be duplicated.",
        INSUFFICIENT_BALANCE:
          "Your wallet balance changed. Add funds before trying again.",
        KYC_NOT_APPROVED: "Your KYC must be approved before investing.",
        MAX_OWNERSHIP_EXCEEDED: "This selection exceeds your ownership limit.",
        PROPERTY_NOT_LIVE: "Funding has closed for this property.",
        TOO_MANY_REQUESTS:
          "Too many attempts. Please wait a moment before retrying.",
      };
      setIssue(messages[code] ?? errorMessage(error));
      toast.error(messages[code] ?? errorMessage(error));
      if (code === "INSUFFICIENT_UNITS") {
        const fresh = await property.refetch();
        setIssue(
          `Only ${fresh.data?.remainingUnits ?? 0} units remain. Please review your updated selection.`,
        );
      }
      if (code === "NETWORK_ERROR") {
        setUnconfirmed(true);
      } else {
        key.current = null;
        attemptUnits.current = null;
        setUnconfirmed(false);
        await Promise.allSettled([
          property.refetch(),
          wallet.refetch(),
          holdings.refetch(),
          refreshUser(),
        ]);
      }
    },
    onSettled: () => {
      lock.current = false;
    },
  });
  if (property.isPending || wallet.isPending || holdings.isPending)
    return <PageSkeleton />;
  const error = property.error || wallet.error || holdings.error;
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        onRetry={() => {
          property.refetch();
          wallet.refetch();
          holdings.refetch();
        }}
      />
    );
  const p = property.data!;
  const balance = wallet.data!.balance;
  const state = checkoutGuard({
    ...limits,
    units,
    unitPrice: p.unitPrice,
    balance,
    kyc: user?.kyc?.status ?? "NOT_SUBMITTED",
    status: p.status,
    terms,
  });
  const ownership = ownershipPct(units, p.totalUnits);
  const projected = projectedValue(
    state.amount,
    p.expectedAppreciationPct ?? 0,
    (p.holdingPeriodMonths ?? 36) / 12,
  );
  function confirmInvestment() {
    if ((!state.eligible && !unconfirmed) || lock.current) return;
    lock.current = true;
    setIssue("");
    mutation.mutate();
  }
  function reviewInvestment() {
    if ((state.eligible || unconfirmed) && !mutation.isPending) {
      setIssue("");
      setConfirm(true);
    }
  }
  if (receipt)
    return (
      <section className="panel mx-auto max-w-2xl p-6 sm:p-10" role="status">
        <CheckCircle2 className="mb-5 h-12 w-12 text-emerald-700" />
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-800">
          Investment successful
        </p>
        <h1
          ref={successHeading}
          tabIndex={-1}
          className="text-3xl font-semibold"
        >
          You now own {formatPct(receipt.investment.ownershipPct, 2)} of{" "}
          {p.title}
        </h1>
        <dl className="my-8 space-y-4 text-sm">
          {[
            ["Units purchased", String(receipt.investment.units)],
            ["Amount invested", formatINR(receipt.investment.amount)],
            ["New wallet balance", formatINR(receipt.walletBalance)],
            ["Reference", receipt.investment._id],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3"
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="break-all font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-3">
          <Link href="/investor/portfolio" className="btn">
            View portfolio
          </Link>
          <Link href="/properties" className="btn-secondary">
            Browse more
          </Link>
        </div>
      </section>
    );
  return (
    <div className="page-stack pb-40 md:pb-0">
      <PageHeader
        title="Make it part of your portfolio"
        subtitle="Review the numbers. Invest with clarity."
      />
      <KycBanner />
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="panel p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/properties/${id}`}
                  className="text-xl font-semibold hover:underline"
                >
                  {p.title}
                </Link>
                <p className="mt-2 text-sm text-slate-500">
                  {p.city} · {p.type.toLowerCase()}
                </p>
              </div>
              <StatusChip status={p.status} />
            </div>
            <FundingBar pct={p.fundingPct} />
            <div className="mt-5 flex justify-between text-sm">
              <span>{p.remainingUnits} units available</span>
              <strong>{formatINR(p.unitPrice)} / unit</strong>
            </div>
          </section>
          <section className="panel p-6">
            <h2 className="text-xl font-semibold">Choose your share</h2>
            <p className="mt-2 text-sm text-slate-500">
              Minimum {limits.min} units · Your remaining limit: {limits.max}{" "}
              units
            </p>
            <label className="mt-6 block text-sm font-semibold" htmlFor="units">
              Number of units
            </label>
            <div className="mt-2 flex max-w-xs items-center gap-2">
              <button
                className="btn-secondary h-11 w-11"
                aria-label="Remove one unit"
                disabled={
                  mutation.isPending || unconfirmed || units <= limits.min
                }
                onClick={() => setUnits(units - 1)}
              >
                −
              </button>
              <input
                id="units"
                type="number"
                inputMode="numeric"
                className="field min-w-0 text-center"
                min={limits.min}
                max={limits.max}
                step="1"
                value={units}
                disabled={
                  mutation.isPending || unconfirmed || limits.max < limits.min
                }
                onChange={(e) => setUnits(Number(e.target.value))}
                onBlur={() => {
                  if (limits.max >= limits.min) {
                    const next = Math.min(
                      limits.max,
                      Math.max(limits.min, Math.floor(units) || limits.min),
                    );
                    if (next !== units)
                      setIssue(`Selection adjusted to ${next} units.`);
                    setUnits(next);
                  }
                }}
              />
              <button
                className="btn-secondary h-11 w-11"
                aria-label="Add one unit"
                disabled={
                  mutation.isPending || unconfirmed || units >= limits.max
                }
                onClick={() => setUnits(units + 1)}
              >
                +
              </button>
            </div>
            <input
              className="my-6 w-full accent-emerald-700"
              aria-label="Select units"
              type="range"
              min={limits.min}
              max={Math.max(limits.min, limits.max)}
              value={units}
              disabled={
                mutation.isPending || unconfirmed || limits.max < limits.min
              }
              onChange={(e) => setUnits(Number(e.target.value))}
            />
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([limits.min, 10, 25, limits.max]))
                .filter((n) => n > 0)
                .map((n) => (
                  <button
                    key={n}
                    disabled={
                      mutation.isPending ||
                      unconfirmed ||
                      n < limits.min ||
                      n > limits.max
                    }
                    className={units === n ? "btn" : "btn-secondary"}
                    onClick={() => setUnits(n)}
                  >
                    {n === limits.max ? `Max · ${n}` : n}
                  </button>
                ))}
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold">Understand your investment</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Projected values are estimates, not guaranteed returns. Property
              ownership is illiquid and investments can lose value. This
              academic platform uses demo funds only.
            </p>
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-emerald-700"
                checked={terms}
                disabled={mutation.isPending || unconfirmed}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <span>
                I have read and accept the investment terms and risk disclosure
                above.
              </span>
            </label>
          </section>
        </div>
        <section className="panel p-6 lg:sticky lg:top-28 lg:col-span-5">
          <h2 className="text-xl font-semibold">Order summary</h2>
          <div aria-live="polite">
            <p className="mt-6 text-xs uppercase tracking-widest text-slate-500">
              Investment amount
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              {formatINR(state.amount)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {units} units × {formatINR(p.unitPrice)}
            </p>
            <dl className="my-6 space-y-4 text-sm">
              {[
                ["Ownership", formatPct(ownership, 2)],
                ["Projected value", formatINR(projected)],
                ["Wallet balance", formatINR(balance)],
                ["Balance after", formatINR(balance - state.amount)],
              ].map(([label, value]) => (
                <div className="flex justify-between gap-4" key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mb-5 text-xs text-slate-500">
              Projection over {((p.holdingPeriodMonths ?? 36) / 12).toFixed(1)}{" "}
              years at {formatPct(p.expectedAppreciationPct ?? 0)} annual
              appreciation.
            </p>
            {state.shortfall > 0 && (
              <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                Insufficient balance. You need {formatINR(state.shortfall)}{" "}
                more.
                <Link
                  href={`/investor/wallet?amount=${Math.ceil(state.shortfall / 100)}`}
                  className="mt-2 block font-semibold underline"
                >
                  Add {formatINR(state.shortfall)} more →
                </Link>
              </div>
            )}
          </div>
          {issue && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              {issue}
            </p>
          )}
          <button
            className="btn hidden w-full md:inline-flex"
            disabled={(!state.eligible && !unconfirmed) || mutation.isPending}
            aria-disabled={
              (!state.eligible && !unconfirmed) || mutation.isPending
            }
            aria-describedby="checkout-reason"
            onClick={reviewInvestment}
          >
            {unconfirmed ? "Retry confirmation" : "Review & invest"}
          </button>
          <p id="checkout-reason" className="mt-3 text-sm text-slate-600">
            {unconfirmed
              ? "Retry uses the original order reference to prevent a duplicate purchase."
              : state.reason ||
                "You will confirm the investment in the next step."}
          </p>
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <LockKeyhole className="h-4 w-4" />
            Demo funds · Server-verified allocation
          </p>
        </section>
      </div>
      <aside
        aria-label="Mobile investment summary"
        className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 rounded-xl border border-slate-200 bg-white p-4 shadow-lg md:hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0" aria-live="polite">
            <p className="text-xs text-slate-500">Investment total</p>
            <p className="break-words text-xl font-semibold tabular-nums">
              {formatINR(state.amount)}
            </p>
          </div>
          <button
            className="btn"
            disabled={(!state.eligible && !unconfirmed) || mutation.isPending}
            aria-describedby="mobile-checkout-reason"
            onClick={reviewInvestment}
          >
            {unconfirmed ? "Retry confirmation" : "Review & invest"}
          </button>
        </div>
        <p id="mobile-checkout-reason" className="mt-2 text-xs text-slate-600">
          {unconfirmed
            ? "Retry safely with your original order reference."
            : state.reason ||
              `${units} units · ${formatPct(ownership, 2)} ownership`}
        </p>
      </aside>
      <Modal
        open={confirm}
        title="Confirm your investment"
        onClose={() => setConfirm(false)}
        loading={mutation.isPending}
      >
        <div className="space-y-4">
          <p className="text-lg font-semibold">{p.title}</p>
          <p>
            {units} units · {formatPct(ownership, 2)} ownership
          </p>
          <p className="text-3xl font-semibold">{formatINR(state.amount)}</p>
          <p className="text-sm text-slate-600">
            Balance after: {formatINR(balance - state.amount)}. This investment
            cannot be undone.
          </p>
          {issue && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {issue}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-secondary"
              disabled={mutation.isPending}
              onClick={() => setConfirm(false)}
            >
              Back
            </button>
            <button
              className="btn"
              disabled={mutation.isPending || (!state.eligible && !unconfirmed)}
              onClick={confirmInvestment}
            >
              {mutation.isPending
                ? "Investing…"
                : `Confirm & pay ${formatINR(state.amount)}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import {
  getPropertyById,
  getFundingTimeline,
  getPropertyInvestors,
  type BrokerProperty,
  type FundingTimelinePoint,
  type PropertyInvestor,
  type PropertyStatus,
} from '@/lib/api/broker';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_STYLES: Record<PropertyStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  LIVE: 'bg-blue-100 text-blue-700',
  FUNDED: 'bg-emerald-100 text-emerald-700',
  HOLDING: 'bg-purple-100 text-purple-700',
  SOLD: 'bg-[#0F2A4A]/10 text-[#0F2A4A]',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

function StatusChip({ status }: { status: PropertyStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function FundingBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[#10B981] transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-[#111827]">{clamped.toFixed(1)}%</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PropertyAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [property, setProperty] = useState<BrokerProperty | null>(null);
  const [timeline, setTimeline] = useState<FundingTimelinePoint[]>([]);
  const [investors, setInvestors] = useState<PropertyInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    Promise.allSettled([
      getPropertyById(id),
      getFundingTimeline(id),
      getPropertyInvestors(id),
    ]).then(([propRes, tlRes, invRes]) => {
      if (propRes.status === 'rejected') {
        const code = (propRes.reason as { code?: string })?.code;
        setErrorCode(code ?? 'ERROR');
        setError(
          code === 'NOT_FOUND'
            ? 'This property does not exist.'
            : code === 'FORBIDDEN'
            ? "You don't have permission to view this property."
            : 'Failed to load property.'
        );
        setLoading(false);
        return;
      }
      setProperty(propRes.value);
      if (tlRes.status === 'fulfilled') setTimeline(tlRes.value);
      if (invRes.status === 'fulfilled') setInvestors(invRes.value.items);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Error / forbidden state ──────────────────────────────────────────────

  if (!loading && error) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-5xl">{errorCode === 'NOT_FOUND' ? '404' : '403'}</p>
        <p className="text-lg font-semibold text-[#111827]">{error}</p>
        <button
          onClick={() => router.push('/broker/properties')}
          className="rounded-lg bg-[#0F2A4A] px-4 py-2.5 text-sm font-semibold text-white"
        >
          ← Back to properties
        </button>
      </div>
    );
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 rounded-2xl bg-gray-200" />
        <div className="h-64 rounded-2xl bg-gray-200" />
        <div className="h-48 rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (!property) return null;

  const chartData = timeline.map((t) => ({
    date: formatDate(t.date),
    unitsSold: t.unitsSold,
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/broker/properties')}
        className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111827]"
      >
        <ArrowLeft size={14} /> My Properties
      </button>

      {/* Header card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#111827]">{property.title}</h1>
              <StatusChip status={property.status} />
            </div>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              {property.city}, {property.state}
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-[#6B7280] hover:text-[#111827]"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="mt-4">
          <p className="mb-1 text-xs text-[#6B7280]">Funding progress</p>
          <FundingBar pct={property.fundingPct} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-[#6B7280]">Units sold</p>
            <p className="text-lg font-bold text-[#111827]">
              {property.unitsSold}/{property.totalUnits}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Investors</p>
            <p className="text-lg font-bold text-[#111827]">{property.investorCount}</p>
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Valuation</p>
            <p className="text-lg font-bold text-[#111827]">{formatINR(property.valuation)}</p>
          </div>
          {property.commissionEarned != null && (
            <div>
              <p className="text-xs text-[#6B7280]">Commission earned</p>
              <p className="text-lg font-bold text-[#10B981]">
                {formatINR(property.commissionEarned)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Funding timeline chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-base font-semibold text-[#111827]">Funding timeline</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="funding-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="unitsSold"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#funding-grad)"
                name="Units sold"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Investor list */}
      {investors.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-base font-semibold text-[#111827]">
            Investors ({investors.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  <th className="pb-2 pr-4">Investor</th>
                  <th className="pb-2 pr-4">Units</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2">Ownership</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {investors.map((inv) => (
                  <tr key={inv.investorId}>
                    <td className="py-2.5 pr-4 font-medium text-[#111827]">
                      {inv.name}
                    </td>
                    <td className="py-2.5 pr-4 text-[#6B7280]">{inv.units}</td>
                    <td className="py-2.5 pr-4 text-[#111827]">{formatINR(inv.amount)}</td>
                    <td className="py-2.5 text-[#6B7280]">
                      {inv.ownershipPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {investors.length === 0 && timeline.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-[#6B7280]">
          <p>No investor data yet.</p>
          <p>Check back once the property goes live.</p>
        </div>
      )}
    </div>
  );
}

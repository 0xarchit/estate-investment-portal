'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AlertTriangle, PlusSquare, RefreshCw } from 'lucide-react';

import { useAuth } from '@/lib/auth/AuthContext';
import { getBrokerStats, type BrokerStats } from '@/lib/api/broker';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCompactINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1_00_00_000) return `₹${(rupees / 1_00_00_000).toFixed(1)} Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(1)} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-[#111827]">{value}</p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BrokerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BrokerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getBrokerStats()
      .then(setStats)
      .catch((e: unknown) =>
        setError((e as { message?: string })?.message ?? 'Failed to load stats')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isUnapproved = user?.role === 'BROKER' && !user?.brokerApproved;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#6B7280]">Broker dashboard overview</p>
        </div>
        <Link
          href="/broker/properties/new"
          aria-disabled={isUnapproved}
          onClick={(e) => isUnapproved && e.preventDefault()}
          className={[
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition',
            isUnapproved
              ? 'cursor-not-allowed bg-gray-300'
              : 'bg-[#10B981] hover:bg-emerald-600',
          ].join(' ')}
        >
          <PlusSquare size={16} />
          New listing
        </Link>
      </div>

      {/* Unapproved broker banner */}
      {isUnapproved && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Awaiting admin approval
            </p>
            <p className="text-sm text-amber-700">
              Your broker account is pending review. You can&apos;t create listings until
              an admin approves your account.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-900"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Properties Listed" value={stats?.listed ?? 0} loading={loading} />
        <StatCard label="Live" value={stats?.live ?? 0} loading={loading} />
        <StatCard label="Funded" value={stats?.funded ?? 0} loading={loading} />
        <StatCard
          label="Total Raised"
          value={stats ? formatCompactINR(stats.totalRaised) : '—'}
          loading={loading}
        />
        <StatCard
          label="Commission Earned"
          value={stats ? formatCompactINR(stats.commissionEarned) : '—'}
          loading={loading}
        />
        <StatCard
          label="Pending Approvals"
          value={stats?.pendingApprovals ?? 0}
          loading={loading}
        />
      </div>

      {/* Funding chart */}
      {!loading && stats && stats.fundingByProperty.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-base font-semibold text-[#111827]">
            Funding by property
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats.fundingByProperty}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="title"
                width={140}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip formatter={(v) => [`${v}%`, 'Funded']} />
              <Bar dataKey="fundingPct" radius={[0, 4, 4, 0]}>
                {stats.fundingByProperty.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.fundingPct >= 100 ? '#10B981' : '#0F2A4A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && stats && stats.listed === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-base font-medium text-[#111827]">No properties yet</p>
          <p className="text-sm text-[#6B7280]">Create your first listing to get started</p>
          {!isUnapproved && (
            <Link
              href="/broker/properties/new"
              className="rounded-lg bg-[#10B981] px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              + New listing
            </Link>
          )}
        </div>
      )}

      {/* Needs attention */}
      {!loading && stats && stats.listed > 0 && (
        <NeedsAttention />
      )}
    </div>
  );
}

// Needs Attention panel — loads broker properties and filters REJECTED/DRAFT
function NeedsAttention() {
  const [items, setItems] = useState<
    Array<{
      _id: string;
      title: string;
      status: string;
      rejectionReason?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/api/broker')
      .then(({ getBrokerProperties }) =>
        getBrokerProperties({ limit: 50 })
      )
      .then(({ items: all }) => {
        setItems(
          all.filter((p) => p.status === 'REJECTED' || p.status === 'DRAFT')
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 text-base font-semibold text-[#111827]">
        Needs attention ({items.length})
      </h2>
      <ul className="divide-y">
        {items.map((p) => (
          <li key={p._id} className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#111827]">{p.title}</p>
              {p.status === 'REJECTED' && p.rejectionReason && (
                <p className="mt-0.5 text-xs text-[#DC2626]">
                  Rejected: {p.rejectionReason}
                </p>
              )}
              {p.status === 'DRAFT' && (
                <p className="mt-0.5 text-xs text-[#6B7280]">Draft — not submitted</p>
              )}
            </div>
            <Link
              href={`/broker/properties/${p._id}/edit`}
              className="shrink-0 rounded-lg border border-[#0F2A4A] px-3 py-1.5 text-xs font-semibold text-[#0F2A4A] hover:bg-[#0F2A4A] hover:text-white transition"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, PlusSquare, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getBrokerProperties,
  submitProperty,
  type BrokerProperty,
  type PropertyStatus,
} from '@/lib/api/broker';
import { useAuth } from '@/lib/auth/AuthContext';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
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
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[#10B981] transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs text-[#6B7280]">{clamped.toFixed(1)}%</span>
    </div>
  );
}

// ── Confirm modal (minimal, until P3 pushes ConfirmModal) ─────────────────

function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
        <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border py-2 text-sm font-medium text-[#111827] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-[#10B981] py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function BrokerPropertiesPage() {
  const { user } = useAuth();
  const isUnapproved = user?.role === 'BROKER' && !user?.brokerApproved;

  const [properties, setProperties] = useState<BrokerProperty[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // submit modal
  const [submitTarget, setSubmitTarget] = useState<BrokerProperty | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getBrokerProperties({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter || undefined,
    })
      .then(({ items, totalPages: tp }) => {
        setProperties(items);
        setTotalPages(tp);
      })
      .catch((e: unknown) =>
        setError((e as { message?: string })?.message ?? 'Failed to load')
      )
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!submitTarget) return;
    setSubmitting(true);
    setSubmitErrors([]);
    try {
      await submitProperty(submitTarget._id);
      toast.success('Property submitted for approval.');
      setSubmitTarget(null);
      load();
    } catch (e: unknown) {
      const details = (e as { details?: string[] })?.details;
      if (details?.length) {
        setSubmitErrors(details);
      } else {
        toast.error((e as { message?: string })?.message ?? 'Submit failed.');
        setSubmitTarget(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">My Properties</h1>
          <p className="text-sm text-[#6B7280]">Manage your listings</p>
        </div>
        <Link
          href="/broker/properties/new"
          aria-disabled={isUnapproved}
          onClick={(e) => isUnapproved && e.preventDefault()}
          className={[
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white',
            isUnapproved ? 'cursor-not-allowed bg-gray-300' : 'bg-[#10B981] hover:bg-emerald-600',
          ].join(' ')}
        >
          <PlusSquare size={16} />
          New listing
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            placeholder="Search properties…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#10B981]"
        >
          <option value="">All statuses</option>
          {['DRAFT', 'PENDING_APPROVAL', 'LIVE', 'FUNDED', 'HOLDING', 'SOLD', 'REJECTED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={load} className="flex items-center gap-1 text-sm font-medium text-red-700">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Funding</th>
              <th className="px-4 py-3">Units sold</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && properties.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[#6B7280]">
                  <p className="font-medium">No properties found</p>
                  {!statusFilter && !search && (
                    <p className="mt-1 text-xs">
                      {isUnapproved
                        ? 'Awaiting admin approval before you can list'
                        : 'Create your first listing to get started'}
                    </p>
                  )}
                </td>
              </tr>
            )}

            {!loading &&
              properties.map((p) => (
                <tr key={p._id} className="hover:bg-[#F7F8FA]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[#111827] line-clamp-1">{p.title}</p>
                      <p className="text-xs text-[#6B7280]">{p.city}, {p.state}</p>
                      {p.status === 'REJECTED' && p.rejectionReason && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle size={11} />
                          {p.rejectionReason}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <FundingBar pct={p.fundingPct} />
                  </td>
                  <td className="px-4 py-3 text-[#111827]">
                    {p.unitsSold}/{p.totalUnits}
                    <span className="ml-1 text-xs text-[#6B7280]">
                      ({p.investorCount} inv.)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#111827]">
                    {p.commissionEarned != null
                      ? formatINR(p.commissionEarned)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <PropertyActions
                      property={p}
                      onSubmit={() => setSubmitTarget(p)}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-[#6B7280]">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Submit confirmation modal */}
      <ConfirmModal
        open={!!submitTarget}
        title="Submit for approval"
        description={`Submit "${submitTarget?.title}" to admin for review? This will change status to Pending Approval.`}
        onConfirm={handleSubmit}
        onClose={() => { setSubmitTarget(null); setSubmitErrors([]); }}
        loading={submitting}
      />

      {/* Server validation errors from submit */}
      {submitErrors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-[#111827]">Cannot submit yet</h3>
            <ul className="mt-2 space-y-1">
              {submitErrors.map((e, i) => (
                <li key={i} className="text-sm text-red-600">• {e}</li>
              ))}
            </ul>
            <button
              onClick={() => { setSubmitErrors([]); setSubmitTarget(null); }}
              className="mt-4 w-full rounded-lg bg-[#0F2A4A] py-2 text-sm font-semibold text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Row actions by status ──────────────────────────────────────────────────

function PropertyActions({
  property,
  onSubmit,
}: {
  property: BrokerProperty;
  onSubmit: () => void;
}) {
  const { status, _id } = property;

  if (status === 'DRAFT' || status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/broker/properties/${_id}/edit`}
          className="rounded-md border border-[#0F2A4A] px-2.5 py-1 text-xs font-medium text-[#0F2A4A] hover:bg-[#0F2A4A] hover:text-white transition"
        >
          Edit
        </Link>
        <button
          onClick={onSubmit}
          className="rounded-md bg-[#10B981] px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600 transition"
        >
          {status === 'REJECTED' ? 'Resubmit' : 'Submit'}
        </button>
      </div>
    );
  }

  if (status === 'PENDING_APPROVAL') {
    return (
      <span className="text-xs italic text-[#6B7280]">Awaiting review</span>
    );
  }

  // LIVE / FUNDED / HOLDING / SOLD
  return (
    <Link
      href={`/broker/properties/${_id}`}
      className="rounded-md border border-[#0F2A4A] px-2.5 py-1 text-xs font-medium text-[#0F2A4A] hover:bg-[#0F2A4A] hover:text-white transition"
    >
      View analytics
    </Link>
  );
}

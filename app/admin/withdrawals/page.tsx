'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  RefreshCw,
  Building,
  CreditCard,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  getWithdrawals,
  reviewWithdrawal,
  Withdrawal,
} from '@/lib/api/admin';
import { formatINR, formatDate } from '@/components/admin/format';
import {
  AdminPageHeader,
  AdminDataTable,
  AdminErrorState,
  Column,
} from '@/components/admin/ui';
import { WithdrawalReviewModal } from '@/components/admin/WithdrawalReviewModal';
import { toast } from 'react-hot-toast';

const STATUS_FILTERS = [
  { label: 'Pending Requests', value: 'PENDING' },
  { label: 'Approved & Paid', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All Requests', value: '' },
];

function AdminWithdrawalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'PENDING';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected item for review modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: 10,
        status: currentStatus || undefined,
      };

      const data = await getWithdrawals(params);
      setWithdrawals(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentStatus]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const updateStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page');
    router.push(`/admin/withdrawals?${params.toString()}`);
  };

  const handleQuickApprove = async (w: Withdrawal) => {
    try {
      await reviewWithdrawal(w._id, 'APPROVE');
      toast.success(`Withdrawal of ${formatINR(w.amount)} approved! Funds released.`);
      fetchWithdrawals();
    } catch (err: any) {
      if (err?.code === 'INSUFFICIENT_BALANCE') {
        toast.error('Cannot approve withdrawal: Investor has insufficient wallet balance!');
      } else {
        toast.error(err?.message || 'Failed to approve withdrawal');
      }
    }
  };

  const openReview = (w: Withdrawal) => {
    setSelectedWithdrawal(w);
    setModalOpen(true);
  };

  const columns: Column<Withdrawal>[] = [
    {
      key: 'user',
      header: 'Investor',
      render: (w) => (
        <div>
          <div className="font-semibold text-gray-900">{w.user?.name || 'Investor'}</div>
          <div className="text-xs text-gray-500">{w.user?.email || '—'}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (w) => (
        <span className="font-mono font-bold text-gray-900 text-sm">
          {formatINR(w.amount)}
        </span>
      ),
    },
    {
      key: 'bankDetails',
      header: 'Bank Details',
      render: (w) => (
        <div className="text-xs space-y-0.5">
          <div className="text-gray-800 font-medium">
            {w.bankDetails?.accountName || 'N/A'}
          </div>
          <div className="font-mono text-gray-500 text-[11px]">
            A/C: {w.bankDetails?.accountNumber || '—'} • IFSC: {w.bankDetails?.ifsc || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => {
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              w.status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : w.status === 'REJECTED'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {w.status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Requested Date',
      render: (w) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(w.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (w) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openReview(w)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Review</span>
          </button>

          {w.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => handleQuickApprove(w)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              title="Quick Approve"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Approve</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Withdrawal Requests"
        subtitle={`Review investor payout disbursements, verify bank details, and authorize funds release (${totalItems} total)`}
        actions={
          <button
            type="button"
            onClick={fetchWithdrawals}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 text-xs">
        {STATUS_FILTERS.map((f) => {
          const isActive = currentStatus === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => updateStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && <AdminErrorState message={error} onRetry={fetchWithdrawals} />}

      {/* Data Table */}
      {!error && (
        <AdminDataTable
          columns={columns}
          rows={withdrawals}
          loading={loading}
          emptyTitle="No withdrawal requests found in this queue"
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', page.toString());
            router.push(`/admin/withdrawals?${params.toString()}`);
          }}
        />
      )}

      {/* Review Modal */}
      <WithdrawalReviewModal
        withdrawal={selectedWithdrawal}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedWithdrawal(null);
        }}
        onRefresh={fetchWithdrawals}
      />
    </div>
  );
}

export default function AdminWithdrawalsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-gray-500">
          Loading withdrawals...
        </div>
      }
    >
      <AdminWithdrawalsContent />
    </Suspense>
  );
}

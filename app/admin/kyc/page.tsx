'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FileCheck,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import {
  getAdminKyc,
  reviewKyc,
  AdminKycItem,
} from '@/lib/api/admin';
import { formatDate } from '@/components/admin/format';
import {
  AdminPageHeader,
  AdminDataTable,
  AdminErrorState,
  Column,
} from '@/components/admin/ui';
import { KycReviewModal } from '@/components/admin/KycReviewModal';
import { toast } from 'react-hot-toast';

const STATUS_FILTERS = [
  { label: 'Pending Queue', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All Submissions', value: '' },
];

function AdminKycContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'PENDING';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [items, setItems] = useState<AdminKycItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Review Modal Item
  const [selectedKycItem, setSelectedKycItem] = useState<AdminKycItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchKycList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: 10,
        status: currentStatus || undefined,
      };

      const data = await getAdminKyc(params);
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load KYC verification requests');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentStatus]);

  useEffect(() => {
    fetchKycList();
  }, [fetchKycList]);

  const updateStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page');
    router.push(`/admin/kyc?${params.toString()}`);
  };

  const handleQuickApprove = async (item: AdminKycItem) => {
    try {
      await reviewKyc(item.userId, 'APPROVE');
      toast.success(`KYC for ${item.name} approved!`);
      fetchKycList();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve KYC');
    }
  };

  const openReview = (item: AdminKycItem) => {
    setSelectedKycItem(item);
    setModalOpen(true);
  };

  const columns: Column<AdminKycItem>[] = [
    {
      key: 'name',
      header: 'Investor',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {item.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.name}</div>
            <div className="text-xs text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'KYC Status',
      render: (item) => {
        const status = item.kyc?.status || 'PENDING';
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : status === 'REJECTED'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'docs',
      header: 'Documents Uploaded',
      render: (item) => {
        const count = item.kyc?.docs?.length || 0;
        return (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <FileText className="w-4 h-4 text-gray-400" />
            <span>
              {count} {count === 1 ? 'Document' : 'Documents'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (item) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Review & Decision',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openReview(item)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Docs</span>
          </button>

          {item.kyc?.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => handleQuickApprove(item)}
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
        title="KYC Compliance Queue"
        subtitle={`Review investor verification documents, approve legitimate identities, or reject with clear feedback (${totalItems} total)`}
        actions={
          <button
            type="button"
            onClick={fetchKycList}
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
      {error && <AdminErrorState message={error} onRetry={fetchKycList} />}

      {/* Data Table */}
      {!error && (
        <AdminDataTable
          columns={columns}
          rows={items}
          loading={loading}
          emptyTitle="No KYC submissions in this queue"
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', page.toString());
            router.push(`/admin/kyc?${params.toString()}`);
          }}
        />
      )}

      {/* Review Modal */}
      <KycReviewModal
        item={selectedKycItem}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedKycItem(null);
        }}
        onRefresh={fetchKycList}
      />
    </div>
  );
}

export default function AdminKycPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-gray-500">
          Loading KYC queue...
        </div>
      }
    >
      <AdminKycContent />
    </Suspense>
  );
}

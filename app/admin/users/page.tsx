'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  X,
  Shield,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { getAdminUsers, User, UserRole } from '@/lib/api/admin';
import { formatINR, formatDate } from '@/components/admin/format';
import {
  AdminPageHeader,
  AdminDataTable,
  AdminErrorState,
  Column,
} from '@/components/admin/ui';
import { UserRowActions } from '@/components/admin/UserRowActions';

const ROLE_OPTIONS = [
  { label: 'All Roles', value: '' },
  { label: 'Investors', value: 'INVESTOR' },
  { label: 'Brokers', value: 'BROKER' },
  { label: 'Admins', value: 'ADMIN' },
];

const ACTIVE_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive / Deactivated', value: 'false' },
];

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRole = searchParams.get('role') || '';
  const currentActive = searchParams.get('isActive') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local filter inputs
  const [searchInput, setSearchInput] = useState(currentSearch);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: 15,
      };

      if (currentRole) params.role = currentRole;
      if (currentActive !== '') params.isActive = currentActive === 'true';
      if (currentSearch) params.search = currentSearch;

      const data = await getAdminUsers(params);
      setUsers(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users list');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentRole, currentActive, currentSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (!newParams.page && newParams.page !== '1') {
      params.delete('page');
    }

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput || null });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    router.push('/admin/users');
  };

  // Helper for Role Chip
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F2A4A]/10 text-primary border border-[#0F2A4A]/20">
            <Shield className="w-3 h-3 text-primary" />
            <span>Admin</span>
          </span>
        );
      case 'BROKER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Briefcase className="w-3 h-3 text-amber-600" />
            <span>Broker</span>
          </span>
        );
      case 'INVESTOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <UserIcon className="w-3 h-3 text-blue-600" />
            <span>Investor</span>
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{role}</span>;
    }
  };

  // Helper for KYC Chip
  const renderKycBadge = (status: string | undefined) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            Rejected
          </span>
        );
      case 'NOT_SUBMITTED':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
            Not Submitted
          </span>
        );
    }
  };

  // Define Table Columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div>
          <div className="font-semibold text-gray-900">{u.name}</div>
          <div className="text-xs text-gray-500">{u.email}</div>
          {u.phone && <div className="text-[11px] text-gray-400">{u.phone}</div>}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => renderRoleBadge(u.role),
    },
    {
      key: 'brokerApproved',
      header: 'Broker Status',
      render: (u) => {
        if (u.role !== 'BROKER') {
          return <span className="text-xs text-gray-400">—</span>;
        }
        return u.brokerApproved ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Approved
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Pending Approval
          </span>
        );
      },
    },
    {
      key: 'kyc',
      header: 'KYC Status',
      render: (u) => renderKycBadge(u.kyc?.status),
    },
    {
      key: 'walletBalance',
      header: 'Wallet Balance',
      align: 'right',
      render: (u) => (
        <span className="font-mono text-xs font-bold text-gray-900">
          {formatINR(u.walletBalance || 0)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(u.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <UserRowActions
          user={u}
          isSelf={u.email === 'admin@demo.com'}
          onRefresh={fetchUsers}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="User Management"
        subtitle={`Manage platform accounts, activate or deactivate users, and approve brokers (${totalItems} total)`}
        actions={
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200 scrollbar-none text-xs">
        {ROLE_OPTIONS.map((item) => {
          const isActive = currentRole === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => updateFilters({ role: item.value || null })}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Search & Active Status Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between"
      >
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or phone number..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
            />
          </div>

          {/* Active Status Dropdown */}
          <div className="w-full sm:w-56">
            <select
              value={currentActive}
              onChange={(e) => updateFilters({ isActive: e.target.value || null })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-700"
            >
              {ACTIVE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          {(currentRole || currentActive || currentSearch) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </form>

      {/* Error State */}
      {error && <AdminErrorState message={error} onRetry={fetchUsers} />}

      {/* Users DataTable */}
      {!error && (
        <AdminDataTable
          columns={columns}
          rows={users}
          loading={loading}
          emptyTitle="No users found matching your criteria"
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => updateFilters({ page: page.toString() })}
        />
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-gray-500">
          Loading users...
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}

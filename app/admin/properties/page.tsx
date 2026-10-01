'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  getProperties,
  Property,
  PropertyStatus,
} from '@/lib/api/admin';
import { formatINR, formatDate } from '@/components/admin/format';
import {
  AdminPageHeader,
  AdminStatusChip,
  AdminFundingBar,
  AdminDataTable,
  AdminErrorState,
  Column,
} from '@/components/admin/ui';
import { PropertyRowActions } from '@/components/admin/PropertyRowActions';

const ALL_STATUSES: { label: string; value: string }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Funded', value: 'FUNDED' },
  { label: 'Holding', value: 'HOLDING' },
  { label: 'Sold', value: 'SOLD' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function AdminPropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentCity = searchParams.get('city') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [properties, setProperties] = useState<Property[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local filter states
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [cityInput, setCityInput] = useState(currentCity);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: 10,
        sort: '-createdAt',
      };

      if (currentStatus) params.status = currentStatus;
      if (currentSearch) params.search = currentSearch;
      if (currentCity) params.city = currentCity;

      const data = await getProperties(params);
      setProperties(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load property listings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentStatus, currentSearch, currentCity]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 on filter changes if page wasn't explicitly set
    if (!newParams.page && newParams.page !== '1') {
      params.delete('page');
    }

    router.push(`/admin/properties?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput || null, city: cityInput || null });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setCityInput('');
    router.push('/admin/properties');
  };

  // Define Table Columns
  const columns: Column<Property>[] = [
    {
      key: 'property',
      header: 'Property Details',
      render: (prop) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {prop.images && prop.images[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={prop.images[0].url}
                alt={prop.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 line-clamp-1">
              {prop.title}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span>{prop.city}</span>
              <span>•</span>
              <span className="font-mono uppercase text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-semibold">
                {prop.type}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'broker',
      header: 'Broker',
      render: (prop) => (
        <div className="text-xs">
          <div className="font-semibold text-gray-900">
            {prop.broker?.name || 'Platform / Direct'}
          </div>
          {prop.broker?.email && (
            <div className="text-gray-400 truncate max-w-[140px]">
              {prop.broker.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (prop) => <AdminStatusChip status={prop.status} />,
    },
    {
      key: 'funding',
      header: 'Funding Progress',
      render: (prop) => {
        const pct = prop.fundingPct ?? ((prop.unitsSold / prop.totalUnits) * 100);
        return (
          <div className="w-36">
            <AdminFundingBar pct={pct} />
            <div className="text-[11px] text-gray-500 mt-1 font-mono">
              {prop.unitsSold} / {prop.totalUnits} units
            </div>
          </div>
        );
      },
    },
    {
      key: 'valuation',
      header: 'Valuation & Price',
      align: 'right',
      render: (prop) => (
        <div className="text-right">
          <div className="font-bold text-gray-900">
            {formatINR(prop.valuation)}
          </div>
          <div className="text-xs text-gray-500">
            {formatINR(prop.unitPrice)} / unit
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (prop) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(prop.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Lifecycle Actions',
      align: 'right',
      render: (prop) => (
        <PropertyRowActions
          property={prop}
          onRefresh={fetchProperties}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Property Lifecycle Management"
        subtitle={`Review broker listings, progress properties through statuses, or record exits (${totalItems} total)`}
        actions={
          <button
            type="button"
            onClick={fetchProperties}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200 scrollbar-none text-xs">
        {ALL_STATUSES.map((item) => {
          const isActive = currentStatus === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => updateFilters({ status: item.value || null })}
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

      {/* Filter and Search Bar */}
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
              placeholder="Search by title, location, or keyword..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
            />
          </div>

          {/* City Filter */}
          <div className="w-full sm:w-48">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Filter by city (e.g. Noida)..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>

          {(currentStatus || currentSearch || currentCity) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </form>

      {/* Error state */}
      {error && (
        <AdminErrorState message={error} onRetry={fetchProperties} />
      )}

      {/* Properties DataTable */}
      {!error && (
        <AdminDataTable
          columns={columns}
          rows={properties}
          loading={loading}
          emptyTitle="No properties match your filter"
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => updateFilters({ page: page.toString() })}
        />
      )}
    </div>
  );
}

export default function AdminPropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-gray-500">
          Loading properties...
        </div>
      }
    >
      <AdminPropertiesContent />
    </Suspense>
  );
}

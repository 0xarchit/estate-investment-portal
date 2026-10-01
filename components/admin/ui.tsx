'use client';

import React from 'react';
import {
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PropertyStatus } from '@/lib/api/admin';

// -------------------------------------------------------------
// StatusChip Component
// -------------------------------------------------------------
export interface StatusChipProps {
  status: PropertyStatus | string;
  className?: string;
}

export function AdminStatusChip({ status, className = '' }: StatusChipProps) {
  const normalized = status ? status.toUpperCase() : 'UNKNOWN';

  // Status chip colours per PS & team context:
  // DRAFT grey, PENDING amber, LIVE blue, FUNDED emerald, HOLDING purple, SOLD navy, REJECTED red, CANCELLED slate
  const styleMap: Record<string, { bg: string; text: string; border: string; label: string }> = {
    DRAFT: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      label: 'Draft',
    },
    PENDING_APPROVAL: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: 'Pending Approval',
    },
    LIVE: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      label: 'Live',
    },
    FUNDED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      label: 'Funded',
    },
    HOLDING: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      label: 'Holding',
    },
    SOLD: {
      bg: 'bg-[#0F2A4A]/10',
      text: 'text-[#0F2A4A]',
      border: 'border-[#0F2A4A]/20',
      label: 'Sold',
    },
    REJECTED: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-200',
      label: 'Rejected',
    },
    CANCELLED: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      label: 'Cancelled',
    },
  };

  const current = styleMap[normalized] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{current.label}</span>
    </span>
  );
}

// -------------------------------------------------------------
// StatCard Component
// -------------------------------------------------------------
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'primary' | 'emerald' | 'amber' | 'blue' | 'purple' | 'danger';
  loading?: boolean;
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    );
  }

  const toneClasses = {
    primary: 'bg-[#0F2A4A]/5 text-[#0F2A4A]',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    danger: 'bg-red-50 text-red-600',
  }[tone];

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${toneClasses}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl font-extrabold text-gray-900 font-tabular-nums">
        {value}
      </div>

      {hint && (
        <div className="mt-1.5 text-xs text-gray-500 flex items-center gap-1 font-medium">
          {hint}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// FundingBar Component
// -------------------------------------------------------------
export function AdminFundingBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct || 0));
  const isComplete = clamped >= 100;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-gray-700 font-tabular-nums">
          {clamped.toFixed(1)}% funded
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? 'bg-emerald-600' : 'bg-primary'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PageHeader Component
// -------------------------------------------------------------
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}

// -------------------------------------------------------------
// DataTable Component
// -------------------------------------------------------------
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  onRowClick?: (row: T) => void;
}

export function AdminDataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading = false,
  emptyTitle = 'No records found',
  page = 1,
  totalPages = 1,
  onPageChange,
  sort,
  onSortChange,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-8 text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-12 text-center">
        <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900">{emptyTitle}</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          No entries matched your search or filter parameters. Try resetting filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-700 font-semibold text-xs tracking-wider uppercase">
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';
                return (
                  <th
                    key={col.key}
                    onClick={() => {
                      if (col.sortable && onSortChange) {
                        onSortChange(
                          sort === col.key ? `-${col.key}` : col.key
                        );
                      }
                    }}
                    className={`py-3.5 px-4 ${alignClass} ${
                      col.sortable
                        ? 'cursor-pointer hover:bg-gray-100 select-none transition-colors'
                        : ''
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      <span>{col.header}</span>
                      {col.sortable && sort?.includes(col.key) && (
                        <span className="text-primary font-bold text-xs">
                          {sort.startsWith('-') ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-tabular-nums">
            {rows.map((row, idx) => {
              const rowKey = row._id || row.id || (row as any).userId || idx;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-gray-50/70 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';
                    return (
                      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
                        {col.render
                          ? col.render(row)
                          : (row as any)[col.key] ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// ErrorState Component
// -------------------------------------------------------------
export function AdminErrorState({
  message = 'An unexpected error occurred while loading data.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-8 rounded-xl border border-red-200 bg-red-50/60 text-center space-y-3">
      <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
      <h3 className="text-sm font-semibold text-red-900">Failed to load content</h3>
      <p className="text-xs text-red-700 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Interactive SVG Chart for Funds Raised Over Time (LineAreaChart)
// -------------------------------------------------------------
export function AdminLineAreaChart({
  data,
  height = 200,
}: {
  data: { date: string; amount: number }[];
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 border border-dashed rounded-xl text-xs text-gray-400"
        style={{ height }}
      >
        No historical funding data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const width = 600;
  const paddingX = 40;
  const paddingY = 20;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (d.amount / maxVal) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const pathD = points.reduce(
    (acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`,
    ''
  );
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="adminChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F2A4A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0F2A4A" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        <line
          x1={paddingX}
          y1={paddingY}
          x2={width - paddingX}
          y2={paddingY}
          stroke="#F3F4F6"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Area fill */}
        <path d={areaD} fill="url(#adminChartGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#0F2A4A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#0F2A4A"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      {/* Date labels */}
      <div className="flex justify-between text-[11px] text-gray-400 mt-2 px-2 font-mono">
        <span>{data[0]?.date || 'Start'}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
        <span>{data[data.length - 1]?.date || 'End'}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Status Distribution Bar Chart (BarChartH)
// -------------------------------------------------------------
export function AdminStatusDistributionChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-xl">
        No properties found to visualize.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const statusColorMap: Record<string, string> = {
    DRAFT: 'bg-gray-400',
    PENDING_APPROVAL: 'bg-amber-500',
    LIVE: 'bg-blue-600',
    FUNDED: 'bg-emerald-600',
    HOLDING: 'bg-purple-600',
    SOLD: 'bg-[#0F2A4A]',
    REJECTED: 'bg-red-600',
    CANCELLED: 'bg-slate-400',
  };

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct = (item.count / maxCount) * 100;
        const color = statusColorMap[item.status] || 'bg-primary';
        return (
          <div key={item.status} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700 capitalize">
                {item.status.replace(/_/g, ' ').toLowerCase()}
              </span>
              <span className="font-mono text-gray-500 font-bold">
                {item.count} {item.count === 1 ? 'property' : 'properties'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

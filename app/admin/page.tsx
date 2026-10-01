'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Users,
  CircleDollarSign,
  TrendingUp,
  Landmark,
  FileCheck,
  UserCheck,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import {
  getAdminStats,
  getProperties,
  AdminStats,
  Property,
} from '@/lib/api/admin';
import { formatCompactINR } from '@/components/admin/format';
import {
  AdminStatCard,
  AdminPageHeader,
  AdminErrorState,
  AdminLineAreaChart,
  AdminStatusDistributionChart,
} from '@/components/admin/ui';
import { QueueCard } from '@/components/admin/QueueCard';
import { PropertyRowActions } from '@/components/admin/PropertyRowActions';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats and pending properties concurrently
      const [statsData, pendingData] = await Promise.all([
        getAdminStats(),
        getProperties({ status: 'PENDING_APPROVAL', limit: 3 }).catch(() => ({
          items: [],
          page: 1,
          limit: 3,
          total: 0,
          totalPages: 1,
        })),
      ]);

      setStats(statsData);
      setPendingProperties(pendingData.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch admin dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Admin Overview"
          subtitle="Platform KPIs, approval queues, and financial metrics"
          actions={
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          }
        />
        <AdminErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Admin Overview"
        subtitle="Platform-wide asset valuations, user registrations, and operational queues"
        actions={
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* AUM */}
        <AdminStatCard
          label="Total AUM"
          value={stats ? formatCompactINR(stats.kpis.aum) : '—'}
          hint="Assets under management"
          icon={Landmark}
          tone="primary"
          loading={loading}
        />

        {/* Total Users */}
        <AdminStatCard
          label="Total Users"
          value={stats ? stats.kpis.totalUsers.toLocaleString() : '—'}
          hint={
            stats
              ? `${stats.kpis.usersByRole.INVESTOR || 0} Investors • ${
                  stats.kpis.usersByRole.BROKER || 0
                } Brokers • ${stats.kpis.usersByRole.ADMIN || 0} Admins`
              : 'User breakdown'
          }
          icon={Users}
          tone="blue"
          loading={loading}
        />

        {/* Live Properties */}
        <AdminStatCard
          label="Live Properties"
          value={stats ? stats.kpis.liveProperties : '—'}
          hint="Active in marketplace"
          icon={Building2}
          tone="emerald"
          loading={loading}
        />

        {/* Funds Raised This Month */}
        <AdminStatCard
          label="Funds Raised (Month)"
          value={stats ? formatCompactINR(stats.kpis.fundsRaisedThisMonth) : '—'}
          hint="Current calendar month"
          icon={TrendingUp}
          tone="purple"
          loading={loading}
        />

        {/* Platform Fees Earned */}
        <AdminStatCard
          label="Fees Earned"
          value={stats ? formatCompactINR(stats.kpis.platformFeesEarned) : '—'}
          hint="Collected platform revenue"
          icon={CircleDollarSign}
          tone="amber"
          loading={loading}
        />
      </div>

      {/* Approval Queues Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Operational Approval Queues
          </h2>
          <p className="text-xs text-gray-500">
            Pending items requiring admin compliance verification or approval
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QueueCard
            title="Pending Properties"
            count={stats?.queues.pendingProperties || 0}
            description="Broker submitted listings awaiting due diligence and approval."
            href="/admin/properties?status=PENDING_APPROVAL"
            icon={Building2}
            badgeTone="warning"
          />

          <QueueCard
            title="Pending KYC"
            count={stats?.queues.pendingKyc || 0}
            description="Investor identity and address proof documents for verification."
            href="/admin/kyc"
            icon={FileCheck}
            badgeTone="info"
          />

          <QueueCard
            title="Unapproved Brokers"
            count={stats?.queues.pendingBrokers || 0}
            description="Broker registrations requiring verification before they can list."
            href="/admin/users?role=BROKER"
            icon={UserCheck}
            badgeTone="danger"
          />

          <QueueCard
            title="Pending Withdrawals"
            count={stats?.queues.pendingWithdrawals || 0}
            description="Wallet funds withdrawal requests to verified investor bank accounts."
            href="/admin/withdrawals"
            icon={ArrowDownToLine}
            badgeTone="success"
          />
        </div>
      </div>

      {/* Inline Quick Action: First few pending properties */}
      {pendingProperties.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Quick Review: Pending Property Submissions
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review and approve or reject broker listings directly from your dashboard
              </p>
            </div>
            <a
              href="/admin/properties?status=PENDING_APPROVAL"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all ({stats?.queues.pendingProperties || pendingProperties.length}) &rarr;
            </a>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {pendingProperties.map((property) => (
              <div
                key={property._id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {property.images && property.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {property.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {property.city} • Valuation: {formatCompactINR(property.valuation)} • Broker: {property.broker?.name || 'Broker'}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <PropertyRowActions
                    property={property}
                    onRefresh={loadData}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funds Raised Over Time (LineAreaChart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Funds Raised Over Time
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Daily cumulative investment volume (last 30 days)
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-md text-gray-700 font-mono">
              Last 30 Days
            </span>
          </div>

          <div className="pt-2">
            <AdminLineAreaChart
              data={stats?.charts.fundsRaisedOverTime || []}
              height={220}
            />
          </div>
        </div>

        {/* Properties by Status (BarChartH) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              Properties by Status
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Distribution across lifecycle state machine
            </p>
          </div>

          <div className="pt-2">
            <AdminStatusDistributionChart
              data={stats?.charts.propertiesByStatus || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

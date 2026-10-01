"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatINR, formatCompactINR } from "@/lib/format";
import {
  Wallet,
  TrendingUp,
  PieChart,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPayouts: number;
  roiPct: number;
  walletBalance: number;
  allocation: Array<{ propertyId: string; title: string; amount: number }>;
  recentTransactions: Array<{
    _id: string;
    type: string;
    direction: "CREDIT" | "DEBIT";
    amount: number;
    createdAt: string;
  }>;
}

export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fre_token");
    fetch("/api/v1/portfolio/summary", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSummary(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0F2A4A] border-t-transparent" />
      </div>
    );
  }

  const kycStatus = user?.kyc?.status || "NOT_SUBMITTED";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F2A4A]">
            Welcome back, {user?.name || "Investor"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your real estate portfolio, co-ownership holdings, and wallet funds.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/properties"
            className="px-4 py-2 bg-[#0F2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#0F2A4A]/90 transition-colors flex items-center gap-1.5"
          >
            <span>Explore Properties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KYC Alert if not approved */}
      {kycStatus !== "APPROVED" && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-900">
              <span className="font-bold">Identity Verification:</span> Your KYC status is{" "}
              <strong>{kycStatus}</strong>. Complete verification to unlock co-ownership investments.
            </div>
          </div>
          <Link
            href="/investor/kyc"
            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
          >
            Verify Identity
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Invested</span>
            <PieChart className="w-4 h-4 text-[#0F2A4A]" />
          </div>
          <div className="text-2xl font-bold text-[#0F2A4A]">
            {formatINR(summary?.totalInvested || 0)}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Active co-ownership capital</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Current Portfolio Value</span>
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-bold text-[#10B981]">
            {formatINR(summary?.currentValue || 0)}
          </div>
          <span className="text-xs text-[#10B981] font-semibold mt-1 block">
            ROI: {summary?.roiPct ? `${summary.roiPct.toFixed(1)}%` : "0.0%"}
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Payouts Earned</span>
            <DollarSign className="w-4 h-4 text-[#D4A017]" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {formatINR(summary?.totalPayouts || 0)}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">From exited properties</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Wallet Balance</span>
            <Wallet className="w-4 h-4 text-[#0F2A4A]" />
          </div>
          <div className="text-2xl font-bold text-[#0F2A4A]">
            {formatINR(summary?.walletBalance || 0)}
          </div>
          <Link href="/investor/wallet" className="text-xs text-[#10B981] font-bold mt-1 block hover:underline">
            Manage / Add Funds &rarr;
          </Link>
        </div>
      </div>

      {/* Allocation & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0F2A4A] text-base">Asset Allocation</h3>
            <Link href="/investor/portfolio" className="text-xs text-[#10B981] font-semibold hover:underline">
              View Detailed Portfolio
            </Link>
          </div>

          {!summary?.allocation || summary.allocation.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p>You haven't invested in any properties yet.</p>
              <Link href="/properties" className="mt-3 inline-block font-semibold text-[#0F2A4A] hover:underline">
                Explore live listings
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {summary.allocation.map((item) => (
                <div key={item.propertyId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#0F2A4A]" />
                    <span className="font-semibold text-sm text-slate-800">{item.title}</span>
                  </div>
                  <span className="font-bold text-sm text-[#0F2A4A]">{formatINR(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links Card */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#0F2A4A] text-base mb-3">Quick Actions</h3>
            <div className="space-y-2.5">
              <Link
                href="/properties"
                className="block p-3 rounded-lg border border-border hover:border-[#0F2A4A] hover:bg-slate-50 transition-colors text-sm font-medium text-slate-800"
              >
                Browse Real Estate Marketplace
              </Link>
              <Link
                href="/investor/wallet"
                className="block p-3 rounded-lg border border-border hover:border-[#0F2A4A] hover:bg-slate-50 transition-colors text-sm font-medium text-slate-800"
              >
                Deposit / Withdraw Funds
              </Link>
              <Link
                href="/investor/kyc"
                className="block p-3 rounded-lg border border-border hover:border-[#0F2A4A] hover:bg-slate-50 transition-colors text-sm font-medium text-slate-800"
              >
                KYC Identity Verification
              </Link>
            </div>
          </div>
          <div className="pt-4 mt-6 border-t border-border text-xs text-muted-foreground text-center">
            Fractional Real Estate Platform
          </div>
        </div>
      </div>
    </div>
  );
}


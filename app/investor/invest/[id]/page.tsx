"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatINR } from "@/lib/format";
import toast from "react-hot-toast";
import {
  Building2,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface PropertyData {
  _id: string;
  title: string;
  city: string;
  valuation: number;
  totalUnits: number;
  unitPrice: number;
  minUnits: number;
  maxUnitsPerInvestor: number;
  unitsSold: number;
  remainingUnits: number;
  status: string;
}

export default function InvestCheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [units, setUnits] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    ownershipPct: number;
    amount: number;
    units: number;
    walletBalance: number;
    title: string;
  } | null>(null);

  const fetchPropertyAndWallet = async () => {
    try {
      const token = localStorage.getItem("fre_token");
      const [propRes, walletRes] = await Promise.all([
        fetch(`/api/v1/properties/${id}`),
        fetch("/api/v1/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const propData = await propRes.json();
      const walletData = await walletRes.json();

      if (propData.success && propData.data) {
        setProperty(propData.data);
        setUnits(propData.data.minUnits || 1);
      }
      if (walletData.success && walletData.data?.balance !== undefined) {
        setWalletBalance(walletData.data.balance);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPropertyAndWallet();
    }
  }, [id]);

  if (!property) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0F2A4A] border-t-transparent" />
      </div>
    );
  }

  const amountPaise = units * property.unitPrice;
  const hasSufficientBalance = walletBalance >= amountPaise;
  const isKycApproved = user?.kyc?.status === "APPROVED";
  const ownershipPct = Number(
    property.totalUnits > 0 ? ((units / property.totalUnits) * 100).toFixed(2) : 0
  );
  const balanceAfter = walletBalance - amountPaise;

  const handleInvest = async () => {
    if (!isKycApproved) {
      toast.error("Please complete KYC verification before investing");
      return;
    }

    if (!hasSufficientBalance) {
      toast.error("Insufficient wallet balance. Please add funds.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("fre_token");
      const res = await fetch("/api/v1/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: property._id,
          units,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to complete investment");
      }

      toast.success(data.message || "Investment successful!");
      setSuccessResult({
        ownershipPct: data.data.investment.ownershipPct,
        amount: data.data.investment.amount,
        units: data.data.investment.units,
        walletBalance: data.data.walletBalance,
        title: property.title,
      });
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to process investment");
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl border border-border shadow-sm text-center my-12">
        <div className="w-16 h-16 bg-[#ECFDF5] text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-[#0F2A4A] mb-2">Investment Confirmed!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          You are now a registered fractional co-owner of <strong>{successResult.title}</strong>.
        </p>

        <div className="p-4 bg-slate-50 rounded-xl space-y-3 mb-6 text-sm text-left">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Units Purchased</span>
            <span className="font-bold text-slate-800">{successResult.units} unit(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capital Invested</span>
            <span className="font-bold text-slate-800">{formatINR(successResult.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ownership Stake</span>
            <span className="font-bold text-[#10B981]">{successResult.ownershipPct}%</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="text-muted-foreground">Updated Wallet Balance</span>
            <span className="font-bold text-[#0F2A4A]">{formatINR(successResult.walletBalance)}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/properties"
            className="flex-1 py-2.5 border border-border text-[#0F2A4A] font-semibold rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/investor"
            className="flex-1 py-2.5 bg-[#0F2A4A] text-white font-semibold rounded-lg text-sm hover:bg-[#0F2A4A]/90 transition-colors"
          >
            Investor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/properties/${property._id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0F2A4A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Property Details
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-border shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F2A4A]">Purchase Fractional Shares</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Invest in <strong>{property.title}</strong> ({property.city})
        </p>

        {/* KYC Warning if unapproved */}
        {!isKycApproved && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <span className="font-bold">KYC Verification Required:</span> Your KYC status is{" "}
              <strong>{user?.kyc?.status || "NOT SUBMITTED"}</strong>. You must complete KYC verification before investing.
              <div className="mt-2">
                <Link
                  href="/investor/kyc"
                  className="font-bold underline text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
                >
                  Complete KYC Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Units Selector */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-semibold text-slate-800">
            Select Number of Units to Buy
          </label>

          <div className="flex items-center gap-4">
            <input
              type="number"
              min={property.minUnits}
              max={Math.min(property.remainingUnits, property.maxUnitsPerInvestor)}
              value={units}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setUnits(val);
              }}
              className="w-32 px-3 py-2 border border-border rounded-lg text-lg font-bold text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
            />
            <span className="text-sm text-muted-foreground">
              Min: {property.minUnits} | Available: {property.remainingUnits}
            </span>
          </div>

          <input
            type="range"
            min={property.minUnits}
            max={Math.min(property.remainingUnits, property.maxUnitsPerInvestor)}
            value={units}
            onChange={(e) => setUnits(parseInt(e.target.value, 10))}
            className="w-full accent-[#0F2A4A]"
          />
        </div>

        {/* Live Calculation Table */}
        <div className="p-4 bg-slate-50 rounded-xl space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit Price</span>
            <span className="font-semibold text-slate-800">{formatINR(property.unitPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Investment</span>
            <span className="font-bold text-lg text-[#0F2A4A]">{formatINR(amountPaise)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ownership Stake</span>
            <span className="font-bold text-[#10B981]">{ownershipPct}%</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="text-muted-foreground">Your Wallet Balance</span>
            <span className="font-semibold text-slate-800">{formatINR(walletBalance)}</span>
          </div>
          {hasSufficientBalance ? (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Balance After Investment</span>
              <span className="font-semibold text-slate-700">{formatINR(balanceAfter)}</span>
            </div>
          ) : (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex justify-between items-center">
              <span>Short by {formatINR(amountPaise - walletBalance)}</span>
              <Link href="/investor/wallet" className="font-bold underline">
                Add Funds Now
              </Link>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleInvest}
          disabled={submitting || !hasSufficientBalance || !isKycApproved}
          className={`w-full py-3 rounded-lg text-white font-bold transition-colors ${
            submitting || !hasSufficientBalance || !isKycApproved
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-[#10B981] hover:bg-[#10B981]/90"
          }`}
        >
          {submitting ? "Processing Investment..." : `Confirm & Invest ${formatINR(amountPaise)}`}
        </button>
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatINR, formatCompactINR } from "@/lib/format";
import {
  Building2,
  MapPin,
  Users,
  ShieldCheck,
  TrendingUp,
  Percent,
  Clock,
  ArrowLeft,
  CheckCircle,
  FileText,
} from "lucide-react";

interface PropertyDetail {
  _id: string;
  title: string;
  description: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  areaSqft?: number;
  valuation: number;
  totalUnits: number;
  unitPrice: number;
  minUnits: number;
  maxUnitsPerInvestor: number;
  unitsSold: number;
  expectedAppreciationPct?: number;
  rentalYieldPct?: number;
  holdingPeriodMonths?: number;
  status: string;
  fundingPct: number;
  remainingUnits: number;
  investorCount: number;
  images: Array<{ url: string; name: string }>;
  documents: Array<{ url: string; name: string }>;
  broker?: { _id: string; name: string };
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcUnits, setCalcUnits] = useState(10);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/properties/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProperty(data.data);
          setCalcUnits(data.data.minUnits || 1);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0F2A4A] border-t-transparent" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-[#0F2A4A] mb-2">Property Not Found</h2>
        <p className="text-muted-foreground mb-6">This property listing does not exist or is not publicly accessible.</p>
        <Link href="/properties" className="px-4 py-2 bg-[#0F2A4A] text-white rounded-lg text-sm">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isLive = property.status === "LIVE";
  const isInvestor = user?.role === "INVESTOR";
  const estimatedInvestment = calcUnits * property.unitPrice;
  const estimatedOwnership = Number(
    property.totalUnits > 0 ? ((calcUnits / property.totalUnits) * 100).toFixed(2) : 0
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Top Navbar */}
      <header className="px-6 h-16 border-b border-border flex items-center justify-between bg-white sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/properties"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 font-bold text-lg text-[#0F2A4A]">
            <Building2 className="w-5 h-5 text-[#10B981]" />
            <span>EstatePortal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href={user.role === "ADMIN" ? "/admin" : user.role === "BROKER" ? "/broker" : "/investor"}
              className="text-sm font-medium text-[#0F2A4A] hover:underline"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href={`/login?next=/properties/${property._id}`}
              className="px-4 py-2 bg-[#0F2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#0F2A4A]/90"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {/* Title & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F2A4A]/10 text-[#0F2A4A]">
                {property.type}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isLive ? "bg-[#10B981] text-white" : "bg-blue-600 text-white"
                }`}
              >
                {property.status}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0F2A4A]">{property.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-[#10B981]" />
              {property.address}, {property.city}, {property.state} — {property.pincode}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Total Asset Valuation</span>
            <div className="text-3xl font-extrabold text-[#0F2A4A]">{formatCompactINR(property.valuation)}</div>
          </div>
        </div>

        {/* Media Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 h-96 rounded-2xl overflow-hidden bg-slate-200">
            <img
              src={property.images?.[0]?.url || `https://picsum.photos/seed/${property._id}-1/1200/800`}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="h-44 rounded-2xl overflow-hidden bg-slate-200">
              <img
                src={property.images?.[1]?.url || `https://picsum.photos/seed/${property._id}-2/800/600`}
                alt="Property alternate"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-48 rounded-2xl overflow-hidden bg-slate-200">
              <img
                src={property.images?.[2]?.url || `https://picsum.photos/seed/${property._id}-3/800/600`}
                alt="Property alternate"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white rounded-xl border border-border">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Price / Unit</span>
                <p className="text-lg font-bold text-[#0F2A4A] mt-0.5">{formatINR(property.unitPrice)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium">Expected Return</span>
                <p className="text-lg font-bold text-[#10B981] mt-0.5">{property.expectedAppreciationPct || 12}% p.a.</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium">Rental Yield</span>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{property.rentalYieldPct || 6}% p.a.</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium">Holding Period</span>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{property.holdingPeriodMonths || 36} Mos</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-xl border border-border">
              <h3 className="text-lg font-bold text-[#0F2A4A] mb-3">About this Property</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Return Calculator */}
            <div className="bg-white p-6 rounded-xl border border-border">
              <h3 className="text-lg font-bold text-[#0F2A4A] mb-1">Investment Calculator</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Calculate your projected co-ownership fraction and expected capital appreciation.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>Units to purchase: {calcUnits}</span>
                    <span>Min: {property.minUnits} | Max: {property.maxUnitsPerInvestor}</span>
                  </div>
                  <input
                    type="range"
                    min={property.minUnits || 1}
                    max={Math.min(property.remainingUnits, property.maxUnitsPerInvestor || 100)}
                    value={calcUnits}
                    onChange={(e) => setCalcUnits(parseInt(e.target.value, 10))}
                    className="w-full accent-[#0F2A4A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground">Required Capital</span>
                    <p className="text-xl font-bold text-[#0F2A4A] mt-0.5">{formatINR(estimatedInvestment)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Ownership Stake</span>
                    <p className="text-xl font-bold text-[#10B981] mt-0.5">{estimatedOwnership}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-[#0F2A4A] mb-4">Funding Status</h3>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span className="text-[#10B981]">{property.fundingPct}% Funded</span>
                  <span className="text-slate-600">{property.remainingUnits} units left</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#10B981] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, property.fundingPct)}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>{property.investorCount || 0} co-investors participating</span>
                </div>
              </div>

              {/* Investment Details */}
              <div className="space-y-3 pb-6 border-b border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="font-semibold text-slate-800">{formatINR(property.unitPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Order</span>
                  <span className="font-semibold text-slate-800">{property.minUnits} unit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Ownership Cap</span>
                  <span className="font-semibold text-slate-800">{property.maxUnitsPerInvestor} units</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {!user ? (
                  <Link
                    href={`/login?next=/investor/invest/${property._id}`}
                    className="w-full py-3 bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 text-white font-bold rounded-lg text-center block transition-colors shadow-sm"
                  >
                    Log In to Invest
                  </Link>
                ) : !isInvestor ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs text-center font-medium">
                    You are logged in as {user.role}. Only Investors can purchase property shares.
                  </div>
                ) : !isLive ? (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-200 text-slate-500 font-bold rounded-lg cursor-not-allowed text-center"
                  >
                    Funding Closed
                  </button>
                ) : (
                  <Link
                    href={`/investor/invest/${property._id}`}
                    className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold rounded-lg text-center block transition-colors shadow-sm"
                  >
                    Invest Now / Buy Units
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground bg-white mt-12">
        <p>This is an academic project. No real money or securities are involved.</p>
      </footer>
    </div>
  );
}


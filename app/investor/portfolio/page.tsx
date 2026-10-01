"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatPct } from "@/lib/format";
import { Building2, ArrowRight } from "lucide-react";

interface InvestmentItem {
  propertyId: string;
  property: {
    title: string;
    city: string;
    image?: string;
    status: string;
    unitPrice: number;
    expectedAppreciationPct?: number;
  };
  units: number;
  ownershipPct: number;
  invested: number;
  estimatedValue: number;
  payoutReceived: number;
  roiPct: number;
  status: string;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<InvestmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fre_token");
    fetch("/api/v1/investments/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.items) {
          setItems(data.data.items);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0F2A4A]">My Real Estate Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Detailed breakdown of your co-ownership shares across all properties.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#0F2A4A]">No investments yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            You do not currently own any property shares.
          </p>
          <Link
            href="/properties"
            className="px-5 py-2.5 bg-[#0F2A4A] text-white rounded-lg text-sm font-semibold hover:bg-[#0F2A4A]/90 transition-colors inline-flex items-center gap-2"
          >
            <span>Browse Properties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-3.5 px-6">Property</th>
                  <th className="py-3.5 px-6">Units</th>
                  <th className="py-3.5 px-6">Ownership %</th>
                  <th className="py-3.5 px-6">Invested Amount</th>
                  <th className="py-3.5 px-6">Estimated Value</th>
                  <th className="py-3.5 px-6">Payout Received</th>
                  <th className="py-3.5 px-6">ROI</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((row) => (
                  <tr key={row.propertyId} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <Link href={`/properties/${row.propertyId}`} className="hover:underline">
                        {row.property?.title || "Property"}
                      </Link>
                      <span className="block text-xs text-muted-foreground font-normal">
                        {row.property?.city}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{row.units}</td>
                    <td className="py-4 px-6 text-[#10B981] font-bold">{row.ownershipPct}%</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{formatINR(row.invested)}</td>
                    <td className="py-4 px-6 font-bold text-[#0F2A4A]">{formatINR(row.estimatedValue)}</td>
                    <td className="py-4 px-6 text-slate-700">{formatINR(row.payoutReceived)}</td>
                    <td className="py-4 px-6 font-bold text-[#10B981]">{formatPct(row.roiPct)}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


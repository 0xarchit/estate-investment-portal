"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatCompactINR } from "@/lib/format";
import { Building2, Search, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

interface PropertyItem {
  _id: string;
  title: string;
  description: string;
  type: string;
  address: string;
  city: string;
  valuation: number;
  totalUnits: number;
  unitPrice: number;
  unitsSold: number;
  fundingPct: number;
  remainingUnits: number;
  status: string;
  images: Array<{ url: string; name: string }>;
}

export default function MarketplacePage() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const fetchProperties = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedType) params.append("type", selectedType);
    if (selectedCity) params.append("city", selectedCity);

    fetch(`/api/v1/properties?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.items) {
          setProperties(data.data.items);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProperties();
  }, [selectedType, selectedCity]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header */}
      <header className="px-6 h-16 border-b border-border flex items-center justify-between bg-white sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#0F2A4A]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981] text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <span>EstatePortal</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted/50 transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-[#0F2A4A] text-white rounded-lg hover:bg-[#0F2A4A]/90 transition-colors">
            Sign up
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0F2A4A]">Property Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse legally verified, fractionalized real estate assets open for co-ownership.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by property title or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProperties()}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
            >
              <option value="">All Types</option>
              <option value="APARTMENT">Apartment</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="VILLA">Villa</option>
              <option value="PLOT">Plot</option>
              <option value="WAREHOUSE">Warehouse</option>
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
            >
              <option value="">All Cities</option>
              <option value="Noida">Noida</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Gurugram">Gurugram</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
            </select>

            <button
              onClick={fetchProperties}
              className="px-4 py-2 bg-[#0F2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#0F2A4A]/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-border p-4 h-80 animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#0F2A4A]">No properties found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search criteria or clearing filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const imgUrl =
                property.images?.[0]?.url ||
                `https://picsum.photos/seed/${property._id}/800/600`;

              return (
                <div
                  key={property._id}
                  className="bg-white rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#0F2A4A]/80 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase">
                      {property.type}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          property.status === "LIVE"
                            ? "bg-[#10B981] text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {property.status}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>{property.city}, {property.address}</span>
                      </div>
                      <h2 className="font-bold text-lg text-[#0F2A4A] line-clamp-1">
                        {property.title}
                      </h2>
                    </div>

                    <div className="my-4 pt-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price / Unit</span>
                        <span className="font-bold text-[#0F2A4A]">{formatINR(property.unitPrice)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Asset Valuation</span>
                        <span className="font-semibold text-slate-700">{formatCompactINR(property.valuation)}</span>
                      </div>

                      {/* Funding Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-600">
                            {property.fundingPct}% Funded
                          </span>
                          <span className="text-muted-foreground">
                            {property.remainingUnits} units left
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#10B981] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, property.fundingPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/properties/${property._id}`}
                      className="w-full py-2.5 bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>View & Invest</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Academic Disclaimer Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground bg-white">
        <p>This is an academic project. No real money or securities are involved.</p>
      </footer>
    </div>
  );
}


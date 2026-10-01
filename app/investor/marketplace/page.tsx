"use client";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared";
import { MarketplaceBrowser } from "@/components/property/MarketplaceBrowser";
export default function InvestorMarketplacePage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Marketplace"
        subtitle="Browse live opportunities and invest from your workspace."
      />
      <Suspense fallback={<PageSkeleton />}>
        <MarketplaceBrowser basePath="/investor/marketplace" />
      </Suspense>
    </div>
  );
}

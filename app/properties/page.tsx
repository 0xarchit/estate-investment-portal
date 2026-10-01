"use client";
import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageSkeleton } from "@/components/shared";
import { MarketplaceBrowser } from "@/components/property/MarketplaceBrowser";
export default function MarketplacePage() {
  return (
    <PublicLayout>
      <div className="bg-white border-b">
        <div className="site-width py-12 md:py-16">
          <p className="eyebrow text-emerald-700 mb-4">The marketplace</p>
          <h1 className="text-4xl md:text-5xl font-heading font-semibold tracking-tight text-navy">
            Your next chapter.
            <br className="sm:hidden" /> A real place.
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-4 max-w-xl leading-7">
            Explore properties. Compare the possibilities. Find an investment
            that fits your plans.
          </p>
        </div>
      </div>
      <div className="site-width">
        <Suspense
          fallback={
            <div className="py-12">
              <PageSkeleton />
            </div>
          }
        >
          <MarketplaceBrowser basePath="/properties" />
        </Suspense>
      </div>
    </PublicLayout>
  );
}

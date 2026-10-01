"use client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PropertyDetailView } from "@/components/property/PropertyDetailView";
export default function PropertyDetailPage() {
  return (
    <PublicLayout>
      <div className="site-width">
        <PropertyDetailView backHref="/properties" />
      </div>
    </PublicLayout>
  );
}

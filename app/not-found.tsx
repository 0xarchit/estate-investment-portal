import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/shared/EmptyState";
export default function NotFound() {
  return (
    <PublicLayout>
      <div className="site-width py-20">
        <h1 className="sr-only">Page not found</h1>
        <EmptyState
          title="A little off the map"
          description="We couldn’t find that page. Let’s get you back to exploring."
          action={
            <Link href="/properties" className="btn">
              Back to marketplace
            </Link>
          }
        />
      </div>
    </PublicLayout>
  );
}

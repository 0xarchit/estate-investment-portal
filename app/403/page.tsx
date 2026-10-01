import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyState } from "@/components/shared/EmptyState";
export default function Forbidden() {
  return (
    <PublicLayout>
      <div className="site-width py-20">
        <h1 className="sr-only">Access denied</h1>
        <EmptyState
          title="You don’t have access"
          description="Your account does not have permission to view this page."
          action={
            <Link href="/" className="btn">
              Back to home
            </Link>
          }
        />
      </div>
    </PublicLayout>
  );
}

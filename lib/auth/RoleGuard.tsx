'use client';

/**
 * P5 owns this file.
 * RoleGuard, GuestOnly, roleHome — exact §9 contract.
 * Everyone's layout.tsx imports from here.
 */

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { resolveLoginRedirect } from './login-redirect';

type Role = 'ADMIN' | 'BROKER' | 'INVESTOR';

// ── roleHome ───────────────────────────────────────────────────────────────

export function roleHome(role: Role | string): '/admin' | '/broker' | '/investor' {
  if (role === 'ADMIN') return '/admin';
  if (role === 'BROKER') return '/broker';
  return '/investor';
}

// ── RoleGuard ──────────────────────────────────────────────────────────────

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
}

/**
 * While loading → show skeleton.
 * No user       → redirect to /login?next=<current path>
 * Wrong role    → redirect to /403
 * Deactivated   → handled by the api client (401 clears token → /login)
 */
export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!roles.includes(user.role as Role)) {
      router.replace('/403');
    }
  }, [loading, user, roles, router, pathname]);

  if (loading) {
    return <RoleGuardSkeleton />;
  }

  if (!user || !roles.includes(user.role as Role)) {
    // Render nothing while redirect happens
    return <RoleGuardSkeleton />;
  }

  return <>{children}</>;
}

// ── GuestOnly ──────────────────────────────────────────────────────────────

/**
 * Redirects already-logged-in users to their role home.
 * Wrap login/signup pages with this.
 */
export function GuestOnly({ children, nextPath }: { children: React.ReactNode; nextPath?: string | null }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(resolveLoginRedirect(nextPath, user.role));
    }
  }, [loading, user, router, nextPath]);

  if (loading) return <RoleGuardSkeleton />;
  if (user) return null;

  return <>{children}</>;
}

// ── Skeleton used while auth resolves ─────────────────────────────────────

function RoleGuardSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
        <p className="text-sm text-[#6B7280]">Loading…</p>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'login' | 'signup';
}

/**
 * Shared card wrapper used by login, signup, forgot-password pages.
 */
export function AuthCard({ title, subtitle, children, variant }: Props) {
  return (
    <main id="main-content" tabIndex={-1} className={`flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-12${variant ? ` ${variant}-page auth-polished` : ''}`}>
      <div className="auth-card w-full max-w-md rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-black/5">
        {/* Brand mark */}
        <Link href="/" aria-label="Go to EstatePortal home" className="mb-6 inline-flex items-center gap-2 rounded-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F2A4A]">
            <span className="text-xs font-bold text-[#10B981]">FRE</span>
          </div>
          <span className="text-sm font-semibold text-[#0F2A4A]">
            Fractional Real Estate
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
        )}

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

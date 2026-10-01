'use client';

import React from 'react';
import { RoleGuard } from '@/lib/auth/RoleGuard';
import { brokerNav, type NavItem } from '@/components/broker/nav';

// ── Fallback layout until P3 pushes DashboardLayout ───────────────────────
// Once P3 merges components/layout/DashboardLayout.tsx, replace this entire
// FallbackLayout block with:
//   import { DashboardLayout } from '@/components/layout/DashboardLayout';

function FallbackDashboardLayout({
  nav,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col bg-[#0F2A4A] md:flex">
        <div className="flex h-16 items-center gap-2 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#10B981]">
            <span className="text-[10px] font-bold text-white">FRE</span>
          </div>
          <span className="text-sm font-semibold text-white">{roleLabel}</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              {item.icon && <item.icon size={16} />}
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-4">
          <p className="text-[10px] text-white/30">
            This is an academic project. No real money or securities are involved.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <span className="font-semibold text-[#0F2A4A]">{roleLabel} Portal</span>
          <div className="flex items-center gap-3">
            <a
              href="/profile"
              className="text-sm text-[#6B7280] hover:text-[#111827]"
            >
              Profile
            </a>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

// ── Broker layout ──────────────────────────────────────────────────────────

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard roles={['BROKER']}>
      <FallbackDashboardLayout nav={brokerNav} roleLabel="Broker">
        {children}
      </FallbackDashboardLayout>
    </RoleGuard>
  );
}

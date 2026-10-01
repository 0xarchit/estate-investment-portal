"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { LucideIcon, Wallet, LogOut, User as UserIcon, Building2, Menu, X } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface DashboardLayoutProps {
  nav: NavItem[];
  roleLabel: string;
  children: React.ReactNode;
}

export function DashboardLayout({ nav, roleLabel, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === "INVESTOR") {
      fetch("/api/v1/wallet", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("fre_token") || ""}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.balance !== undefined) {
            setWalletBalance(data.data.balance);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#0F2A4A] text-white transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-0 max-md:-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981] text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <span>EstatePortal</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <span className="text-xs uppercase tracking-wider text-white/50 font-semibold">
            {roleLabel} Portal
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
          {nav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#10B981] text-white shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[11px] text-white/40 leading-relaxed text-center">
            This is an academic project. No real money or securities are involved.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-[#6B7280] hover:text-[#111827]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-[#0F2A4A] hidden sm:block">
              {roleLabel} Workspace
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user?.role === "INVESTOR" && walletBalance !== null && (
              <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-full text-xs font-semibold text-[#065F46]">
                <Wallet className="w-3.5 h-3.5 text-[#10B981]" />
                <span>{formatINR(walletBalance)}</span>
              </div>
            )}

            <div className="flex items-center gap-3 border-l border-[#E5E7EB] pl-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-[#374151] hover:text-[#0F2A4A]"
              >
                <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#0F2A4A] font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <span className="hidden md:inline font-medium">{user?.name || "My Account"}</span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

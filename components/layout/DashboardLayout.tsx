"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  LucideIcon,
  Wallet,
  Menu,
  Bell,
  LogOut,
  UserRound,
  ArrowUpRight,
  Building2,
} from "lucide-react";
import { Brand } from "./PublicLayout";
import { getWallet } from "@/lib/api/wallet";
import {
  getNotifications,
  markNotificationRead,
} from "@/lib/api/notifications";
import { formatINR } from "@/lib/format";
import { Modal } from "@/components/shared/Modal";
import toast from "react-hot-toast";
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
export function DashboardLayout({
  nav,
  roleLabel,
  children,
}: DashboardLayoutProps) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  const qc = useQueryClient();
  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
    enabled: user?.role === "INVESTOR",
  });
  const notices = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!user,
  });
  const active = nav
    .filter((n) => path === n.href || path.startsWith(n.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const navigation = (
    <nav className="space-y-1" aria-label={`${roleLabel} navigation`}>
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          title={label}
          onClick={() => setMobile(false)}
          aria-current={active?.href === href ? "page" : undefined}
          className={`workspace-link flex gap-3 items-center px-4 py-3 rounded-lg text-sm ${active?.href === href ? "bg-emerald-800 text-white border-l-2 border-emerald-300" : "text-slate-300 hover:bg-white/10"}`}
        >
          {Icon && <Icon size={19} />}
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen md:pl-20 lg:pl-64">
      <aside className="workspace-sidebar hidden md:flex fixed inset-y-0 left-0 w-20 lg:w-64 bg-navy flex-col p-3 lg:p-5 z-30">
        <div className="py-5 hidden lg:block">
          <Brand light />
        </div>
        <Link
          href="/"
          aria-label="EstatePortal home"
          className="lg:hidden flex justify-center py-5 text-gold-400"
        >
          <Building2 size={26} />
        </Link>
        <p className="eyebrow text-slate-400 mb-5 mt-8 hidden lg:block">
          {roleLabel} workspace
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5">{navigation}</div>
        <div className="mt-auto border-t border-white/15 pt-6 hidden lg:block">
          <Link
            href="/properties"
            className="flex justify-between text-sm text-slate-200"
          >
            Explore opportunities <ArrowUpRight size={18} />
          </Link>
          <p className="text-xs text-slate-300 leading-6 mt-6">
            This is an academic project. No real money or securities are
            involved.
          </p>
        </div>
      </aside>
      <header className="sticky top-0 z-20 h-20 border-b bg-white px-4 md:px-8 flex justify-between items-center gap-3">
        <div className="flex gap-3 items-center">
          <button
            className="icon-button md:hidden"
            aria-label="Open workspace navigation"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <span className="text-sm font-medium hidden sm:block text-slate-600">
            {active?.label ?? `${roleLabel} workspace`}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-5">
          {user?.role === "INVESTOR" && (
            <Link
              href="/investor/wallet"
              className="text-xs md:text-sm flex items-center gap-2 bg-navy-50 text-navy rounded-lg px-3 py-2"
            >
              <Wallet size={16} />
              {wallet.data
                ? formatINR(wallet.data.balance)
                : wallet.isError
                  ? "Wallet unavailable"
                  : "Loading…"}
            </Link>
          )}
          <details className="relative">
            <summary
              className="icon-button list-none cursor-pointer"
              aria-label={`Notifications, ${notices.data?.unreadCount ?? 0} unread`}
            >
              <Bell size={20} />
              {!!notices.data?.unreadCount && (
                <span className="absolute right-0 top-0 bg-emerald-700 text-white text-[10px] px-1.5 rounded-full">
                  {notices.data.unreadCount}
                </span>
              )}
            </summary>
            <div className="workspace-popover absolute right-0 top-14 w-72 max-w-[85vw] panel shadow-xl z-40">
              <h2 className="font-semibold mb-3">Notifications</h2>
              {notices.isError ? (
                <p className="text-sm">Notifications are unavailable.</p>
              ) : notices.isLoading ? (
                <p className="text-sm">Loading notifications…</p>
              ) : !notices.data?.items.length ? (
                <p className="text-sm text-muted-foreground">
                  You’re all caught up.
                </p>
              ) : (
                notices.data.items.slice(0, 4).map((n) => (
                  <Link
                    key={n._id}
                    href={
                      n.link?.startsWith("/") && !n.link.startsWith("//")
                        ? n.link
                        : "/notifications"
                    }
                    className="block py-3 text-sm border-b"
                    onClick={() => {
                      if (!n.read)
                        markNotificationRead(n._id)
                          .then(() =>
                            qc.invalidateQueries({
                              queryKey: ["notifications"],
                            }),
                          )
                          .catch(() =>
                            toast.error("Could not mark notification as read"),
                          );
                    }}
                  >
                    <span className={!n.read ? "font-semibold" : ""}>
                      {n.title}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.body}
                    </p>
                  </Link>
                ))
              )}
              <Link
                href="/notifications"
                className="text-sm font-semibold text-emerald-700 block mt-4"
              >
                View all notifications →
              </Link>
            </div>
          </details>
          <details className="relative">
            <summary
              className="list-none cursor-pointer rounded-full w-10 h-10 flex items-center justify-center bg-navy text-white text-sm font-semibold"
              aria-label="Account menu"
            >
              {user?.name?.charAt(0) ?? "A"}
            </summary>
            <div className="workspace-popover absolute right-0 top-14 w-52 panel shadow-xl z-40 p-3">
              <p className="p-2 text-sm font-semibold truncate">{user?.name}</p>
              <Link href="/profile" className="flex gap-2 p-2 text-sm">
                <UserRound size={16} /> Profile
              </Link>
              <button
                onClick={logout}
                className="flex gap-2 p-2 text-sm text-red-700"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </details>
        </div>
      </header>
      <main
        id="main-content"
        className="p-5 md:p-8 max-w-[1440px] mx-auto pb-24 min-w-0"
      >
        {children}
      </main>
      <div className="lg:hidden px-5 pb-24 text-xs text-muted-foreground">
        This is an academic project. No real money or securities are involved.
      </div>
      <nav
        aria-label="Quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t z-30 grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]"
      >
        {nav.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active?.href === href ? "page" : undefined}
            className={`flex flex-col gap-1 items-center justify-center min-h-16 px-1 text-[10px] ${active?.href === href ? "text-emerald-800 font-semibold" : "text-slate-600"}`}
          >
            {Icon && <Icon size={20} />}
            <span>{label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMobile(true)}
          className="flex flex-col gap-1 items-center justify-center min-h-16 text-[10px] text-slate-600"
        >
          <Menu size={20} />
          More
        </button>
      </nav>
      <Modal
        open={mobile}
        title={`${roleLabel} workspace`}
        onClose={() => setMobile(false)}
      >
        <div className="max-h-[65dvh] overflow-y-auto overscroll-contain bg-navy p-3 rounded-xl">{navigation}</div>
      </Modal>
    </div>
  );
}

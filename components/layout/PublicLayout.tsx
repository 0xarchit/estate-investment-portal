"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, Menu, X, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleHome } from "@/lib/auth/RoleGuard";
import { usePathname } from "next/navigation";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="EstatePortal home"
      className={`inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight ${light ? "text-white" : "text-navy"}`}
    >
      <span className="flex h-9 w-9 items-center justify-center border border-gold-500 rounded-lg text-gold-500">
        <Building2 size={21} />
      </span>
      Estate<span className="font-normal -ml-2">Portal</span>
    </Link>
  );
}
export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="site-width h-[76px] flex items-center justify-between">
          <Brand />
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium"
          >
            {[
              ["/", "Home"],
              ["/properties", "Properties"],
              ["/#how-it-works", "How it works"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`py-7 border-b-2 ${pathname === href ? "border-emerald-700 text-navy" : "border-transparent text-slate-600 hover:text-navy"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <Link className="btn" href={roleHome(user.role)}>
                My dashboard <ArrowUpRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-navy">
                  Log in
                </Link>
                <Link href="/signup" className="btn">
                  Get started <ArrowUpRight size={16} />
                </Link>
              </>
            )}
          </div>
          <button
            className="icon-button md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav
            className="p-5 border-t grid gap-2 md:hidden"
            aria-label="Mobile navigation"
          >
            {[
              ["/", "Home"],
              ["/properties", "Properties"],
              ["/#how-it-works", "How it works"],
              [
                user ? roleHome(user.role) : "/login",
                user ? "My dashboard" : "Log in",
              ],
              ...(!user ? [["/signup", "Get started"]] : []),
            ].map(([href, label]) => (
              <Link
                className="py-3"
                onClick={() => setOpen(false)}
                key={href}
                href={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main id="main-content">{children}</main>
      <footer className="bg-navy text-white mt-20">
        <div className="site-width py-14">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Brand light />
              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
                A more accessible way to explore property ownership. Real
                assets. Clear information. Your next chapter.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Explore</h3>
              <div className="flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/properties">Marketplace</Link>
                <Link href="/#how-it-works">How it works</Link>
                <Link href="/#faq">Questions & answers</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Your account</h3>
              <div className="flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/signup">Create account</Link>
                <Link href="/login">Log in</Link>
                <Link href="/investor/portfolio">Your portfolio</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/15 mt-10 pt-6 text-xs text-slate-300 leading-6">
            <p>
              This is an academic project. No real money or securities are
              involved.
            </p>
            <p>
              Real-estate investments carry risk. Past returns don’t guarantee
              future results.
            </p>
            <p className="mt-3">© {new Date().getFullYear()} EstatePortal</p>
          </div>
        </div>
      </footer>
    </>
  );
}

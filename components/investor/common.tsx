"use client";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatINR, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/api/wallet";
export function errorMessage(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "Something went wrong. Please try again.";
}
export function KycBanner() {
  const { user } = useAuth();
  const status = user?.kyc?.status ?? "NOT_SUBMITTED";
  if (status === "APPROVED") return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">
            {status === "PENDING"
              ? "Your identity verification is under review"
              : status === "REJECTED"
                ? "Please update your identity documents"
                : "Complete KYC to start investing"}
          </p>
          <p className="mt-1 text-sm">
            {status === "REJECTED"
              ? user?.kyc?.reason
              : "Verify your identity before making your first investment. Dummy documents only."}
          </p>
        </div>
      </div>
      <Link className="btn-secondary" href="/investor/kyc">
        {status === "PENDING" ? "View status" : "Complete KYC"}
      </Link>
    </div>
  );
}
export function TransactionList({ items }: { items: Transaction[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((tx) => (
        <li
          key={tx._id}
          className="flex items-center justify-between gap-4 py-4"
        >
          <div className="flex items-center gap-3">
            {tx.direction === "CREDIT" ? (
              <ArrowDownLeft className="h-5 w-5 text-emerald-700" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-slate-500" />
            )}
            <div>
              <p className="text-sm font-semibold capitalize">
                {tx.type.toLowerCase().replaceAll("_", " ")}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(tx.createdAt)} ·{" "}
                {tx.direction === "CREDIT" ? "Credit" : "Debit"}
              </p>
            </div>
          </div>
          <span
            className={`whitespace-nowrap font-semibold tabular-nums ${tx.direction === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}
          >
            {tx.direction === "CREDIT" ? "+" : "−"}
            {formatINR(tx.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
export function VerifiedNote() {
  return (
    <p className="flex items-center gap-2 text-sm text-emerald-800">
      <ShieldCheck className="h-4 w-4" />
      KYC verified
    </p>
  );
}

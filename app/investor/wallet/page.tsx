"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/format";
import toast from "react-hot-toast";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface TransactionItem {
  _id: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [topupAmount, setTopupAmount] = useState<string>("50000"); // ₹500 in paise: 50000
  const [isTopupLoading, setIsTopupLoading] = useState(false);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("fre_token");
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/v1/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/v1/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const walletData = await walletRes.json();
      const txData = await txRes.json();

      if (walletData.success && walletData.data?.balance !== undefined) {
        setBalance(walletData.data.balance);
      }
      if (txData.success && txData.data?.items) {
        setTransactions(txData.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleMockTopup = async () => {
    const rupees = parseFloat(topupAmount);
    if (isNaN(rupees) || rupees <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amountPaise = Math.round(rupees * 100);
    setIsTopupLoading(true);
    try {
      const token = localStorage.getItem("fre_token");

      // 1. Create topup order
      const orderRes = await fetch("/api/v1/wallet/topup/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountPaise }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error?.message || "Failed to create payment order");
      }

      const { orderId, mockPayment } = orderData.data;

      // 2. Verify payment instantly with mock signature
      const verifyRes = await fetch("/api/v1/wallet/topup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          paymentId: mockPayment.paymentId,
          signature: mockPayment.signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error?.message || "Payment verification failed");
      }

      toast.success(`Successfully added ${formatINR(amountPaise)} to your wallet!`);
      await fetchWalletData();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete topup");
    } finally {
      setIsTopupLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0F2A4A]">Investor Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add funds via simulated payment gateway and manage your transaction history.
        </p>
      </div>

      {/* Balance Card & Quick Top-Up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-[#0F2A4A] text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-1">
              <Wallet className="w-4 h-4 text-[#10B981]" />
              <span>Available Balance</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-2">
              {formatINR(balance)}
            </div>
            <p className="text-xs text-white/50 mt-2">
              All transactions backed by immutable double-entry ledger.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/60">
            TEST MODE: Real money is not involved.
          </div>
        </div>

        {/* Top-Up Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#0F2A4A] text-base mb-1">Add Funds (Mock Gateway)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter amount in Rupees. Funds will be credited directly to your account.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {["1000", "5000", "25000", "100000"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTopupAmount(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    topupAmount === preset
                      ? "bg-[#0F2A4A] text-white border-[#0F2A4A]"
                      : "border-border text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  ₹{Number(preset).toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                placeholder="Enter amount in ₹"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-base font-bold text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleMockTopup}
              disabled={isTopupLoading}
              className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isTopupLoading ? "Processing Mock Payment..." : "Instant Top-Up"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-[#0F2A4A] text-base">Ledger Transaction History</h3>
          <span className="text-xs text-muted-foreground">{transactions.length} records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No transactions yet. Add funds to see activity here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Direction</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Balance After</th>
                  <th className="py-3 px-6">Note</th>
                  <th className="py-3 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => {
                  const isCredit = tx.direction === "CREDIT";
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 font-semibold text-slate-800">
                        {tx.type}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            isCredit
                              ? "bg-emerald-50 text-[#10B981]"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {tx.direction}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {isCredit ? "+" : "-"}
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {formatINR(tx.balanceAfter)}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-muted-foreground">
                        {tx.note || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


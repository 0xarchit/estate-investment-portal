"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  getWallet,
  getTransactions,
  getWithdrawals,
  createTopupOrder,
  verifyTopup,
  requestWithdrawal,
  type TopupOrder,
} from "@/lib/api/wallet";
import { formatINR, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusChip } from "@/components/shared/StatusChip";
import { Pagination } from "@/components/shared/Pagination";
import { Modal } from "@/components/shared/Modal";
import { errorMessage } from "@/components/investor/common";
const bankSchema = z.object({
  accountName: z.string().trim().min(2, "Enter the account holder name."),
  accountNumber: z
    .string()
    .regex(/^\d{9,18}$/, "Use a dummy account number of 9–18 digits."),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      "Enter a valid IFSC format, such as DEMO0123456.",
    ),
});
export default function WalletPage() {
  const client = useQueryClient();
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet });
  const [page, setPage] = useState(1);
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const invalidDates = !!from && !!to && from > to;
  const filters: Record<string, string | number> = {
    page,
    limit: 10,
    ...(type ? { type } : {}),
    ...(direction ? { direction } : {}),
    ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}),
    ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
  };
  const ledger = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
    enabled: !invalidDates,
  });
  const withdrawals = useQuery({
    queryKey: ["withdrawals", withdrawPage],
    queryFn: () => getWithdrawals(withdrawPage),
  });
  const [modal, setModal] = useState<"topup" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("10000");
  const [order, setOrder] = useState<TopupOrder | null>(null);
  const [issue, setIssue] = useState("");
  const [bank, setBank] = useState({
    accountName: "",
    accountNumber: "",
    ifsc: "",
  });
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("amount");
    if (value && Number.isFinite(Number(value)) && Number(value) > 0) {
      setAmount(String(Math.max(100, Math.ceil(Number(value)))));
      setModal("topup");
    }
  }, []);
  const balance = wallet.data?.balance ?? 0;
  async function refreshMoney() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["wallet"] }),
      client.invalidateQueries({ queryKey: ["transactions"] }),
      client.invalidateQueries({ queryKey: ["portfolio"] }),
      client.invalidateQueries({ queryKey: ["withdrawals"] }),
    ]);
  }
  const makeOrder = useMutation({
    mutationFn: (paise: number) => createTopupOrder(paise),
    onSuccess: setOrder,
    onError: (error) => setIssue(errorMessage(error)),
  });
  const payment = useMutation({
    mutationFn: () =>
      verifyTopup({ orderId: order!.orderId, ...order!.mockPayment }),
    onSuccess: async () => {
      setModal(null);
      setOrder(null);
      toast.success("Demo funds added to your wallet.");
      await refreshMoney();
    },
    onError: async (error) => {
      setIssue(errorMessage(error));
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "DUPLICATE_PAYMENT"
      )
        await refreshMoney();
    },
  });
  const withdrawal = useMutation({
    mutationFn: (paise: number) =>
      requestWithdrawal({ amount: paise, bankDetails: bankSchema.parse(bank) }),
    onSuccess: async () => {
      setModal(null);
      toast.success("Withdrawal requested. An administrator will review it.");
      await refreshMoney();
    },
    onError: (error) => setIssue(errorMessage(error)),
  });
  const pending =
    makeOrder.isPending || payment.isPending || withdrawal.isPending;
  function open(kind: "topup" | "withdraw") {
    setIssue("");
    setOrder(null);
    setAmount(kind === "topup" ? "10000" : "");
    setModal(kind);
  }
  function submit() {
    if (pending) return;
    setIssue("");
    const rupees = Number(amount);
    const paise = Math.round(rupees * 100);
    if (
      !amount ||
      !Number.isFinite(rupees) ||
      !Number.isSafeInteger(paise) ||
      paise <= 0 ||
      Math.abs(rupees * 100 - paise) > 0.0001
    ) {
      setIssue("Enter a positive amount with at most two decimal places.");
      return;
    }
    if (modal === "topup") {
      if (paise < 10000 || paise > 100000000) {
        setIssue("Add between ₹100 and ₹10,00,000 per transaction.");
        return;
      }
      makeOrder.mutate(paise);
    } else {
      if (paise > balance) {
        setIssue("This amount exceeds your available balance.");
        return;
      }
      const parsed = bankSchema.safeParse(bank);
      if (!parsed.success) {
        setIssue(parsed.error.issues[0].message);
        return;
      }
      withdrawal.mutate(paise);
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        title="Your wallet"
        subtitle="A transparent record of every rupee."
      />
      {wallet.isPending ? (
        <PageSkeleton />
      ) : wallet.isError ? (
        <ErrorState
          message={errorMessage(wallet.error)}
          onRetry={() => wallet.refetch()}
        />
      ) : (
        <section className="rounded-2xl bg-[#0F2A4A] p-6 text-white sm:p-8">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <WalletIcon className="h-5 w-5" />
            Available balance
          </div>
          <p className="mt-4 break-words text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatINR(balance)}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0F2A4A] hover:bg-slate-100"
              onClick={() => open("topup")}
            >
              + Add money
            </button>
            <button
              className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              disabled={balance <= 0}
              onClick={() => open("withdraw")}
            >
              Request withdrawal
            </button>
          </div>
          <p className="mt-5 text-xs text-slate-300">
            TEST MODE — no real money. Withdrawals are debited only after
            approval.
          </p>
        </section>
      )}
      <section className="panel p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Transaction ledger</h2>
        <p className="mt-1 text-sm text-slate-500">
          Deposits, investments and payouts, all in one place.
        </p>
        <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            Type
            <select
              className="field mt-1"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All types</option>
              {[
                "TOPUP",
                "INVESTMENT",
                "PAYOUT",
                "REFUND",
                "WITHDRAWAL",
                "COMMISSION",
                "FEE",
              ].map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0) + v.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Direction
            <select
              className="field mt-1"
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Credits & debits</option>
              <option value="CREDIT">Credits</option>
              <option value="DEBIT">Debits</option>
            </select>
          </label>
          <label className="text-sm">
            From
            <input
              className="field mt-1"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="text-sm">
            To
            <input
              className="field mt-1"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        {invalidDates ? (
          <p role="alert" className="text-sm text-red-700">
            End date must be on or after the start date.
          </p>
        ) : ledger.isPending ? (
          <PageSkeleton />
        ) : ledger.isError ? (
          <ErrorState
            message={errorMessage(ledger.error)}
            onRetry={() => ledger.refetch()}
          />
        ) : ledger.data.items.length ? (
          <>
            <div className="table-wrap">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Date",
                      "Type",
                      "Amount",
                      "Balance after",
                      "Reference",
                    ].map((label) => (
                      <th className="px-3 py-4" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.data.items.map((tx) => (
                    <tr key={tx._id} className="border-b border-slate-100">
                      <td
                        data-label="Date"
                        className="px-3 py-4 whitespace-nowrap"
                      >
                        {formatDate(tx.createdAt)}
                      </td>
                      <td data-label="Type" className="px-3 py-4">
                        <StatusChip status={tx.type} />
                      </td>
                      <td data-label="Amount" className="px-3 py-4">
                        <div>
                          <span
                            className={`flex items-center gap-1 whitespace-nowrap font-semibold ${tx.direction === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {tx.direction === "CREDIT" ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                            {tx.direction === "CREDIT" ? "+" : "−"}
                            {formatINR(tx.amount)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {tx.direction === "CREDIT" ? "Credit" : "Debit"}
                          </span>
                        </div>
                      </td>
                      <td
                        data-label="Balance after"
                        className="px-3 py-4 whitespace-nowrap tabular-nums"
                      >
                        {formatINR(tx.balanceAfter)}
                      </td>
                      <td
                        data-label="Reference"
                        className="break-all px-3 py-4 text-xs text-slate-500"
                      >
                        {tx.refId ?? tx._id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={ledger.data.totalPages}
              onChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No transactions yet"
            description={
              type || direction || from || to
                ? "No activity matches these filters."
                : "Add demo funds to get started."
            }
          />
        )}
      </section>
      <section className="panel p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Withdrawal requests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pending requests do not reserve funds.
        </p>
        {withdrawals.isPending ? (
          <PageSkeleton />
        ) : withdrawals.isError ? (
          <ErrorState
            message={errorMessage(withdrawals.error)}
            onRetry={() => withdrawals.refetch()}
          />
        ) : withdrawals.data.items.length ? (
          <>
            <ul className="mt-4 divide-y divide-slate-100">
              {withdrawals.data.items.map((item) => (
                <li
                  key={item._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="font-semibold">{formatINR(item.amount)}</p>
                    <p className="text-xs text-slate-500">
                      Requested {formatDate(item.createdAt)}
                    </p>
                    {item.reason && (
                      <p className="mt-1 text-sm text-red-700">{item.reason}</p>
                    )}
                  </div>
                  <StatusChip status={item.status} />
                </li>
              ))}
            </ul>
            <Pagination
              page={withdrawPage}
              totalPages={withdrawals.data.totalPages}
              onChange={setWithdrawPage}
            />
          </>
        ) : (
          <EmptyState title="No withdrawal requests" />
        )}
      </section>
      <Modal
        open={modal !== null}
        title={modal === "topup" ? "Add demo funds" : "Request a withdrawal"}
        onClose={() => {
          setModal(null);
          setOrder(null);
        }}
        loading={pending}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (order) {
              if (!pending) payment.mutate();
            } else submit();
          }}
        >
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
            TEST MODE — no real money. Use dummy bank details only.
          </div>
          {order ? (
            <>
              <p className="text-sm text-slate-500">
                Mock payment · Order ready
              </p>
              <p className="text-3xl font-semibold">
                {formatINR(order.amount)}
              </p>
              <p className="text-sm text-slate-600">
                Confirm this test payment to add the funds to your wallet.
              </p>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium">
                Amount (₹)
                <input
                  autoFocus
                  className="field mt-2"
                  type="number"
                  step="0.01"
                  min={modal === "topup" ? 100 : 0.01}
                  max={modal === "topup" ? 1000000 : balance / 100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={pending}
                  required
                />
              </label>
              {modal === "topup" ? (
                <div className="flex flex-wrap gap-2">
                  {[10000, 50000, 100000].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className="btn-secondary"
                      disabled={pending}
                      onClick={() => setAmount(String(value))}
                    >
                      {formatINR(value * 100)}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-500">
                    Available: {formatINR(balance)}
                  </p>
                  <label className="block text-sm font-medium">
                    Account holder name
                    <input
                      className="field mt-2"
                      value={bank.accountName}
                      onChange={(e) =>
                        setBank({ ...bank, accountName: e.target.value })
                      }
                      required
                      disabled={pending}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Dummy account number
                    <input
                      className="field mt-2"
                      inputMode="numeric"
                      value={bank.accountNumber}
                      onChange={(e) =>
                        setBank({ ...bank, accountNumber: e.target.value })
                      }
                      required
                      disabled={pending}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    IFSC
                    <input
                      className="field mt-2 uppercase"
                      placeholder="DEMO0123456"
                      value={bank.ifsc}
                      onChange={(e) =>
                        setBank({ ...bank, ifsc: e.target.value.toUpperCase() })
                      }
                      required
                      disabled={pending}
                    />
                  </label>
                </>
              )}
            </>
          )}
          {issue && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {issue}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={pending}
              onClick={() => {
                if (order) setOrder(null);
                else setModal(null);
              }}
            >
              Back
            </button>
            <button type="submit" className="btn" disabled={pending}>
              {pending
                ? "Processing…"
                : order
                  ? `Pay ${formatINR(order.amount)} (test)`
                  : modal === "topup"
                    ? "Continue to test payment"
                    : "Submit withdrawal request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

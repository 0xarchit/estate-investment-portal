import { api, unwrap } from "./client";
import type { Paginated } from "../types";
export interface Transaction {
  _id: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  createdAt: string;
  refType?: string;
  refId?: string;
  note?: string;
}
export interface Withdrawal {
  _id: string;
  amount: number;
  status: string;
  reason?: string;
  createdAt: string;
}
export interface TopupOrder {
  orderId: string;
  amount: number;
  mockPayment: { paymentId: string; signature: string };
}
export const getWallet = () => unwrap<{ balance: number }>(api.get("/wallet"));
export const getTransactions = (params: Record<string, string | number> = {}) =>
  unwrap<Paginated<Transaction>>(api.get("/transactions", { params }));
export const getWithdrawals = (page = 1) =>
  unwrap<Paginated<Withdrawal>>(
    api.get("/wallet/withdrawals", { params: { page, limit: 10 } }),
  );
export const createTopupOrder = (amount: number) =>
  unwrap<TopupOrder>(api.post("/wallet/topup/order", { amount }));
export const verifyTopup = (input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) => unwrap<{ balance: number }>(api.post("/wallet/topup/verify", input));
export const requestWithdrawal = (input: {
  amount: number;
  bankDetails: { accountName: string; accountNumber: string; ifsc: string };
}) => unwrap<Withdrawal>(api.post("/wallet/withdraw", input));

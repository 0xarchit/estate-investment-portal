import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TransactionType =
  | "TOPUP"
  | "INVESTMENT"
  | "PAYOUT"
  | "REFUND"
  | "COMMISSION"
  | "WITHDRAWAL"
  | "FEE";

export type TransactionDirection = "CREDIT" | "DEBIT";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number; // in integer paise > 0
  balanceAfter: number; // in integer paise >= 0
  refType?: string;
  refId?: string;
  gatewayPaymentId?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["TOPUP", "INVESTMENT", "PAYOUT", "REFUND", "COMMISSION", "WITHDRAWAL", "FEE"],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "amount must be a positive integer in paise",
      },
    },
    balanceAfter: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 0,
        message: "balanceAfter must be a non-negative integer in paise",
      },
    },
    refType: { type: String },
    refId: { type: String },
    gatewayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    note: { type: String },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

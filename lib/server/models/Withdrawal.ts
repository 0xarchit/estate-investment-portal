import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IBankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
}

export interface IWithdrawal extends Document {
  userId: Types.ObjectId;
  amount: number; // in integer paise > 0
  status: WithdrawalStatus;
  bankDetails: IBankDetails;
  reason?: string;
  processedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankDetailsSchema = new Schema<IBankDetails>(
  {
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
  },
  { _id: false }
);

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "amount must be a positive integer in paise",
      },
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    bankDetails: {
      type: BankDetailsSchema,
      required: true,
    },
    reason: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

WithdrawalSchema.index({ createdAt: -1 });

export const Withdrawal: Model<IWithdrawal> =
  mongoose.models.Withdrawal || mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema);

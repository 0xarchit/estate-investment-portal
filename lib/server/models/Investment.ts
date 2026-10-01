import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type InvestmentStatus = "ACTIVE" | "EXITED" | "REFUNDED";

export interface IInvestment extends Document {
  investorId: Types.ObjectId;
  propertyId: Types.ObjectId;
  units: number; // integer > 0
  amount: number; // in integer paise
  status: InvestmentStatus;
  payoutAmount?: number; // in integer paise
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    investorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    units: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "units must be a positive integer",
      },
    },
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
      enum: ["ACTIVE", "EXITED", "REFUNDED"],
      default: "ACTIVE",
      index: true,
    },
    payoutAmount: {
      type: Number,
      validate: {
        validator: (v: number) => v === undefined || (Number.isInteger(v) && v >= 0),
        message: "payoutAmount must be a non-negative integer in paise",
      },
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

InvestmentSchema.index({ investorId: 1, propertyId: 1 });
InvestmentSchema.index({ createdAt: -1 });

export const Investment: Model<IInvestment> =
  mongoose.models.Investment || mongoose.model<IInvestment>("Investment", InvestmentSchema);

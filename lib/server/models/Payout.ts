import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPayoutItem {
  investorId: Types.ObjectId;
  units: number;
  amount: number; // in integer paise
}

export interface IPayout extends Document {
  propertyId: Types.ObjectId;
  salePrice: number; // in integer paise
  platformFee: number; // in integer paise
  distributable: number; // in integer paise
  items: IPayoutItem[];
  executedBy: Types.ObjectId;
  executedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutItemSchema = new Schema<IPayoutItem>(
  {
    investorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
        validator: (v: number) => Number.isInteger(v) && v >= 0,
        message: "amount must be a non-negative integer in paise",
      },
    },
  },
  { _id: false }
);

const PayoutSchema = new Schema<IPayout>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      unique: true,
      index: true,
    },
    salePrice: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "salePrice must be a positive integer in paise",
      },
    },
    platformFee: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 0,
        message: "platformFee must be a non-negative integer in paise",
      },
    },
    distributable: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 0,
        message: "distributable must be a non-negative integer in paise",
      },
    },
    items: {
      type: [PayoutItemSchema],
      default: [],
    },
    executedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    executedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Payout: Model<IPayout> =
  mongoose.models.Payout || mongoose.model<IPayout>("Payout", PayoutSchema);

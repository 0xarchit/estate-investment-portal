import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IGatewayOrder extends Document {
  orderId: string;
  userId: Types.ObjectId;
  amount: number; // in integer paise
  status: "CREATED" | "PAID";
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GatewayOrderSchema = new Schema<IGatewayOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
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
      enum: ["CREATED", "PAID"],
      default: "CREATED",
      index: true,
    },
    paymentId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const GatewayOrder: Model<IGatewayOrder> =
  mongoose.models.GatewayOrder ||
  mongoose.model<IGatewayOrder>("GatewayOrder", GatewayOrderSchema);

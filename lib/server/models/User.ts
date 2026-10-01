import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "ADMIN" | "BROKER" | "INVESTOR";
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface IKycDoc {
  url: string;
  name: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  brokerApproved: boolean;
  walletBalance: number; // in integer paise
  kyc: {
    status: KycStatus;
    docs: IKycDoc[];
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "BROKER", "INVESTOR"], required: true, default: "INVESTOR" },
    isActive: { type: Boolean, default: true },
    brokerApproved: { type: Boolean, default: false },
    walletBalance: {
      type: Number,
      default: 0,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 0,
        message: "walletBalance must be a non-negative integer in paise",
      },
    },
    kyc: {
      status: {
        type: String,
        enum: ["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"],
        default: "NOT_SUBMITTED",
      },
      docs: [
        {
          url: { type: String, required: true },
          name: { type: String, required: true },
        },
      ],
      reason: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

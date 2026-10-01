import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  platformFeePct: number;
  brokerCommissionPct: number;
  maxOwnershipPct: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    platformFeePct: {
      type: Number,
      default: 2,
      min: 0,
      max: 20,
    },
    brokerCommissionPct: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    maxOwnershipPct: {
      type: Number,
      default: 49,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PropertyType = "APARTMENT" | "VILLA" | "COMMERCIAL" | "PLOT" | "WAREHOUSE";
export type PropertyStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "LIVE"
  | "FUNDED"
  | "HOLDING"
  | "SOLD"
  | "REJECTED"
  | "CANCELLED";

export interface IPropertyMedia {
  url: string;
  publicId?: string;
  name: string;
}

export interface IProperty extends Document {
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  geo?: {
    lat: number;
    lng: number;
  };
  areaSqft?: number;
  images: IPropertyMedia[];
  documents: IPropertyMedia[];
  valuation: number; // in integer paise
  totalUnits: number; // integer
  unitPrice: number; // in integer paise (valuation / totalUnits)
  minUnits: number; // integer >= 1
  maxUnitsPerInvestor: number; // integer
  unitsSold: number; // default 0
  expectedAppreciationPct?: number;
  rentalYieldPct?: number;
  holdingPeriodMonths?: number;
  status: PropertyStatus;
  rejectionReason?: string;
  brokerId: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  salePrice?: number; // in integer paise
  soldAt?: Date;
  fundedAt?: Date;
  liveAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyMediaSchema = new Schema<IPropertyMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    name: { type: String, required: true },
  },
  { _id: false }
);

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["APARTMENT", "VILLA", "COMMERCIAL", "PLOT", "WAREHOUSE"],
      required: true,
    },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
    },
    areaSqft: { type: Number },
    images: { type: [PropertyMediaSchema], default: [] },
    documents: { type: [PropertyMediaSchema], default: [] },
    valuation: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "valuation must be a positive integer in paise",
      },
    },
    totalUnits: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "totalUnits must be a positive integer",
      },
    },
    unitPrice: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: "unitPrice must be a positive integer in paise",
      },
    },
    minUnits: {
      type: Number,
      default: 1,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 1,
        message: "minUnits must be an integer >= 1",
      },
    },
    maxUnitsPerInvestor: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 1,
        message: "maxUnitsPerInvestor must be an integer >= 1",
      },
    },
    unitsSold: {
      type: Number,
      default: 0,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 0,
        message: "unitsSold must be a non-negative integer",
      },
    },
    expectedAppreciationPct: { type: Number, default: 0 },
    rentalYieldPct: { type: Number, default: 0 },
    holdingPeriodMonths: { type: Number, default: 36 },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "LIVE",
        "FUNDED",
        "HOLDING",
        "SOLD",
        "REJECTED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    rejectionReason: { type: String },
    brokerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    salePrice: {
      type: Number,
      validate: {
        validator: (v: number) => v === undefined || (Number.isInteger(v) && v >= 0),
        message: "salePrice must be a non-negative integer in paise",
      },
    },
    soldAt: { type: Date },
    fundedAt: { type: Date },
    liveAt: { type: Date },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound and single indexes
PropertySchema.index({ status: 1, city: 1, brokerId: 1 });
PropertySchema.index({ createdAt: -1 });

// Schema validations
PropertySchema.pre("validate", function (next) {
  if (this.valuation && this.totalUnits) {
    if (this.valuation % this.totalUnits !== 0) {
      return next(new Error("valuation must be evenly divisible by totalUnits"));
    }
  }
  if (this.minUnits && this.totalUnits && this.minUnits > this.totalUnits) {
    return next(new Error("minUnits cannot exceed totalUnits"));
  }
  next();
});

export const Property: Model<IProperty> =
  mongoose.models.Property || mongoose.model<IProperty>("Property", PropertySchema);

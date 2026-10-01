import { IProperty, PropertyStatus } from "@/lib/server/models/Property";
import { Investment } from "@/lib/server/models/Investment";
import { User } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";

const VALID_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["LIVE", "REJECTED"],
  REJECTED: ["PENDING_APPROVAL"],
  LIVE: ["FUNDED", "CANCELLED"],
  FUNDED: ["HOLDING"],
  HOLDING: ["SOLD"],
  SOLD: [],
  CANCELLED: [],
};

export function assertTransition(from: PropertyStatus, to: PropertyStatus): void {
  const allowed = VALID_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      `Cannot transition property from ${from} to ${to}`
    );
  }
}

export interface SerializedProperty {
  _id: string;
  title: string;
  description: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  geo?: { lat: number; lng: number };
  areaSqft?: number;
  images: Array<{ url: string; publicId?: string; name: string }>;
  documents: Array<{ url: string; publicId?: string; name: string }>;
  valuation: number;
  totalUnits: number;
  unitPrice: number;
  minUnits: number;
  maxUnitsPerInvestor: number;
  unitsSold: number;
  expectedAppreciationPct?: number;
  rentalYieldPct?: number;
  holdingPeriodMonths?: number;
  status: PropertyStatus;
  rejectionReason?: string;
  brokerId: string;
  approvedBy?: string;
  salePrice?: number;
  soldAt?: string;
  fundedAt?: string;
  liveAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;

  // Computed fields
  fundingPct: number;
  remainingUnits: number;
  investorCount: number;
  broker?: {
    _id: string;
    name: string;
  };
}

export async function serializeProperty(
  property: IProperty,
  extras?: { investorCount?: number; brokerName?: string }
): Promise<SerializedProperty> {
  const remainingUnits = Math.max(0, property.totalUnits - property.unitsSold);
  const fundingPct = Number(
    property.totalUnits > 0
      ? Math.min(100, (property.unitsSold / property.totalUnits) * 100).toFixed(2)
      : 0
  );

  let investorCount = extras?.investorCount;
  if (investorCount === undefined) {
    const distinctInvestors = await Investment.distinct("investorId", {
      propertyId: property._id,
      status: "ACTIVE",
    });
    investorCount = distinctInvestors.length;
  }

  let brokerName = extras?.brokerName;
  if (!brokerName && property.brokerId) {
    const broker = await User.findById(property.brokerId).select("name");
    brokerName = broker?.name || "Broker";
  }

  return {
    _id: property._id.toString(),
    title: property.title,
    description: property.description,
    type: property.type,
    address: property.address,
    city: property.city,
    state: property.state,
    pincode: property.pincode,
    geo: property.geo,
    areaSqft: property.areaSqft,
    images: property.images,
    documents: property.documents,
    valuation: property.valuation,
    totalUnits: property.totalUnits,
    unitPrice: property.unitPrice,
    minUnits: property.minUnits,
    maxUnitsPerInvestor: property.maxUnitsPerInvestor,
    unitsSold: property.unitsSold,
    expectedAppreciationPct: property.expectedAppreciationPct,
    rentalYieldPct: property.rentalYieldPct,
    holdingPeriodMonths: property.holdingPeriodMonths,
    status: property.status,
    rejectionReason: property.rejectionReason,
    brokerId: property.brokerId.toString(),
    approvedBy: property.approvedBy?.toString(),
    salePrice: property.salePrice,
    soldAt: property.soldAt?.toISOString(),
    fundedAt: property.fundedAt?.toISOString(),
    liveAt: property.liveAt?.toISOString(),
    cancelledAt: property.cancelledAt?.toISOString(),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    fundingPct,
    remainingUnits,
    investorCount,
    broker: {
      _id: property.brokerId.toString(),
      name: brokerName || "Broker",
    },
  };
}

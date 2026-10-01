import mongoose, { Types } from "mongoose";
import { User } from "@/lib/server/models/User";
import { Property, IProperty } from "@/lib/server/models/Property";
import { Investment, IInvestment } from "@/lib/server/models/Investment";
import { ApiError } from "@/lib/server/errors";
import { ledger } from "@/lib/server/services/ledger.service";
import { getSettings } from "@/lib/server/services/settings.service";
import { notify } from "@/lib/server/services/notification.service";

export interface InvestParams {
  userId: string | Types.ObjectId;
  propertyId: string | Types.ObjectId;
  units: number;
  idempotencyKey?: string;
}

export interface InvestResult {
  investment: {
    _id: string;
    units: number;
    amount: number;
    ownershipPct: number;
    status: string;
  };
  property: {
    unitsSold: number;
    fundingPct: number;
    status: string;
  };
  walletBalance: number;
  message: string;
}

export async function invest(params: InvestParams): Promise<InvestResult> {
  const { userId, propertyId, units, idempotencyKey } = params;

  if (!Number.isInteger(units) || units <= 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Units must be a positive integer");
  }

  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
  const propertyObjectId =
    typeof propertyId === "string" ? new Types.ObjectId(propertyId) : propertyId;

  let resultInvestment!: IInvestment;
  let resultProperty!: IProperty;
  let finalWalletBalance = 0;
  let ownershipPct = 0;
  let isFullyFunded = false;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Check idempotency first if key provided
      if (idempotencyKey) {
        const existingInv = await Investment.findOne({ idempotencyKey }).session(session);
        if (existingInv) {
          const prop = await Property.findById(existingInv.propertyId).session(session);
          const bal = await ledger.getBalance(userObjectId, session);
          const pct = Number(
            prop && prop.totalUnits > 0
              ? ((existingInv.units / prop.totalUnits) * 100).toFixed(2)
              : 0
          );
          resultInvestment = existingInv;
          resultProperty = prop!;
          finalWalletBalance = bal;
          ownershipPct = pct;
          return;
        }
      }

      // 1. Load user in session
      const user = await User.findById(userObjectId).session(session);
      if (!user || !user.isActive) {
        throw new ApiError(401, "UNAUTHENTICATED", "Account is invalid or inactive");
      }
      if (user.kyc.status !== "APPROVED") {
        throw new ApiError(
          403,
          "KYC_NOT_APPROVED",
          "KYC verification must be approved before you can invest"
        );
      }

      // 2. Load property in session
      const property = await Property.findById(propertyObjectId).session(session);
      if (!property) {
        throw new ApiError(404, "NOT_FOUND", "Property not found");
      }
      if (property.status !== "LIVE") {
        throw new ApiError(
          409,
          "PROPERTY_NOT_LIVE",
          `Property is not open for investment (current status: ${property.status})`
        );
      }

      // 3. Min units check
      if (units < property.minUnits) {
        throw new ApiError(
          400,
          "BELOW_MIN_UNITS",
          `Investment must be at least ${property.minUnits} unit(s)`
        );
      }

      // 4. Per-investor cap
      const userInvestments = await Investment.find({
        investorId: userObjectId,
        propertyId: propertyObjectId,
        status: "ACTIVE",
      }).session(session);

      const existingUnits = userInvestments.reduce((sum, inv) => sum + inv.units, 0);
      if (existingUnits + units > property.maxUnitsPerInvestor) {
        throw new ApiError(
          409,
          "MAX_OWNERSHIP_EXCEEDED",
          `Maximum ownership limit is ${property.maxUnitsPerInvestor} units. You already own ${existingUnits} units.`
        );
      }

      // 5. Atomic anti-overselling
      const updatedProperty = await Property.findOneAndUpdate(
        {
          _id: propertyObjectId,
          status: "LIVE",
          unitsSold: { $lte: property.totalUnits - units },
        },
        {
          $inc: { unitsSold: units },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedProperty) {
        const currentProp = await Property.findById(propertyObjectId).session(session);
        const remain = currentProp
          ? Math.max(0, currentProp.totalUnits - currentProp.unitsSold)
          : 0;
        throw new ApiError(409, "INSUFFICIENT_UNITS", `Only ${remain} units remain`);
      }

      // 6. Calculate amount and debit wallet atomically
      const amount = units * updatedProperty.unitPrice;
      await ledger.post({
        userId: userObjectId,
        type: "INVESTMENT",
        direction: "DEBIT",
        amount,
        refType: "Property",
        refId: updatedProperty._id.toString(),
        note: `Investment of ${units} units in ${updatedProperty.title}`,
        session,
      });

      // 7. Create Investment record
      const [newInvestment] = await Investment.create(
        [
          {
            investorId: userObjectId,
            propertyId: updatedProperty._id,
            units,
            amount,
            status: "ACTIVE",
            idempotencyKey,
          },
        ],
        { session }
      );

      // 8. 100% funding check
      if (updatedProperty.unitsSold === updatedProperty.totalUnits) {
        updatedProperty.status = "FUNDED";
        updatedProperty.fundedAt = new Date();
        await updatedProperty.save({ session });

        const settings = await getSettings(session);
        const commission = Math.floor(
          (updatedProperty.valuation * settings.brokerCommissionPct) / 100
        );

        if (commission > 0) {
          await ledger.post({
            userId: updatedProperty.brokerId,
            type: "COMMISSION",
            direction: "CREDIT",
            amount: commission,
            refType: "Property",
            refId: updatedProperty._id.toString(),
            note: `Commission for fully funded property: ${updatedProperty.title}`,
            session,
          });
        }

        isFullyFunded = true;
      }

      finalWalletBalance = await ledger.getBalance(userObjectId, session);
      ownershipPct = Number(
        (((existingUnits + units) / updatedProperty.totalUnits) * 100).toFixed(2)
      );
      resultInvestment = newInvestment;
      resultProperty = updatedProperty;
    });
  } finally {
    await session.endSession();
  }

  // Side-effect notifications after successful commit
  if (isFullyFunded) {
    // Notify broker
    await notify(resultProperty.brokerId, {
      type: "PROPERTY_FUNDED",
      title: "Listing Fully Funded!",
      body: `Congratulations! "${resultProperty.title}" has reached 100% funding. Commission has been credited to your wallet.`,
      link: `/broker/properties/${resultProperty._id}`,
    });

    // Notify all active investors
    const activeInvestors = await Investment.find({
      propertyId: resultProperty._id,
      status: "ACTIVE",
    });
    for (const inv of activeInvestors) {
      await notify(inv.investorId, {
        type: "PROPERTY_FUNDED",
        title: "Property 100% Funded",
        body: `"${resultProperty.title}" has reached 100% funding and transitioned to FUNDED status.`,
        link: `/properties/${resultProperty._id}`,
      });
    }
  }

  const fundingPct = Number(
    resultProperty.totalUnits > 0
      ? Math.min(100, (resultProperty.unitsSold / resultProperty.totalUnits) * 100).toFixed(2)
      : 0
  );

  return {
    investment: {
      _id: resultInvestment._id.toString(),
      units: resultInvestment.units,
      amount: resultInvestment.amount,
      ownershipPct,
      status: resultInvestment.status,
    },
    property: {
      unitsSold: resultProperty.unitsSold,
      fundingPct,
      status: resultProperty.status,
    },
    walletBalance: finalWalletBalance,
    message: `You now own ${ownershipPct}% of ${resultProperty.title}`,
  };
}

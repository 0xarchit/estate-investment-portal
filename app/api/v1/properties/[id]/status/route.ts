export const dynamic = 'force-dynamic';
import mongoose from "mongoose";
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { Property } from "@/lib/server/models/Property";
import { Investment } from "@/lib/server/models/Investment";
import { ApiError } from "@/lib/server/errors";
import { ledger } from "@/lib/server/services/ledger.service";
import { assertTransition, serializeProperty } from "@/lib/server/services/property.service";
import { notify } from "@/lib/server/services/notification.service";
import { changePropertyStatusSchema, ChangePropertyStatusInput } from "@/lib/validators/property";

export const POST = route<ChangePropertyStatusInput>(
  {
    auth: true,
    roles: ["ADMIN"],
    schema: changePropertyStatusSchema,
  },
  async ({ params, body }) => {
    const { id } = params;
    const { status: targetStatus } = body;

    const property = await Property.findById(id);
    if (!property) {
      throw new ApiError(404, "NOT_FOUND", "Property not found");
    }

    assertTransition(property.status, targetStatus);

    if (targetStatus === "HOLDING") {
      property.status = "HOLDING";
      await property.save();

      // Notify all active investors
      const activeInvestors = await Investment.find({
        propertyId: property._id,
        status: "ACTIVE",
      });
      for (const inv of activeInvestors) {
        await notify(inv.investorId, {
          type: "PROPERTY_HOLDING",
          title: "Property Acquisition Complete",
          body: `"${property.title}" has entered the HOLDING phase. Rental yields and asset appreciation are now active.`,
          link: `/properties/${property._id}`,
        });
      }

      const serialized = await serializeProperty(property);
      return ok(serialized, "Property transitioned to HOLDING");
    }

    if (targetStatus === "CANCELLED") {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const propInSession = await Property.findById(id).session(session);
          if (!propInSession) {
            throw new ApiError(404, "NOT_FOUND", "Property not found");
          }
          assertTransition(propInSession.status, "CANCELLED");

          const activeInvestments = await Investment.find({
            propertyId: propInSession._id,
            status: "ACTIVE",
          }).session(session);

          for (const inv of activeInvestments) {
            await ledger.post({
              userId: inv.investorId,
              type: "REFUND",
              direction: "CREDIT",
              amount: inv.amount,
              refType: "Investment",
              refId: inv._id.toString(),
              note: `Refund for cancelled property: ${propInSession.title}`,
              session,
            });

            inv.status = "REFUNDED";
            await inv.save({ session });
          }

          propInSession.status = "CANCELLED";
          propInSession.cancelledAt = new Date();
          await propInSession.save({ session });
        });
      } finally {
        await session.endSession();
      }

      // Notify refunded investors outside transaction
      const refundedInvestments = await Investment.find({
        propertyId: property._id,
        status: "REFUNDED",
      });
      for (const inv of refundedInvestments) {
        await notify(inv.investorId, {
          type: "INVESTMENT_REFUNDED",
          title: "Investment Refunded",
          body: `Property "${property.title}" was cancelled. Full refund has been credited to your wallet.`,
          link: `/investor/wallet`,
        });
      }

      const updated = await Property.findById(id);
      const serialized = await serializeProperty(updated!);
      return ok(serialized, "Property cancelled and all active investments refunded in full");
    }

    throw new ApiError(400, "VALIDATION_ERROR", "Unsupported status transition");
  }
);


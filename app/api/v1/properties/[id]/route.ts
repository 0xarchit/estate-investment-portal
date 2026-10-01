import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { Property } from "@/lib/server/models/Property";
import { Investment } from "@/lib/server/models/Investment";
import { ApiError } from "@/lib/server/errors";
import { assertBrokerOwns } from "@/lib/server/auth/broker";
import { serializeProperty } from "@/lib/server/services/property.service";
import { updatePropertySchema, UpdatePropertyInput } from "@/lib/validators/property";

export const GET = route(
  {
    auth: false,
    optionalAuth: true,
  },
  async ({ user, params }) => {
    const { id } = params;
    const property = await Property.findById(id);

    if (!property) {
      throw new ApiError(404, "NOT_FOUND", "Property not found");
    }

    const publicStatuses = ["LIVE", "FUNDED", "HOLDING", "SOLD"];
    if (!publicStatuses.includes(property.status)) {
      if (!user) {
        throw new ApiError(404, "NOT_FOUND", "Property not found");
      }
      try {
        assertBrokerOwns(property, user);
      } catch {
        throw new ApiError(404, "NOT_FOUND", "Property not found");
      }
    }

    const serialized = await serializeProperty(property);
    return ok(serialized);
  }
);

export const PATCH = route<UpdatePropertyInput>(
  {
    auth: true,
    roles: ["ADMIN", "BROKER"],
    schema: updatePropertySchema,
  },
  async ({ user, params, body }) => {
    const { id } = params;
    const property = await Property.findById(id);

    if (!property) {
      throw new ApiError(404, "NOT_FOUND", "Property not found");
    }

    assertBrokerOwns(property, user!);

    if (property.status === "PENDING_APPROVAL" && user!.role !== "ADMIN") {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Pending listings cannot be modified by brokers. Await review or admin edits."
      );
    }

    const isLiveOrLater = ["LIVE", "FUNDED", "HOLDING", "SOLD"].includes(property.status);
    const hasInvestments = await Investment.exists({ propertyId: property._id });

    if (isLiveOrLater || hasInvestments) {
      const lockedFields = ["valuation", "totalUnits", "minUnits", "maxUnitsPerInvestor"];
      for (const field of lockedFields) {
        if (field in body) {
          throw new ApiError(
            403,
            "LOCKED_FIELDS",
            `Field '${field}' is locked once property is LIVE or has active investments`
          );
        }
      }

      // Only description, images, documents can be edited
      if (body.description) property.description = body.description;
      if (body.images) property.images = body.images;
      if (body.documents) property.documents = body.documents;

      await property.save();
      const serialized = await serializeProperty(property);
      return ok(serialized, "Property updated successfully");
    }

    // Editable when DRAFT or REJECTED
    if (body.valuation !== undefined || body.totalUnits !== undefined) {
      const valuation = body.valuation !== undefined ? body.valuation : property.valuation;
      const totalUnits = body.totalUnits !== undefined ? body.totalUnits : property.totalUnits;

      if (valuation % totalUnits !== 0) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Valuation must be evenly divisible by totalUnits"
        );
      }

      const unitPrice = valuation / totalUnits;
      if (unitPrice % 100 !== 0) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Price per unit must be a whole rupee (divisible by 100 paise)"
        );
      }

      property.valuation = valuation;
      property.totalUnits = totalUnits;
      property.unitPrice = unitPrice;
    }

    Object.assign(property, body);
    await property.save();

    const serialized = await serializeProperty(property);
    return ok(serialized, "Property updated successfully");
  }
);

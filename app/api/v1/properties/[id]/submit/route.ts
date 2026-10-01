export const dynamic = 'force-dynamic';
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { Property } from "@/lib/server/models/Property";
import { User } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";
import { assertBrokerOwns } from "@/lib/server/auth/broker";
import { assertTransition, serializeProperty } from "@/lib/server/services/property.service";
import { notify } from "@/lib/server/services/notification.service";

export const POST = route(
  {
    auth: true,
    roles: ["ADMIN", "BROKER"],
  },
  async ({ user, params }) => {
    const { id } = params;
    const property = await Property.findById(id);

    if (!property) {
      throw new ApiError(404, "NOT_FOUND", "Property not found");
    }

    assertBrokerOwns(property, user!);
    assertTransition(property.status, "PENDING_APPROVAL");

    const missingFields: string[] = [];
    if (!property.title) missingFields.push("title");
    if (!property.description) missingFields.push("description");
    if (!property.type) missingFields.push("type");
    if (!property.address) missingFields.push("address");
    if (!property.city) missingFields.push("city");
    if (!property.state) missingFields.push("state");
    if (!property.pincode) missingFields.push("pincode");
    if (!property.valuation) missingFields.push("valuation");
    if (!property.totalUnits) missingFields.push("totalUnits");
    if (!property.images || property.images.length < 3) {
      missingFields.push("images (minimum 3 images required)");
    }

    if (missingFields.length > 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        `Cannot submit listing. Missing required fields: ${missingFields.join(", ")}`
      );
    }

    property.status = "PENDING_APPROVAL";
    property.rejectionReason = undefined;
    await property.save();

    // Notify admins
    const admins = await User.find({ role: "ADMIN" }).select("_id");
    for (const admin of admins) {
      await notify(admin._id, {
        type: "PROPERTY_SUBMITTED",
        title: "New Property Submission",
        body: `Listing "${property.title}" has been submitted for review.`,
        link: `/admin/properties?status=PENDING_APPROVAL`,
      });
    }

    const serialized = await serializeProperty(property);
    return ok(serialized, "Property submitted for approval");
  }
);


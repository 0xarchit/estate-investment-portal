export const dynamic = 'force-dynamic';
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { Property } from "@/lib/server/models/Property";
import { ApiError } from "@/lib/server/errors";
import { assertTransition, serializeProperty } from "@/lib/server/services/property.service";
import { notify } from "@/lib/server/services/notification.service";
import { rejectPropertySchema, RejectPropertyInput } from "@/lib/validators/property";

export const POST = route<RejectPropertyInput>(
  {
    auth: true,
    roles: ["ADMIN"],
    schema: rejectPropertySchema,
  },
  async ({ params, body }) => {
    const { id } = params;
    const property = await Property.findById(id);

    if (!property) {
      throw new ApiError(404, "NOT_FOUND", "Property not found");
    }

    assertTransition(property.status, "REJECTED");

    property.status = "REJECTED";
    property.rejectionReason = body.reason;
    await property.save();

    // Notify broker
    await notify(property.brokerId, {
      type: "PROPERTY_REJECTED",
      title: "Property Listing Needs Revision",
      body: `Your listing "${property.title}" was not approved: ${body.reason}`,
      link: `/broker/properties/${property._id}/edit`,
    });

    const serialized = await serializeProperty(property);
    return ok(serialized, "Property rejected with reason");
  }
);


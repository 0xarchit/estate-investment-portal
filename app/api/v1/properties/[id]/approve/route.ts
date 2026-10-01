export const dynamic = 'force-dynamic';
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { Property } from "@/lib/server/models/Property";
import { ApiError } from "@/lib/server/errors";
import { assertTransition, serializeProperty } from "@/lib/server/services/property.service";
import { notify } from "@/lib/server/services/notification.service";

export const POST = route(
  {
    auth: true,
    roles: ["ADMIN"],
  },
  async ({ user, params }) => {
    const { id } = params;
    const property = await Property.findById(id);

    if (!property) {
      throw new ApiError(404, "NOT_FOUND", "Property not found");
    }

    assertTransition(property.status, "LIVE");

    property.status = "LIVE";
    property.liveAt = new Date();
    property.approvedBy = user!._id;
    await property.save();

    // Notify broker
    await notify(property.brokerId, {
      type: "PROPERTY_APPROVED",
      title: "Property Approved & Live",
      body: `Your listing "${property.title}" is now LIVE on the marketplace.`,
      link: `/properties/${property._id}`,
    });

    const serialized = await serializeProperty(property);
    return ok(serialized, "Property approved and published live");
  }
);


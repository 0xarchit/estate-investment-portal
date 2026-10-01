import { IProperty } from "@/lib/server/models/Property";
import { IUser } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";

export function assertBrokerOwns(property: IProperty, user: IUser): void {
  if (user.role === "ADMIN") {
    return;
  }

  if (user.role === "BROKER") {
    const propertyBrokerId = property.brokerId.toString();
    const userId = user._id.toString();

    if (propertyBrokerId !== userId) {
      throw new ApiError(403, "FORBIDDEN", "You do not own this property listing");
    }
    return;
  }

  throw new ApiError(403, "FORBIDDEN", "Broker or Admin privileges required");
}

export const dynamic = 'force-dynamic';
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { Property } from "@/lib/server/models/Property";
import { Investment } from "@/lib/server/models/Investment";
import { User } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";
import { assertBrokerOwns } from "@/lib/server/auth/broker";

function maskNameToInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase() + ".";
  }
  return parts.map((p) => p.charAt(0).toUpperCase() + ".").join(" ");
}

export const GET = route(
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

    const activeInvestments = await Investment.find({
      propertyId: property._id,
      status: "ACTIVE",
    });

    // Group by investorId
    const investorMap = new Map<string, { units: number; amount: number }>();
    for (const inv of activeInvestments) {
      const invId = inv.investorId.toString();
      const existing = investorMap.get(invId) || { units: 0, amount: 0 };
      existing.units += inv.units;
      existing.amount += inv.amount;
      investorMap.set(invId, existing);
    }

    const userIds = Array.from(investorMap.keys());
    const users = await User.find({ _id: { $in: userIds } }).select("name");
    const userNameMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const isBroker = user!.role === "BROKER";

    const items = userIds.map((userId) => {
      const data = investorMap.get(userId)!;
      const rawName = userNameMap.get(userId) || "Investor";
      const displayName = isBroker ? maskNameToInitials(rawName) : rawName;
      const ownershipPct = Number(
        property.totalUnits > 0
          ? ((data.units / property.totalUnits) * 100).toFixed(2)
          : 0
      );

      return {
        investorId: userId,
        name: displayName,
        units: data.units,
        amount: data.amount,
        ownershipPct,
      };
    });

    return ok({ items });
  }
);


export const dynamic = 'force-dynamic';
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";
import { invest } from "@/lib/server/services/investment.service";
import { investSchema, InvestInput } from "@/lib/validators/investment";

export const POST = route<InvestInput>(
  {
    auth: true,
    roles: ["INVESTOR"],
    rateLimit: "invest",
    schema: investSchema,
  },
  async ({ user, body }) => {
    const result = await invest({
      userId: user!._id,
      propertyId: body.propertyId,
      units: body.units,
      idempotencyKey: body.idempotencyKey,
    });

    return ok(result, result.message, 201);
  }
);


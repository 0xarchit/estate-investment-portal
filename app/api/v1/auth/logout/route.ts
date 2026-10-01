import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";

export const POST = route(
  {
    auth: true,
  },
  async () => {
    return ok({}, "Logged out successfully");
  }
);

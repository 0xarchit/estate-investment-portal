export const dynamic = 'force-dynamic';
import { route } from "@/lib/server/handler";
import { ok } from "@/lib/server/http";

export const GET = route(
  {
    auth: true,
  },
  async ({ user }) => {
    const userObj = user!.toObject();
    delete (userObj as { passwordHash?: string }).passwordHash;

    return ok({ user: userObj });
  }
);


export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { topupOrderSchema } from '@/lib/validators/wallet';
import { createTopupOrder } from '@/lib/server/services/wallet.service';
export const POST = route({ auth: true, roles: ['INVESTOR'], schema: topupOrderSchema }, async ({ user, body }) => ok(await createTopupOrder(String(user._id), body.amount), 'TEST MODE — no real payment is taken', 201));


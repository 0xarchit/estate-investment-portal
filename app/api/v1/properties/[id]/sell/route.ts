export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { saleSchema } from '@/lib/validators/admin';
import { executePayout } from '@/lib/server/services/payout.service';
export const POST = route({ auth: true, roles: ['ADMIN'], schema: saleSchema }, async ({ params, body, user }) => ok({ payout: await executePayout(params.id, body.salePrice, String(user._id)) }, 'Property sold and payouts credited'));


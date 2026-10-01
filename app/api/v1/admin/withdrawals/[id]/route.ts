export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { reviewSchema } from '@/lib/validators/admin';
import { processWithdrawal } from '@/lib/server/services/wallet.service';
export const PATCH = route({ auth: true, roles: ['ADMIN'], schema: reviewSchema }, async ({ params, user, body }) => ok(await processWithdrawal(params.id, String(user._id), body), 'Withdrawal processed'));


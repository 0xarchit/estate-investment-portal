export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { withdrawalSchema } from '@/lib/validators/wallet';
import { requestWithdrawal } from '@/lib/server/services/wallet.service';
export const POST = route({ auth: true, roles: ['INVESTOR'], schema: withdrawalSchema }, async ({ user, body }) => ok(await requestWithdrawal(String(user._id), body), 'Demo withdrawal pending admin approval', 201));


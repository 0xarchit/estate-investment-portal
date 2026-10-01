import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { topupVerifySchema } from '@/lib/validators/wallet';
import { verifyTopup } from '@/lib/server/services/wallet.service';
export const POST = route({ auth: true, roles: ['INVESTOR'], schema: topupVerifySchema }, async ({ user, body }) => ok(await verifyTopup(String(user._id), body), 'Demo payment successful; wallet credited'));

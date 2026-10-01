import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { ledger } from '@/lib/server/services/ledger.service';
export const GET = route({ auth: true, roles: ['INVESTOR'] }, async ({ user }) => ok({ balance: await ledger.getBalance(String(user._id)) }));

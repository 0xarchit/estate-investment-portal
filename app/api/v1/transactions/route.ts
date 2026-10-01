export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { listTransactions } from '@/lib/server/services/wallet.service';
export const GET = route({ auth: true, roles: ['ADMIN', 'BROKER', 'INVESTOR'] }, async ({ user, query }) => ok(await listTransactions(String(user._id), user.role, query)));


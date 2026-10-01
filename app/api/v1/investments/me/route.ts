import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { getHoldings } from '@/lib/server/services/portfolio.service';
export const GET = route({ auth: true, roles: ['INVESTOR'] }, async ({ user }) => ok({ items: await getHoldings(String(user._id)) }));

import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { getPortfolioSummary } from '@/lib/server/services/portfolio.service';
export const GET = route({ auth: true, roles: ['INVESTOR'] }, async ({ user }) => ok(await getPortfolioSummary(String(user._id))));

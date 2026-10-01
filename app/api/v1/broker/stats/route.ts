export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { getBrokerStats } from '@/lib/server/services/stats.service';
export const GET = route({ auth: true, roles: ['BROKER'] }, async ({ user }) => ok(await getBrokerStats(String(user._id))));


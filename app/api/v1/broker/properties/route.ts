export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { getBrokerProperties } from '@/lib/server/services/stats.service';
export const GET = route({ auth: true, roles: ['BROKER'] }, async ({ user, query }) => ok(await getBrokerProperties(String(user._id), query)));


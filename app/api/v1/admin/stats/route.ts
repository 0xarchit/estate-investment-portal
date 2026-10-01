export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { getAdminStats } from '@/lib/server/services/stats.service';
export const GET = route({ auth: true, roles: ['ADMIN'] }, async () => ok(await getAdminStats()));


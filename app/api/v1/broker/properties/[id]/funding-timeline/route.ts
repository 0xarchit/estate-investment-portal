import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { getFundingTimeline } from '@/lib/server/services/stats.service';
export const GET = route({ auth: true, roles: ['BROKER'] }, async ({ user, params }) => ok(await getFundingTimeline(params.id, String(user._id))));

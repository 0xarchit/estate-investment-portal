export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { reviewSchema } from '@/lib/validators/admin';
import { reviewKyc } from '@/lib/server/services/stats.service';
export const PATCH = route({ auth: true, roles: ['ADMIN'], schema: reviewSchema }, async ({ params, body }) => ok(await reviewKyc(params.userId, body), 'KYC reviewed'));


export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { payoutPreviewSchema } from '@/lib/validators/admin';
import { previewPayout } from '@/lib/server/services/payout.service';
export const GET = route({ auth: true, roles: ['ADMIN'] }, async ({ params, query }) => ok(await previewPayout(params.id, payoutPreviewSchema.parse(query).salePrice)));


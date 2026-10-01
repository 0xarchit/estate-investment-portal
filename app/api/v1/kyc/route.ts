import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { kycSchema } from '@/lib/validators/kyc';
import { submitKyc } from '@/lib/server/services/stats.service';
export const POST = route({ auth: true, roles: ['INVESTOR'], schema: kycSchema }, async ({ user, body }) => ok(await submitKyc(String(user._id), body), 'KYC submitted for review', 201));

import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { Withdrawal } from '@/lib/server/models';
import { paginate, listResult } from '@/lib/server/http';
import { withdrawalQuerySchema } from '@/lib/validators/admin';
export const GET = route({ auth: true, roles: ['ADMIN'] }, async ({ query }) => {
  const { page, limit, status } = withdrawalQuerySchema.parse(query);
  const filter = status ? { status } : {};
  const { skip } = paginate({ page, limit });
  const [items, total] = await Promise.all([Withdrawal.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit), Withdrawal.countDocuments(filter)]);
  return ok(listResult(items, total, page, limit));
});

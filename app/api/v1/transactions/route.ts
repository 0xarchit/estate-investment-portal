export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { Transaction } from '@/lib/server/models';
import { paginate, listResult } from '@/lib/server/http';
import { transactionQuerySchema } from '@/lib/validators/wallet';
import { FilterQuery } from 'mongoose';
export const GET = route({ auth: true, roles: ['ADMIN', 'BROKER', 'INVESTOR'] }, async ({ user, query }) => {
  const { page, limit, type, direction, from, to } = transactionQuerySchema.parse(query);
  const filter: FilterQuery<unknown> = user.role === 'ADMIN' ? {} : { userId: user._id };
  if (type) filter.type = type; if (direction) filter.direction = direction;
  if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  const { skip } = paginate({ page, limit });
  const [items, total] = await Promise.all([Transaction.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit), Transaction.countDocuments(filter)]);
  return ok(listResult(items, total, page, limit));
});


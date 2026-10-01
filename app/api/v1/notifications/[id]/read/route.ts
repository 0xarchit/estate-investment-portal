export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { Notification } from '@/lib/server/models';
import { ApiError } from '@/lib/server/errors';
import { objectIdSchema } from '@/lib/validators/wallet';
export const PATCH = route({ auth: true, roles: ['ADMIN', 'BROKER', 'INVESTOR'] }, async ({ user, params }) => {
  objectIdSchema.parse(params.id);
  const notification = await Notification.findOneAndUpdate({ _id: params.id, userId: user._id }, { $set: { read: true } }, { new: true });
  if (!notification) throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
  return ok(notification);
});


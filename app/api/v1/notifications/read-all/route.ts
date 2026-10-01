import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { Notification } from '@/lib/server/models';
export const PATCH = route({ auth: true, roles: ['ADMIN', 'BROKER', 'INVESTOR'] }, async ({ user }) => {
  const result = await Notification.updateMany({ userId: user._id, read: false }, { $set: { read: true } });
  return ok({ modifiedCount: result.modifiedCount });
});

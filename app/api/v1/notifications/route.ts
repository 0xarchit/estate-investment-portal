export const dynamic = 'force-dynamic';
import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { Notification } from '@/lib/server/models';
export const GET = route({ auth: true, roles: ['ADMIN', 'BROKER', 'INVESTOR'] }, async ({ user }) => {
  const [items, unreadCount] = await Promise.all([Notification.find({ userId: user._id }).sort({ createdAt: -1, _id: -1 }).limit(50), Notification.countDocuments({ userId: user._id, read: false })]);
  return ok({ items, unreadCount });
});


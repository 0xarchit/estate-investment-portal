import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { userUpdateSchema } from '@/lib/validators/admin';
import { updateUser } from '@/lib/server/services/stats.service';
export const PATCH = route({ auth: true, roles: ['ADMIN'], schema: userUpdateSchema }, async ({ params, user, body }) => ok(await updateUser(params.id, String(user._id), body), 'User updated'));

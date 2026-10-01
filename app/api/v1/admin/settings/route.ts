import { route } from '@/lib/server/handler';
import { ok } from '@/lib/server/http';
import { Settings } from '@/lib/server/models';
import { getSettings } from '@/lib/server/services/settings.service';
import { settingsSchema } from '@/lib/validators/admin';
import { ApiError } from '@/lib/server/errors';
export const GET = route({ auth: true, roles: ['ADMIN'] }, async () => ok(await getSettings()));
export const PATCH = route({ auth: true, roles: ['ADMIN'], schema: settingsSchema }, async ({ body }) => {
  await getSettings();
  const settings = await Settings.findOneAndUpdate({}, { $set: body }, { new: true, runValidators: true });
  if (!settings) throw new ApiError(503, 'SETTINGS_NOT_READY', 'Initialize the singleton settings document first');
  return ok(settings, 'Settings updated');
});

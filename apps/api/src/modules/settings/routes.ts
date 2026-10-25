import { SiteSettingsResponseSchema, UpdateSiteSettingsRequestSchema } from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { getSettings, updateSettings } from './service';

// Public: the website's footer reads this.
export const settingsRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.get(
    '/api/settings',
    { schema: { response: { 200: SiteSettingsResponseSchema } } },
    async () => ({ settings: await getSettings(app.prisma) }),
  );
  done();
};

// Registered through ADMIN_PLUGINS, so requireAuth + checkAccount already ran.
// Any admin may edit settings, not just super admins.
export const settingsAdminRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.put(
    '/api/admin/settings',
    {
      schema: {
        body: UpdateSiteSettingsRequestSchema,
        response: { 200: SiteSettingsResponseSchema },
      },
    },
    async (request) => ({ settings: await updateSettings(app.prisma, request.body) }),
  );
  done();
};

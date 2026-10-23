import type { FastifyPluginAsyncZod, FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { checkAccount } from '../auth/check-account';
import { requireAuth } from '../auth/require-auth';
import { usersAdminRoutes } from '../users/routes';

type AdminPlugin = FastifyPluginAsyncZod | FastifyPluginCallbackZod;

// Every /api/admin/* plugin goes in this list. Fastify runs requireAuth and checkAccount before
// every route registered inside adminRoutes, so a new admin route can't be left unprotected.
// For routes limited to a role, also add `onRequest: requireRole('SUPER_ADMIN')` on the route.
// Never register an /api/admin route anywhere else.
export const ADMIN_PLUGINS: AdminPlugin[] = [usersAdminRoutes];

export const adminRoutes: FastifyPluginCallbackZod<{ plugins?: AdminPlugin[] }> = (
  app,
  opts,
  done,
) => {
  // onRequest runs before the body is parsed, so logged-out callers get a 401 before anything else.
  app.addHook('onRequest', requireAuth);
  // Then: still active? temporary password changed? (and refresh request.user.role)
  app.addHook('onRequest', checkAccount);
  for (const plugin of opts.plugins ?? ADMIN_PLUGINS) {
    void app.register(plugin);
  }
  done();
};

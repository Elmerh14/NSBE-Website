import type { FastifyPluginAsyncZod, FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { requireAuth } from '../auth/require-auth';

type AdminPlugin = FastifyPluginAsyncZod | FastifyPluginCallbackZod;

// Every /api/admin/* plugin goes in this list. Fastify runs requireAuth before every route
// registered inside adminRoutes, so a new admin route can't be left unprotected by accident.
// Never register an /api/admin route anywhere else.
export const ADMIN_PLUGINS: AdminPlugin[] = [];

export const adminRoutes: FastifyPluginCallbackZod<{ plugins?: AdminPlugin[] }> = (
  app,
  opts,
  done,
) => {
  // onRequest runs before the body is parsed, so logged-out callers get a 401 before anything else.
  app.addHook('onRequest', requireAuth);
  for (const plugin of opts.plugins ?? ADMIN_PLUGINS) {
    void app.register(plugin);
  }
  done();
};

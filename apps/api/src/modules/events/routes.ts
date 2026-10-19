import { EventsQuerySchema, EventsResponseSchema } from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { listEvents } from './service';

export const eventsRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.get(
    '/api/events',
    {
      schema: { querystring: EventsQuerySchema, response: { 200: EventsResponseSchema } },
    },
    (request) => listEvents(app.prisma, request.query),
  );
  done();
};

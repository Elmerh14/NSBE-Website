import {
  ApiErrorSchema,
  CreateEventSchema,
  DeleteEventResponseSchema,
  EventParamsSchema,
  EventSchema,
  EventsQuerySchema,
  EventsResponseSchema,
  UpdateEventSchema,
} from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { requireAuth } from '../auth/require-auth';
import { createEvent, deleteEvent, getEvent, listEvents, updateEvent } from './service';

const errors = {
  400: ApiErrorSchema,
  401: ApiErrorSchema,
  403: ApiErrorSchema,
  404: ApiErrorSchema,
  409: ApiErrorSchema,
  500: ApiErrorSchema,
};

export const adminEventsRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  // This plugin's auth hook applies only to admin events, leaving public reads public.
  app.addHook('onRequest', requireAuth);

  app.get(
    '/api/admin/events',
    {
      schema: {
        querystring: EventsQuerySchema,
        response: { 200: EventsResponseSchema, ...errors },
      },
    },
    (request) => listEvents(app.prisma, request.query),
  );

  app.get(
    '/api/admin/events/:id',
    {
      schema: { params: EventParamsSchema, response: { 200: EventSchema, ...errors } },
    },
    (request) => getEvent(app.prisma, request.params.id),
  );

  app.post(
    '/api/admin/events',
    {
      schema: { body: CreateEventSchema, response: { 201: EventSchema, ...errors } },
    },
    async (request, reply) => {
      const event = await createEvent(app.prisma, request.body);
      return reply.code(201).header('Location', `/api/admin/events/${event.id}`).send(event);
    },
  );

  app.patch(
    '/api/admin/events/:id',
    {
      schema: {
        params: EventParamsSchema,
        body: UpdateEventSchema,
        response: { 200: EventSchema, ...errors },
      },
    },
    (request) => updateEvent(app.prisma, request.params.id, request.body),
  );

  app.delete(
    '/api/admin/events/:id',
    {
      schema: {
        params: EventParamsSchema,
        response: { 204: DeleteEventResponseSchema, ...errors },
      },
    },
    async (request, reply) => {
      await deleteEvent(app.prisma, request.params.id);
      return reply.code(204).send();
    },
  );
  done();
};

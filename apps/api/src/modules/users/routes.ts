import {
  CreateUserRequestSchema,
  ReactivateUserRequestSchema,
  TemporaryPasswordResponseSchema,
  UpdateUserRequestSchema,
  UserParamsSchema,
  UserResponseSchema,
  UsersResponseSchema,
} from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { requireRole } from '../auth/require-role';
import {
  changeRole,
  createUser,
  deactivateUser,
  listUsers,
  reactivateUser,
  resetPassword,
} from './service';

// User management. Registered through ADMIN_PLUGINS, so requireAuth + checkAccount already ran.
export const usersAdminRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  // Every route in this plugin is SUPER_ADMIN only, so a new one can't forget the check.
  app.addHook('onRequest', requireRole('SUPER_ADMIN'));

  app.get('/api/admin/users', { schema: { response: { 200: UsersResponseSchema } } }, async () => ({
    users: await listUsers(app.prisma),
  }));

  app.post(
    '/api/admin/users',
    {
      schema: { body: CreateUserRequestSchema, response: { 201: TemporaryPasswordResponseSchema } },
    },
    async (request, reply) => reply.status(201).send(await createUser(app.prisma, request.body)),
  );

  app.patch(
    '/api/admin/users/:id',
    {
      schema: {
        params: UserParamsSchema,
        body: UpdateUserRequestSchema,
        response: { 200: UserResponseSchema },
      },
    },
    async (request) => ({
      user: await changeRole(app.prisma, request.user.id, request.params.id, request.body.role),
    }),
  );

  app.post(
    '/api/admin/users/:id/reset-password',
    { schema: { params: UserParamsSchema, response: { 200: TemporaryPasswordResponseSchema } } },
    (request) => resetPassword(app.prisma, request.user.id, request.params.id),
  );

  app.post(
    '/api/admin/users/:id/reactivate',
    {
      schema: {
        params: UserParamsSchema,
        body: ReactivateUserRequestSchema,
        response: { 200: TemporaryPasswordResponseSchema },
      },
    },
    (request) => reactivateUser(app.prisma, request.user.id, request.params.id, request.body.role),
  );

  app.delete(
    '/api/admin/users/:id',
    { schema: { params: UserParamsSchema } },
    async (request, reply) => {
      await deactivateUser(app.prisma, request.user.id, request.params.id);
      return reply.status(204).send();
    },
  );

  done();
};

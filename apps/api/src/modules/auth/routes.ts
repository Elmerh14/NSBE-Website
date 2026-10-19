import { AuthResponseSchema, ChangePasswordRequestSchema, LoginRequestSchema } from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { AppError } from '../../lib/errors';
import { REFRESH_TOKEN_COOKIE } from './cookies';
import { createRefreshToken, revokeRefreshToken, rotateRefreshToken } from './refresh-tokens';
import { requireAuth } from './require-auth';
import { changePassword, getCurrentUser, login } from './service';
import { clearSessionCookies, setSessionCookies } from './session';

const opts = {
  schema: {
    body: LoginRequestSchema,
    response: {
      200: AuthResponseSchema,
    },
  },
};

export const authRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.post('/api/auth/login', opts, async (request, reply) => {
    const { email, password } = request.body;

    const user = await login(app.prisma, email, password);
    await setSessionCookies(reply, user, await createRefreshToken(app.prisma, user.id));

    return { user };
  });

  // The admin app calls this on load to find out who is logged in (401 = show the login page).
  app.get(
    '/api/auth/me',
    { onRequest: requireAuth, schema: { response: { 200: AuthResponseSchema } } },
    async (request) => ({ user: await getCurrentUser(app.prisma, request.user.id) }),
  );

  // Called when the access token has expired (any 401): swaps the refresh cookie for new cookies.
  app.post(
    '/api/auth/refresh',
    { schema: { response: { 200: AuthResponseSchema } } },
    async (request, reply) => {
      const token = request.cookies[REFRESH_TOKEN_COOKIE];
      if (!token) {
        throw new AppError(401, 'UNAUTHORIZED', 'You must be logged in.');
      }

      const { user, refreshToken } = await rotateRefreshToken(app.prisma, token);
      await setSessionCookies(reply, user, refreshToken);

      return { user };
    },
  );

  // Works even when the access token has expired, so it doesn't use requireAuth.
  app.post('/api/auth/logout', async (request, reply) => {
    const token = request.cookies[REFRESH_TOKEN_COOKIE];
    if (token) {
      await revokeRefreshToken(app.prisma, token);
    }

    clearSessionCookies(reply);
    return reply.status(204).send();
  });

  app.post(
    '/api/auth/change-password',
    {
      onRequest: requireAuth,
      schema: { body: ChangePasswordRequestSchema, response: { 200: AuthResponseSchema } },
    },
    async (request, reply) => {
      const { currentPassword, newPassword } = request.body;

      const user = await changePassword(app.prisma, request.user.id, currentPassword, newPassword);
      // Every old session was revoked; give this device a fresh one so it stays logged in.
      await setSessionCookies(reply, user, await createRefreshToken(app.prisma, user.id));

      return { user };
    },
  );

  done();
};

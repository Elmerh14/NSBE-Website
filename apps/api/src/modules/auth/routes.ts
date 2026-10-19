import { AuthResponseSchema, LoginRequestSchema } from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { ACCESS_TOKEN_COOKIE } from './cookies';
import { login } from './service';

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
    const token = await reply.jwtSign(
      { sub: String(user.id), role: user.role },
      { expiresIn: '15min' },
    );

    reply.setCookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    return { user };
  });
  done();
};

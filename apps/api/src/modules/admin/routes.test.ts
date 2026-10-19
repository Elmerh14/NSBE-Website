import { ApiErrorSchema } from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildApp } from '../../app';
import { TEST_CONFIG } from '../../test-config';
import { ACCESS_TOKEN_COOKIE } from '../auth/cookies';
import { adminRoutes } from './routes';

// Stands in for a feature's admin plugin (media, events, users, ...).
const fakeAdminPlugin: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.get('/api/admin/test', (request) => ({ user: request.user }));
  app.post(
    '/api/admin/test',
    { schema: { body: z.object({ name: z.string().min(1) }) } },
    (request) => ({ name: request.body.name }),
  );
  done();
};

describe('adminRoutes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.register(adminRoutes, { plugins: [fakeAdminPlugin] });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects logged-out requests to every admin route with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/test' });

    expect(res.statusCode).toBe(401);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('UNAUTHORIZED');
  });

  it('checks login before validating the body, so logged-out callers learn nothing', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/admin/test', payload: {} });

    expect(res.statusCode).toBe(401);
  });

  it('lets a logged-in user through, with request.user set to { id, role }', async () => {
    const token = app.jwt.sign({ sub: '7', role: 'USER' });

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/test',
      cookies: { [ACCESS_TOKEN_COOKIE]: token },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ user: { id: 7, role: 'USER' } });
  });

  it('still validates the body for logged-in users', async () => {
    const token = app.jwt.sign({ sub: '7', role: 'USER' });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/test',
      cookies: { [ACCESS_TOKEN_COOKIE]: token },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  it('does not protect public routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });

    expect(res.statusCode).toBe(200);
  });
});

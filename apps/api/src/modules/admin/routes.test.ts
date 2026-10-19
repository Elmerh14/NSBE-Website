import { ApiErrorSchema } from '@nsbe/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { buildApp } from '../../app';
import type { User } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';
import { type FakeDb, installFakeDb } from '../../test-fake-db';
import { ACCESS_TOKEN_COOKIE } from '../auth/cookies';
import type { AccessTokenPayload } from '../auth/jwt';
import { requireRole } from '../auth/require-role';
import { adminRoutes } from './routes';

// Stands in for a feature's admin plugin (media, events, users, ...).
const fakeAdminPlugin: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.get('/api/admin/test', (request) => ({ user: request.user }));
  app.post(
    '/api/admin/test',
    { schema: { body: z.object({ name: z.string().min(1) }) } },
    (request) => ({ name: request.body.name }),
  );
  app.get('/api/admin/super-only', { onRequest: requireRole('SUPER_ADMIN') }, () => ({
    ok: true,
  }));
  done();
};

const USER: User = {
  id: 7,
  email: 'officer@example.com',
  name: 'Officer',
  passwordHash: '$argon2id$not-used-here',
  role: 'USER',
  mustChangePassword: false,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('adminRoutes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let db: FakeDb;

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.register(adminRoutes, { plugins: [fakeAdminPlugin] });
    await app.ready();
    db = installFakeDb(app.prisma, [USER]);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  function asUser(
    method: 'GET' | 'POST',
    url: string,
    payload?: object,
    token: AccessTokenPayload = { sub: '7', role: 'USER' },
  ) {
    return app.inject({
      method,
      url,
      cookies: { [ACCESS_TOKEN_COOKIE]: app.jwt.sign(token) },
      ...(payload ? { payload } : {}),
    });
  }

  function setUser(changes: Partial<User>) {
    Object.assign(db.users[0] ?? {}, changes);
  }

  describe('requireAuth', () => {
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
      const res = await asUser('GET', '/api/admin/test');

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ user: { id: 7, role: 'USER' } });
    });

    it('still validates the body for logged-in users', async () => {
      const res = await asUser('POST', '/api/admin/test', {});

      expect(res.statusCode).toBe(400);
      expect(ApiErrorSchema.parse(res.json()).error.code).toBe('VALIDATION_ERROR');
    });

    it('does not protect public routes', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/health' });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('checkAccount', () => {
    it('returns 403 PASSWORD_CHANGE_REQUIRED while the temporary password is unchanged', async () => {
      setUser({ mustChangePassword: true });

      const res = await asUser('GET', '/api/admin/test');

      expect(res.statusCode).toBe(403);
      expect(ApiErrorSchema.parse(res.json()).error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    });

    it('returns 401 right away for a deactivated user, even with an unexpired token', async () => {
      setUser({ isActive: false });

      const res = await asUser('GET', '/api/admin/test');

      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for a token whose user no longer exists', async () => {
      const res = await asUser('GET', '/api/admin/test', undefined, { sub: '999', role: 'USER' });

      expect(res.statusCode).toBe(401);
    });

    it('uses the role from the database, not the one in the token', async () => {
      setUser({ role: 'SUPER_ADMIN' });

      const res = await asUser('GET', '/api/admin/test');

      expect(res.json()).toEqual({ user: { id: 7, role: 'SUPER_ADMIN' } });
    });
  });

  describe('requireRole', () => {
    it('returns 403 FORBIDDEN for a user without the role', async () => {
      const res = await asUser('GET', '/api/admin/super-only');

      expect(res.statusCode).toBe(403);
      expect(ApiErrorSchema.parse(res.json()).error.code).toBe('FORBIDDEN');
    });

    it('lets a user with the role through', async () => {
      setUser({ role: 'SUPER_ADMIN' });

      const res = await asUser('GET', '/api/admin/super-only');

      expect(res.statusCode).toBe(200);
    });

    it('blocks a demoted user even if their token still says SUPER_ADMIN', async () => {
      const res = await asUser('GET', '/api/admin/super-only', undefined, {
        sub: '7',
        role: 'SUPER_ADMIN',
      });

      expect(res.statusCode).toBe(403);
    });
  });
});

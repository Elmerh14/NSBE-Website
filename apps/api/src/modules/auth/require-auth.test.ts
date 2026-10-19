import { ApiErrorSchema } from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app';
import type { User } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';
import { ACCESS_TOKEN_COOKIE } from './cookies';
import type { AccessTokenPayload } from './jwt';

type App = Awaited<ReturnType<typeof buildApp>>;

const PAYLOAD: AccessTokenPayload = { sub: '1', role: 'SUPER_ADMIN' };

const USER: User = {
  id: 1,
  email: 'elmer@example.com',
  name: 'Elmer',
  passwordHash: '$argon2id$not-used-here',
  role: 'SUPER_ADMIN',
  mustChangePassword: false,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

// requireAuth is tested through GET /api/auth/me, the way routes really use it.
function getMe(app: App, token?: string) {
  return app.inject({
    method: 'GET',
    url: '/api/auth/me',
    cookies: token === undefined ? {} : { [ACCESS_TOKEN_COOKIE]: token },
  });
}

function expectUnauthorized(res: Awaited<ReturnType<typeof getMe>>) {
  expect(res.statusCode).toBe(401);
  expect(ApiErrorSchema.parse(res.json()).error.code).toBe('UNAUTHORIZED');
}

describe('requireAuth (via GET /api/auth/me)', () => {
  let app: App;

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  it('returns the current user for a valid token, looking them up by numeric id', async () => {
    const findUnique = vi.spyOn(app.prisma.user, 'findUnique').mockResolvedValue(USER);

    const res = await getMe(app, app.jwt.sign(PAYLOAD, { expiresIn: '15m' }));

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      user: {
        id: 1,
        email: 'elmer@example.com',
        name: 'Elmer',
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
      },
    });
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
  });

  it('returns 401 with no cookie, without touching the database', async () => {
    const findUnique = vi.spyOn(app.prisma.user, 'findUnique');

    expectUnauthorized(await getMe(app));
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for a token that is not a JWT', async () => {
    expectUnauthorized(await getMe(app, 'not-a-jwt'));
  });

  it('returns 401 for a token signed with a different secret (a forged token)', async () => {
    const otherApp = await buildApp({
      ...TEST_CONFIG,
      JWT_SECRET: 'a-completely-different-secret-of-32-chars',
    });
    const forged = otherApp.jwt.sign(PAYLOAD);
    await otherApp.close();

    expectUnauthorized(await getMe(app, forged));
  });

  it('returns 401 for an expired token', async () => {
    const expiredAt = Math.floor(Date.now() / 1000) - 60;
    // exp is set by hand to a time in the past; it isn't part of AccessTokenPayload.
    const expired = app.jwt.sign({ ...PAYLOAD, exp: expiredAt } as AccessTokenPayload);

    expectUnauthorized(await getMe(app, expired));
  });

  it('returns 401 when the user was deactivated after logging in', async () => {
    vi.spyOn(app.prisma.user, 'findUnique').mockResolvedValue({ ...USER, isActive: false });

    expectUnauthorized(await getMe(app, app.jwt.sign(PAYLOAD)));
  });

  it('returns 401 when the user no longer exists', async () => {
    vi.spyOn(app.prisma.user, 'findUnique').mockResolvedValue(null);

    expectUnauthorized(await getMe(app, app.jwt.sign(PAYLOAD)));
  });
});

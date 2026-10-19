import { ApiErrorSchema } from '@nsbe/shared';
import type { LightMyRequestResponse } from 'fastify';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app';
import type { User } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';
import { type FakeDb, installFakeDb } from '../../test-fake-db';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_TTL_SECONDS } from './cookies';
import { hashPassword, verifyPassword } from './password';
import { hashRefreshToken } from './refresh-tokens';

type App = Awaited<ReturnType<typeof buildApp>>;

const PASSWORD = 'correct horse battery staple';
const NEW_PASSWORD = 'an even longer new password';

let passwordHash: string;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'elmer@example.com',
    name: 'Elmer',
    passwordHash,
    role: 'SUPER_ADMIN',
    mustChangePassword: false,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function cookie(res: LightMyRequestResponse, name: string) {
  return res.cookies.find((c) => c.name === name);
}

function cookieValue(res: LightMyRequestResponse, name: string): string {
  const value = cookie(res, name)?.value;
  if (!value) throw new Error(`No ${name} cookie in the response`);
  return value;
}

function expectError(res: LightMyRequestResponse, status: number, code: string) {
  expect(res.statusCode).toBe(status);
  expect(ApiErrorSchema.parse(res.json()).error.code).toBe(code);
}

describe('auth sessions', () => {
  let app: App;
  let db: FakeDb;

  beforeAll(async () => {
    passwordHash = await hashPassword(PASSWORD);
  });

  function setup(user: User = makeUser()) {
    db = installFakeDb(app.prisma, [user]);
  }

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  function login(password = PASSWORD) {
    return app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'elmer@example.com', password },
    });
  }

  function refresh(token?: string) {
    return app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: token === undefined ? {} : { [REFRESH_TOKEN_COOKIE]: token },
    });
  }

  describe('POST /api/auth/login', () => {
    it('sets a 7-day refresh cookie scoped to /api/auth, and stores only its hash', async () => {
      setup();

      const res = await login();

      expect(res.statusCode).toBe(200);
      expect(cookie(res, REFRESH_TOKEN_COOKIE)).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/api/auth',
        maxAge: REFRESH_TOKEN_TTL_SECONDS,
      });

      const token = cookieValue(res, REFRESH_TOKEN_COOKIE);
      expect(db.refreshTokens).toHaveLength(1);
      expect(db.refreshTokens[0]).toMatchObject({ userId: 1, tokenHash: hashRefreshToken(token) });
      expect(db.refreshTokens[0]?.tokenHash).not.toBe(token);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('swaps a valid refresh token for new cookies and revokes the old token', async () => {
      setup();
      const oldToken = cookieValue(await login(), REFRESH_TOKEN_COOKIE);

      const res = await refresh(oldToken);

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ user: { id: 1, email: 'elmer@example.com' } });
      const newToken = cookieValue(res, REFRESH_TOKEN_COOKIE);
      expect(newToken).not.toBe(oldToken);
      expect(cookieValue(res, ACCESS_TOKEN_COOKIE)).toBeTruthy();

      const [oldRow, newRow] = db.refreshTokens;
      expect(oldRow?.revokedAt).toBeInstanceOf(Date);
      expect(newRow).toMatchObject({ tokenHash: hashRefreshToken(newToken), revokedAt: null });
    });

    it('returns 401 with no refresh cookie', async () => {
      setup();
      expectError(await refresh(), 401, 'UNAUTHORIZED');
    });

    it('returns 401 for an unknown refresh token', async () => {
      setup();
      expectError(await refresh('made-up-token'), 401, 'UNAUTHORIZED');
    });

    it('returns 401 for an expired refresh token', async () => {
      setup();
      const token = cookieValue(await login(), REFRESH_TOKEN_COOKIE);
      const row = db.refreshTokens[0];
      if (row) row.expiresAt = new Date(Date.now() - 1000);

      expectError(await refresh(token), 401, 'UNAUTHORIZED');
    });

    it('returns 401 when the user has been deactivated', async () => {
      setup();
      const token = cookieValue(await login(), REFRESH_TOKEN_COOKIE);
      const user = db.users[0];
      if (user) user.isActive = false;

      expectError(await refresh(token), 401, 'UNAUTHORIZED');
    });

    it('treats reuse of an already-swapped token as theft and ends all of that user’s sessions', async () => {
      setup();
      const stolen = cookieValue(await login(), REFRESH_TOKEN_COOKIE);
      const newer = cookieValue(await refresh(stolen), REFRESH_TOKEN_COOKIE);

      // The thief (or the user) replays the token that was already swapped.
      expectError(await refresh(stolen), 401, 'UNAUTHORIZED');

      expect(db.refreshTokens).toHaveLength(0);
      expectError(await refresh(newer), 401, 'UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes the refresh token and clears both cookies', async () => {
      setup();
      const token = cookieValue(await login(), REFRESH_TOKEN_COOKIE);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        cookies: { [REFRESH_TOKEN_COOKIE]: token },
      });

      expect(res.statusCode).toBe(204);
      expect(db.refreshTokens).toHaveLength(0);
      // Clearing a cookie = setting it empty and already expired, on the same path.
      expect(cookie(res, ACCESS_TOKEN_COOKIE)).toMatchObject({ value: '', path: '/' });
      expect(cookie(res, REFRESH_TOKEN_COOKIE)).toMatchObject({ value: '', path: '/api/auth' });
      expectError(await refresh(token), 401, 'UNAUTHORIZED');
    });

    it('still succeeds with no cookies', async () => {
      setup();
      const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('POST /api/auth/change-password', () => {
    function changePassword(accessToken: string | undefined, payload: object) {
      return app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        cookies: accessToken === undefined ? {} : { [ACCESS_TOKEN_COOKIE]: accessToken },
        payload,
      });
    }

    it('changes the password, clears mustChangePassword and logs out other devices', async () => {
      setup(makeUser({ mustChangePassword: true }));
      const otherDevice = cookieValue(await login(), REFRESH_TOKEN_COOKIE);
      const thisDevice = await login();

      const res = await changePassword(cookieValue(thisDevice, ACCESS_TOKEN_COOKIE), {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ user: { id: 1, mustChangePassword: false } });

      const user = db.users[0];
      expect(user?.mustChangePassword).toBe(false);
      expect(await verifyPassword(user?.passwordHash ?? '', NEW_PASSWORD)).toBe(true);

      // Other devices are logged out; this device gets a fresh, working session.
      // (The other device trying its old token must not end this device's new session.)
      expectError(await refresh(otherDevice), 401, 'UNAUTHORIZED');
      expect((await refresh(cookieValue(res, REFRESH_TOKEN_COOKIE))).statusCode).toBe(200);

      // The old password no longer works; the new one does.
      expectError(await login(PASSWORD), 401, 'INVALID_CREDENTIALS');
      expect((await login(NEW_PASSWORD)).statusCode).toBe(200);
    });

    it('returns 400 INVALID_CURRENT_PASSWORD (not 401) for a wrong current password', async () => {
      setup();
      const accessToken = cookieValue(await login(), ACCESS_TOKEN_COOKIE);

      const res = await changePassword(accessToken, {
        currentPassword: 'wrong password',
        newPassword: NEW_PASSWORD,
      });

      expectError(res, 400, 'INVALID_CURRENT_PASSWORD');
      expect(await verifyPassword(db.users[0]?.passwordHash ?? '', PASSWORD)).toBe(true);
    });

    it('returns 400 VALIDATION_ERROR for a new password under 12 characters', async () => {
      setup();
      const accessToken = cookieValue(await login(), ACCESS_TOKEN_COOKIE);

      const res = await changePassword(accessToken, {
        currentPassword: PASSWORD,
        newPassword: 'short',
      });

      expectError(res, 400, 'VALIDATION_ERROR');
    });

    it('returns 401 when not logged in', async () => {
      setup();
      const res = await changePassword(undefined, {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      });
      expectError(res, 401, 'UNAUTHORIZED');
    });
  });
});

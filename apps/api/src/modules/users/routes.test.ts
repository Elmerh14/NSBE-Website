import {
  ApiErrorSchema,
  TemporaryPasswordResponseSchema,
  UserResponseSchema,
  UsersResponseSchema,
} from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app';
import type { RefreshToken, User } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';
import { type FakeDb, installFakeDb } from '../../test-fake-db';
import { ACCESS_TOKEN_COOKIE } from '../auth/cookies';
import { verifyPassword } from '../auth/password';
import { changeRole, deactivateUser } from './service';

function makeUser(overrides: Partial<User> & Pick<User, 'id' | 'email' | 'name'>): User {
  return {
    passwordHash: '$argon2id$not-used-here',
    role: 'USER',
    mustChangePassword: false,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

const ADMIN = makeUser({ id: 1, email: 'elmer@example.com', name: 'Elmer', role: 'SUPER_ADMIN' });
const OFFICER = makeUser({ id: 2, email: 'officer@example.com', name: 'Officer' });

function refreshToken(id: number, userId: number): RefreshToken {
  return {
    id,
    userId,
    tokenHash: `hash-${String(id)}`,
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    createdAt: new Date(),
  };
}

describe('user management routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let db: FakeDb;

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.ready();
    db = installFakeDb(app.prisma, [ADMIN, OFFICER]);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  function as(
    user: User,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    payload?: object,
  ) {
    return app.inject({
      method,
      url,
      cookies: { [ACCESS_TOKEN_COOKIE]: app.jwt.sign({ sub: String(user.id), role: user.role }) },
      ...(payload ? { payload } : {}),
    });
  }

  function errorCode(res: { json: () => unknown }) {
    return ApiErrorSchema.parse(res.json()).error.code;
  }

  function stored(id: number) {
    const user = db.users.find((u) => u.id === id);
    if (!user) throw new Error(`No user ${String(id)} in the fake db`);
    return user;
  }

  describe('access', () => {
    it('rejects logged-out requests with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/admin/users' });

      expect(res.statusCode).toBe(401);
    });

    it.each([
      ['GET', '/api/admin/users'],
      ['POST', '/api/admin/users'],
      ['PATCH', '/api/admin/users/1'],
      ['POST', '/api/admin/users/1/reset-password'],
      ['DELETE', '/api/admin/users/1'],
      ['POST', '/api/admin/users/1/reactivate'],
    ] as const)('returns 403 FORBIDDEN to a USER for %s %s', async (method, url) => {
      const res = await as(OFFICER, method, url, method === 'GET' ? undefined : {});

      expect(res.statusCode).toBe(403);
      expect(errorCode(res)).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/admin/users', () => {
    it('lists active users first, then by name, without password hashes', async () => {
      db.users.push(
        makeUser({ id: 3, email: 'aaron@example.com', name: 'Aaron', isActive: false }),
      );

      const res = await as(ADMIN, 'GET', '/api/admin/users');

      expect(res.statusCode).toBe(200);
      const { users } = UsersResponseSchema.parse(res.json());
      expect(users.map((u) => u.name)).toEqual(['Elmer', 'Officer', 'Aaron']);
      expect(users[0]).toEqual({
        id: 1,
        email: 'elmer@example.com',
        name: 'Elmer',
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(res.body).not.toContain('passwordHash');
    });
  });

  describe('POST /api/admin/users', () => {
    it('creates a user with a temporary password they must change', async () => {
      const res = await as(ADMIN, 'POST', '/api/admin/users', {
        email: ' New@Example.COM ',
        name: ' New Officer ',
        role: 'USER',
      });

      expect(res.statusCode).toBe(201);
      const { user, temporaryPassword } = TemporaryPasswordResponseSchema.parse(res.json());
      expect(user).toMatchObject({
        email: 'new@example.com',
        name: 'New Officer',
        role: 'USER',
        mustChangePassword: true,
        isActive: true,
      });
      expect(temporaryPassword).toMatch(/^[A-Za-z0-9_-]{24}$/);

      // Only the argon2id hash is stored, and it matches the password shown once.
      const { passwordHash } = stored(user.id);
      expect(passwordHash).toMatch(/^\$argon2id\$/);
      expect(await verifyPassword(passwordHash, temporaryPassword)).toBe(true);
    });

    it('lets the new user log in with the temporary password', async () => {
      const created = await as(ADMIN, 'POST', '/api/admin/users', {
        email: 'new@example.com',
        name: 'New Officer',
        role: 'USER',
      });
      const { temporaryPassword } = TemporaryPasswordResponseSchema.parse(created.json());
      vi.spyOn(app.prisma.refreshToken, 'create').mockResolvedValue({} as never);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'new@example.com', password: temporaryPassword },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ user: { mustChangePassword: true } });
    });

    it('returns 409 EMAIL_TAKEN for an existing email, whatever its case', async () => {
      const res = await as(ADMIN, 'POST', '/api/admin/users', {
        email: 'OFFICER@example.com',
        name: 'Someone',
        role: 'USER',
      });

      expect(res.statusCode).toBe(409);
      expect(errorCode(res)).toBe('EMAIL_TAKEN');
    });

    it.each([
      ['an unknown role', { email: 'a@b.co', name: 'A', role: 'OWNER' }],
      ['a blank name', { email: 'a@b.co', name: '  ', role: 'USER' }],
      ['an extra field', { email: 'a@b.co', name: 'A', role: 'USER', isActive: false }],
    ])('returns 400 for %s', async (_, payload) => {
      const res = await as(ADMIN, 'POST', '/api/admin/users', payload);

      expect(res.statusCode).toBe(400);
      expect(errorCode(res)).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/admin/users/:id', () => {
    it("changes another user's role", async () => {
      const res = await as(ADMIN, 'PATCH', '/api/admin/users/2', { role: 'SUPER_ADMIN' });

      expect(res.statusCode).toBe(200);
      expect(UserResponseSchema.parse(res.json()).user.role).toBe('SUPER_ADMIN');
      expect(stored(2).role).toBe('SUPER_ADMIN');
    });

    it('demotes another super admin while one remains', async () => {
      stored(2).role = 'SUPER_ADMIN';

      const res = await as(ADMIN, 'PATCH', '/api/admin/users/2', { role: 'USER' });

      expect(res.statusCode).toBe(200);
      expect(stored(2).role).toBe('USER');
    });

    it('returns 403 CANNOT_MODIFY_SELF for your own account', async () => {
      const res = await as(ADMIN, 'PATCH', '/api/admin/users/1', { role: 'USER' });

      expect(res.statusCode).toBe(403);
      expect(errorCode(res)).toBe('CANNOT_MODIFY_SELF');
      expect(stored(1).role).toBe('SUPER_ADMIN');
    });

    it('returns 404 USER_NOT_FOUND for an unknown id', async () => {
      const res = await as(ADMIN, 'PATCH', '/api/admin/users/999', { role: 'USER' });

      expect(res.statusCode).toBe(404);
      expect(errorCode(res)).toBe('USER_NOT_FOUND');
    });

    it('returns 400 for an id that is not a positive integer', async () => {
      const res = await as(ADMIN, 'PATCH', '/api/admin/users/abc', { role: 'USER' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('sets a new temporary password and logs the user out everywhere', async () => {
      db.refreshTokens.push(refreshToken(1, 2), refreshToken(2, 2), refreshToken(3, 1));

      const res = await as(ADMIN, 'POST', '/api/admin/users/2/reset-password');

      expect(res.statusCode).toBe(200);
      const { user, temporaryPassword } = TemporaryPasswordResponseSchema.parse(res.json());
      expect(user.mustChangePassword).toBe(true);
      expect(await verifyPassword(stored(2).passwordHash, temporaryPassword)).toBe(true);
      // Only the target's sessions end.
      expect(db.refreshTokens.map((t) => t.userId)).toEqual([1]);
    });

    it('returns 403 CANNOT_MODIFY_SELF for your own account', async () => {
      const res = await as(ADMIN, 'POST', '/api/admin/users/1/reset-password');

      expect(res.statusCode).toBe(403);
      expect(errorCode(res)).toBe('CANNOT_MODIFY_SELF');
    });

    it('returns 409 USER_INACTIVE for a deactivated user', async () => {
      stored(2).isActive = false;

      const res = await as(ADMIN, 'POST', '/api/admin/users/2/reset-password');

      expect(res.statusCode).toBe(409);
      expect(errorCode(res)).toBe('USER_INACTIVE');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('deactivates the user, ends their sessions and locks them out at once', async () => {
      db.refreshTokens.push(refreshToken(1, 2), refreshToken(2, 1));

      const res = await as(ADMIN, 'DELETE', '/api/admin/users/2');

      expect(res.statusCode).toBe(204);
      expect(stored(2).isActive).toBe(false);
      expect(db.refreshTokens.map((t) => t.userId)).toEqual([1]);
      // Their unexpired access token no longer works on admin routes.
      expect((await as(OFFICER, 'GET', '/api/admin/users')).statusCode).toBe(401);
    });

    it('is a no-op for a user who is already deactivated', async () => {
      stored(2).isActive = false;

      const res = await as(ADMIN, 'DELETE', '/api/admin/users/2');

      expect(res.statusCode).toBe(204);
    });

    it('returns 403 CANNOT_MODIFY_SELF for your own account', async () => {
      const res = await as(ADMIN, 'DELETE', '/api/admin/users/1');

      expect(res.statusCode).toBe(403);
      expect(errorCode(res)).toBe('CANNOT_MODIFY_SELF');
      expect(stored(1).isActive).toBe(true);
    });
  });

  describe('POST /api/admin/users/:id/reactivate', () => {
    it('brings a user back with the chosen role and a new temporary password', async () => {
      Object.assign(stored(2), { isActive: false, role: 'SUPER_ADMIN' });

      const res = await as(ADMIN, 'POST', '/api/admin/users/2/reactivate', { role: 'USER' });

      expect(res.statusCode).toBe(200);
      const { user, temporaryPassword } = TemporaryPasswordResponseSchema.parse(res.json());
      expect(user).toMatchObject({ isActive: true, role: 'USER', mustChangePassword: true });
      expect(await verifyPassword(stored(2).passwordHash, temporaryPassword)).toBe(true);
    });

    it('returns 409 USER_ALREADY_ACTIVE for an active user, leaving their password alone', async () => {
      const res = await as(ADMIN, 'POST', '/api/admin/users/2/reactivate', { role: 'USER' });

      expect(res.statusCode).toBe(409);
      expect(errorCode(res)).toBe('USER_ALREADY_ACTIVE');
      expect(stored(2).passwordHash).toBe(OFFICER.passwordHash);
    });

    it('returns 400 when no role is given', async () => {
      stored(2).isActive = false;

      const res = await as(ADMIN, 'POST', '/api/admin/users/2/reactivate', {});

      expect(res.statusCode).toBe(400);
      expect(errorCode(res)).toBe('VALIDATION_ERROR');
    });

    it('returns 403 CANNOT_MODIFY_SELF for your own account', async () => {
      const res = await as(ADMIN, 'POST', '/api/admin/users/1/reactivate', { role: 'USER' });

      expect(res.statusCode).toBe(403);
      expect(errorCode(res)).toBe('CANNOT_MODIFY_SELF');
    });
  });

  // Through the routes, assertNotSelf already keeps the caller as a super admin. These call the
  // service directly to check the backstop for two super admins removing each other at once.
  describe('last super admin', () => {
    it('refuses to demote the only active super admin', async () => {
      await expect(changeRole(app.prisma, 99, 1, 'USER')).rejects.toMatchObject({
        statusCode: 409,
        code: 'LAST_SUPER_ADMIN',
      });
      expect(stored(1).role).toBe('SUPER_ADMIN');
    });

    it('refuses to deactivate the only active super admin', async () => {
      stored(2).role = 'SUPER_ADMIN';
      stored(2).isActive = false;

      await expect(deactivateUser(app.prisma, 99, 1)).rejects.toMatchObject({
        statusCode: 409,
        code: 'LAST_SUPER_ADMIN',
      });
      expect(stored(1).isActive).toBe(true);
    });
  });
});

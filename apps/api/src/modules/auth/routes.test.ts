import { ApiErrorSchema, AuthResponseSchema } from '@nsbe/shared';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app';
import type { User } from '../../generated/prisma/client';
import { TEST_CONFIG } from '../../test-config';
import { ACCESS_TOKEN_COOKIE } from './cookies';
import { hashPassword } from './password';

const PASSWORD = 'correct horse battery staple';

// A full database row, as findUnique would return it without a select.
// The route must never leak passwordHash, isActive or the timestamps.
function makeUser(passwordHash: string, overrides: Partial<User> = {}): User {
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

function login(app: Awaited<ReturnType<typeof buildApp>>, payload: unknown) {
  return app.inject({ method: 'POST', url: '/api/auth/login', payload: payload as object });
}

describe('POST /api/auth/login', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword(PASSWORD);
  });

  beforeEach(async () => {
    app = await buildApp(TEST_CONFIG);
    await app.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  // Tests never touch a real database: replace the one query login makes.
  function mockFindUser(user: User | null) {
    return vi.spyOn(app.prisma.user, 'findUnique').mockResolvedValue(user);
  }

  it('returns the user and sets the access token cookie on a correct login', async () => {
    const findUnique = mockFindUser(makeUser(passwordHash));

    const res = await login(app, { email: '  Elmer@Example.com ', password: PASSWORD });

    expect(res.statusCode).toBe(200);
    expect(AuthResponseSchema.parse(res.json())).toEqual({
      user: {
        id: 1,
        email: 'elmer@example.com',
        name: 'Elmer',
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
      },
    });
    expect(res.body).not.toContain('passwordHash');
    expect(res.body).not.toContain('$argon2');

    // The email is trimmed and lowercased before the lookup.
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'elmer@example.com' } }),
    );

    const cookie = res.cookies.find((c) => c.name === ACCESS_TOKEN_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 15 * 60,
    });

    const payload = app.jwt.verify<{ sub: string; role: string; iat: number; exp: number }>(
      cookie?.value ?? '',
    );
    expect(payload.sub).toBe('1');
    expect(payload.role).toBe('SUPER_ADMIN');
    expect(payload.exp - payload.iat).toBe(15 * 60);
  });

  it('returns 401 INVALID_CREDENTIALS for a wrong password', async () => {
    mockFindUser(makeUser(passwordHash));

    const res = await login(app, { email: 'elmer@example.com', password: 'wrong password' });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    expect(res.cookies).toHaveLength(0);
  });

  it('returns the same 401 for an unknown email, so emails cannot be enumerated', async () => {
    mockFindUser(null);

    const res = await login(app, { email: 'nobody@example.com', password: PASSWORD });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    expect(res.cookies).toHaveLength(0);
  });

  it('returns the same 401 for a deactivated user, even with the right password', async () => {
    mockFindUser(makeUser(passwordHash, { isActive: false }));

    const res = await login(app, { email: 'elmer@example.com', password: PASSWORD });

    expect(res.statusCode).toBe(401);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('INVALID_CREDENTIALS');
    expect(res.cookies).toHaveLength(0);
  });

  it.each([
    ['a missing password', { email: 'elmer@example.com' }],
    ['an invalid email', { email: 'not-an-email', password: PASSWORD }],
    ['an empty password', { email: 'elmer@example.com', password: '' }],
    ['a password over 256 characters', { email: 'elmer@example.com', password: 'a'.repeat(257) }],
  ])('returns 400 VALIDATION_ERROR for %s, without querying the database', async (_, body) => {
    const findUnique = mockFindUser(makeUser(passwordHash));

    const res = await login(app, body);

    expect(res.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('VALIDATION_ERROR');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('returns 500 rather than 401 when the stored hash is malformed', async () => {
    mockFindUser(makeUser('not-a-real-hash'));

    const res = await login(app, { email: 'elmer@example.com', password: PASSWORD });

    expect(res.statusCode).toBe(500);
    expect(ApiErrorSchema.parse(res.json()).error.code).toBe('INTERNAL_ERROR');
  });
});

import { describe, expect, it } from 'vitest';

import { AuthResponseSchema, LoginRequestSchema } from './auth';

describe('LoginRequestSchema', () => {
  it('trims and lowercases the email', () => {
    const parsed = LoginRequestSchema.parse({ email: '  Elmer@Example.COM ', password: 'pw' });
    expect(parsed.email).toBe('elmer@example.com');
  });

  it('rejects an invalid email, an empty password and an overlong password', () => {
    expect(LoginRequestSchema.safeParse({ email: 'nope', password: 'pw' }).success).toBe(false);
    expect(LoginRequestSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(
      LoginRequestSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(257) }).success,
    ).toBe(false);
  });
});

describe('AuthResponseSchema', () => {
  it('strips fields that are not in the schema, such as passwordHash', () => {
    const parsed = AuthResponseSchema.parse({
      user: {
        id: 1,
        email: 'a@b.co',
        name: 'A',
        role: 'USER',
        mustChangePassword: false,
        passwordHash: '$argon2id$...',
      },
    });
    expect(parsed.user).not.toHaveProperty('passwordHash');
  });
});

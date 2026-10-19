import { describe, expect, it } from 'vitest';

import { AuthResponseSchema, ChangePasswordRequestSchema, LoginRequestSchema } from './auth';

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

describe('ChangePasswordRequestSchema', () => {
  it('accepts a new password of 12+ characters that differs from the current one', () => {
    const body = { currentPassword: 'old-password', newPassword: 'a-new-long-password' };
    expect(ChangePasswordRequestSchema.parse(body)).toEqual(body);
  });

  it.each([
    ['a short new password', { currentPassword: 'old', newPassword: 'short' }],
    ['an overlong new password', { currentPassword: 'old', newPassword: 'x'.repeat(257) }],
    ['an empty current password', { currentPassword: '', newPassword: 'a-new-long-password' }],
    [
      'a new password equal to the current one',
      { currentPassword: 'same-password-123', newPassword: 'same-password-123' },
    ],
  ])('rejects %s', (_, body) => {
    expect(ChangePasswordRequestSchema.safeParse(body).success).toBe(false);
  });
});

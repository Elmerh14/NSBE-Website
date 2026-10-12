import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('verifies the password it hashed', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword(hash, 'hunter2')).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword(hash, 'hunter1')).toBe(false);
  });

  it('returns false for an empty password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword(hash, '')).toBe(false);
  });

  it('produces a different hash each time for the same password', async () => {
    const hash1 = await hashPassword('password123');
    const hash2 = await hashPassword('password123');
    expect(hash1).not.toBe(hash2);
  });

  it('uses argon2id', async () => {
    const hash = await hashPassword('password1234');
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('throws on a malformed stored hash', async () => {
    await expect(verifyPassword('not-a-real-hash', 'hunter2')).rejects.toThrow();
  });
});

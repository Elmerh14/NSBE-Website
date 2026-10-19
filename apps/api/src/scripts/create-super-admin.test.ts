import { afterEach, describe, expect, it, vi } from 'vitest';

import type { User } from '../generated/prisma/client';
import { createPrismaClient } from '../lib/prisma';
import { verifyPassword } from '../modules/auth/password';
import { TEST_CONFIG } from '../test-config';
import { createSuperAdmin, SuperAdminInputSchema } from './create-super-admin';

// A real client pointed at the fake test URL; every query it would make is mocked below.
const prisma = createPrismaClient(TEST_CONFIG.DATABASE_URL);

const CREATED_USER = {
  id: 1,
  email: 'elmer@example.com',
  name: 'Elmer',
  role: 'SUPER_ADMIN',
  mustChangePassword: true,
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SuperAdminInputSchema', () => {
  it('trims and lowercases the email and trims the name', () => {
    expect(SuperAdminInputSchema.parse({ email: ' Elmer@Example.COM ', name: ' Elmer ' })).toEqual({
      email: 'elmer@example.com',
      name: 'Elmer',
    });
  });

  it.each([
    ['a missing email', { name: 'Elmer' }],
    ['an invalid email', { email: 'nope', name: 'Elmer' }],
    ['a missing name', { email: 'elmer@example.com' }],
    ['a blank name', { email: 'elmer@example.com', name: '   ' }],
  ])('rejects %s', (_, input) => {
    expect(SuperAdminInputSchema.safeParse(input).success).toBe(false);
  });
});

describe('createSuperAdmin', () => {
  it('creates a SUPER_ADMIN who must change the random temporary password', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    const create = vi.spyOn(prisma.user, 'create').mockResolvedValue(CREATED_USER as User);

    const result = await createSuperAdmin(prisma, { email: 'elmer@example.com', name: 'Elmer' });

    expect(result.user).toEqual(CREATED_USER);
    expect(result.temporaryPassword).toMatch(/^[A-Za-z0-9_-]{24}$/);

    const data = create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({
      email: 'elmer@example.com',
      name: 'Elmer',
      role: 'SUPER_ADMIN',
      mustChangePassword: true,
    });
    // Only the argon2id hash is stored, and it matches the password shown to the admin.
    expect(data?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(data?.passwordHash).not.toContain(result.temporaryPassword);
    expect(await verifyPassword(data?.passwordHash ?? '', result.temporaryPassword)).toBe(true);
  });

  it('generates a different temporary password each time', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.user, 'create').mockResolvedValue(CREATED_USER as User);

    const first = await createSuperAdmin(prisma, { email: 'a@example.com', name: 'A' });
    const second = await createSuperAdmin(prisma, { email: 'b@example.com', name: 'B' });

    expect(first.temporaryPassword).not.toBe(second.temporaryPassword);
  });

  it('refuses to create a second user with the same email', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 1 } as User);
    const create = vi.spyOn(prisma.user, 'create');

    await expect(
      createSuperAdmin(prisma, { email: 'elmer@example.com', name: 'Elmer' }),
    ).rejects.toThrow('already exists');
    expect(create).not.toHaveBeenCalled();
  });
});

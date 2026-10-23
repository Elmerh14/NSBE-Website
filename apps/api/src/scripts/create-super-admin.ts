import { type AuthUser, LoginRequestSchema } from '@nsbe/shared';
import { z } from 'zod';

import type { PrismaClient } from '../generated/prisma/client';
import { hashPassword } from '../modules/auth/password';
import { generateTemporaryPassword } from '../modules/users/temporary-password';

export const SuperAdminInputSchema = z.object({
  // Same normalisation as login (trim + lowercase), so the account can always log in.
  email: LoginRequestSchema.shape.email,
  name: z.string().trim().min(1, 'Name is required').max(100),
});
export type SuperAdminInput = z.infer<typeof SuperAdminInputSchema>;

export type CreatedSuperAdmin = {
  user: AuthUser;
  temporaryPassword: string;
};

// Creates a SUPER_ADMIN with a random temporary password they must change on first login.
// The plain password is returned once so the caller can show it; only the hash is stored.
export async function createSuperAdmin(
  prisma: PrismaClient,
  input: SuperAdminInput,
): Promise<CreatedSuperAdmin> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`A user with the email ${input.email} already exists`);
  }

  const temporaryPassword = generateTemporaryPassword();
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(temporaryPassword),
      role: 'SUPER_ADMIN',
      mustChangePassword: true,
    },
    select: { id: true, email: true, name: true, role: true, mustChangePassword: true },
  });

  return { user, temporaryPassword };
}

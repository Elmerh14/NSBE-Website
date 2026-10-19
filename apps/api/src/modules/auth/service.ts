import type { AuthUser } from '@nsbe/shared';

import type { PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../lib/errors';
import { verifyPassword } from './password';

export async function login(
  client: PrismaClient,
  email: string,
  password: string,
): Promise<AuthUser> {
  const user = await client.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mustChangePassword: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };

  return authUser;
}

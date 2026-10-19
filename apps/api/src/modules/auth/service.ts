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

// Looks up the logged-in user for GET /api/auth/me. The token only holds id + role,
// so this reads the rest fresh, and rejects users deactivated since they logged in.
export async function getCurrentUser(client: PrismaClient, id: number): Promise<AuthUser> {
  const user = await client.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mustChangePassword: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'You must be logged in.');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

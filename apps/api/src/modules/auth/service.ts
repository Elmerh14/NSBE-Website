import type { AuthUser } from '@nsbe/shared';

import type { PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../lib/errors';
import { hashPassword, verifyPassword } from './password';
import { AUTH_USER_SELECT, revokeAllRefreshTokens } from './refresh-tokens';

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

// POST /api/auth/change-password. Also clears mustChangePassword after a temporary password,
// and logs the user out on every other device. The route then starts a fresh session here.
export async function changePassword(
  client: PrismaClient,
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<AuthUser> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, isActive: true },
  });

  if (!user?.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'You must be logged in.');
  }

  // 400, not 401: the user is logged in, they just typed the wrong current password.
  // (The admin app treats any 401 as "logged out" and would send them to the login page.)
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'Your current password is incorrect');
  }

  await revokeAllRefreshTokens(client, userId);

  return client.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
    select: AUTH_USER_SELECT,
  });
}

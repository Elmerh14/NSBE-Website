import { createHash, randomBytes } from 'node:crypto';

import type { AuthUser } from '@nsbe/shared';

import type { PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../lib/errors';
import { REFRESH_TOKEN_TTL_SECONDS } from './cookies';

// The fields of a User that the API returns (AuthUser). Never add passwordHash here.
export const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  mustChangePassword: true,
} as const;

function unauthorized() {
  return new AppError(401, 'UNAUTHORIZED', 'You must be logged in.');
}

// Refresh tokens are 32 random bytes, so unlike passwords they can't be guessed.
// A fast SHA-256 is enough to make a leaked database useless; argon2's slowness would add nothing.
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Creates a refresh token for the user. Only its hash is stored; the plain token goes in the cookie.
export async function createRefreshToken(prisma: PrismaClient, userId: number): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  });
  return token;
}

// Swaps a refresh token for a new one (rotation): each token works exactly once.
// revokedAt means "already swapped". Logout and password changes delete rows instead, so a
// token with revokedAt set can only be an old token being replayed.
export async function rotateRefreshToken(
  prisma: PrismaClient,
  token: string,
): Promise<{ user: AuthUser; refreshToken: string }> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: { ...AUTH_USER_SELECT, isActive: true } },
    },
  });

  if (!stored) {
    throw unauthorized();
  }

  // A token that was already used is being used again: someone may have stolen it.
  // Log that user out everywhere, so the thief's copy of the newer token stops working too.
  if (stored.revokedAt) {
    await revokeAllRefreshTokens(prisma, stored.userId);
    throw unauthorized();
  }

  if (stored.expiresAt <= new Date() || !stored.user.isActive) {
    throw unauthorized();
  }

  // Only revoke it if nobody else has in the meantime, so two requests can't both rotate it.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) {
    throw unauthorized();
  }

  const { id, email, name, role, mustChangePassword } = stored.user;
  return {
    user: { id, email, name, role, mustChangePassword },
    refreshToken: await createRefreshToken(prisma, stored.userId),
  };
}

// Logout: this one token stops working. Unknown tokens are ignored.
// Ending a session deletes the row; revokedAt is only set by rotation (see rotateRefreshToken).
export async function revokeRefreshToken(prisma: PrismaClient, token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashRefreshToken(token) } });
}

// Logs a user out on every device (password change, reset, deactivation, token reuse).
export async function revokeAllRefreshTokens(prisma: PrismaClient, userId: number): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

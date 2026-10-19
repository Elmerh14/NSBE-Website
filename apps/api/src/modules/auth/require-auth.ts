import type { FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors';

export async function requireAuth(request: FastifyRequest) {
  let subject: unknown;
  try {
    const payload = await request.jwtVerify<{ sub?: unknown }>({ onlyCookie: true });
    subject = payload.sub;
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Sign in to continue');
  }

  if (
    typeof subject !== 'string' ||
    !/^[1-9]\d*$/.test(subject) ||
    !Number.isSafeInteger(Number(subject)) ||
    Number(subject) > 2147483647
  ) {
    throw new AppError(401, 'UNAUTHORIZED', 'Sign in to continue');
  }

  // Check the current account, rather than trusting stale account flags in a JWT.
  const user = await request.server.prisma.user.findUnique({ where: { id: Number(subject) } });
  if (!user?.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'Sign in to continue');
  }
  if (user.mustChangePassword) {
    throw new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your password before continuing');
  }
}

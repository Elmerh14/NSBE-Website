import type { FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors';

// Runs after requireAuth on every admin route. The access token is trusted for up to 15 minutes,
// so this re-reads the account to make deactivation and role changes apply immediately,
// and blocks admin routes until a temporary password has been changed.
export async function checkAccount(request: FastifyRequest): Promise<void> {
  const account = await request.server.prisma.user.findUnique({
    where: { id: request.user.id },
    select: { role: true, isActive: true, mustChangePassword: true },
  });

  if (!account?.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'You must be logged in.');
  }

  // 403, not 401: they are logged in. The admin app sends them to the change-password page.
  if (account.mustChangePassword) {
    throw new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your temporary password first');
  }

  // Use the current role, not the one from when the token was signed.
  request.user.role = account.role;
}

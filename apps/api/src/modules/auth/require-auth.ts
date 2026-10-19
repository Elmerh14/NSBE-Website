import type { FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors';

export async function requireAuth(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'You must be logged in.');
  }
}

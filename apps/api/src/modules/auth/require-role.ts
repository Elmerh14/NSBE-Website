import type { Role } from '@nsbe/shared';
import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

import { AppError } from '../../lib/errors';

// Route-level hook for admin routes that need a specific role, e.g. user management:
//   app.get('/api/admin/users', { onRequest: requireRole('SUPER_ADMIN') }, handler)
// It runs after the admin plugin's requireAuth + checkAccount, so request.user is set and current.
export function requireRole(role: Role) {
  return (request: FastifyRequest, _reply: FastifyReply, done: HookHandlerDoneFunction): void => {
    if (request.user.role !== role) {
      // 403, not 401: we know who they are, they just aren't allowed.
      done(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));
      return;
    }
    done();
  };
}

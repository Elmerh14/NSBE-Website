import type { AdminUser, CreateUserRequest, Role, TemporaryPasswordResponse } from '@nsbe/shared';

import type { PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../lib/errors';
import { hashPassword } from '../auth/password';
import { AUTH_USER_SELECT, revokeAllRefreshTokens } from '../auth/refresh-tokens';
import { generateTemporaryPassword } from './temporary-password';

// The fields of a User the user-management page gets. Never add passwordHash here.
const ADMIN_USER_SELECT = { ...AUTH_USER_SELECT, isActive: true, createdAt: true } as const;

type AdminUserRow = Omit<AdminUser, 'createdAt'> & { createdAt: Date };

function toAdminUser(row: AdminUserRow): AdminUser {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

function notFound() {
  return new AppError(404, 'USER_NOT_FOUND', 'User not found');
}

// Super admins manage their own account through change-password, never through these routes.
// That also means the caller (an active super admin) always remains one.
function assertNotSelf(actorId: number, targetId: number) {
  if (actorId === targetId) {
    throw new AppError(403, 'CANNOT_MODIFY_SELF', 'You cannot do this to your own account');
  }
}

// There must always be at least one active SUPER_ADMIN. assertNotSelf already guarantees this
// for a single request; this also covers two super admins removing each other at the same time.
async function assertAnotherActiveSuperAdmin(client: PrismaClient, targetId: number) {
  const others = await client.user.count({
    where: { role: 'SUPER_ADMIN', isActive: true, id: { not: targetId } },
  });
  if (others === 0) {
    throw new AppError(409, 'LAST_SUPER_ADMIN', 'There must always be at least one super admin');
  }
}

async function findUser(client: PrismaClient, id: number) {
  const user = await client.user.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
  if (!user) {
    throw notFound();
  }
  return user;
}

// Active users first, then by name.
export async function listUsers(client: PrismaClient): Promise<AdminUser[]> {
  const users = await client.user.findMany({
    select: ADMIN_USER_SELECT,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  });
  return users.map(toAdminUser);
}

// Creates a user with a random temporary password they must change on first login.
// The plain password is returned once so the super admin can pass it on; only the hash is stored.
export async function createUser(
  client: PrismaClient,
  input: CreateUserRequest,
): Promise<TemporaryPasswordResponse> {
  const existing = await client.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    // Includes deactivated users: their email stays taken so their history stays linked.
    throw new AppError(409, 'EMAIL_TAKEN', 'A user with this email already exists');
  }

  const temporaryPassword = generateTemporaryPassword();
  const user = await client.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
    },
    select: ADMIN_USER_SELECT,
  });

  return { user: toAdminUser(user), temporaryPassword };
}

// Role changes apply on the user's next request: checkAccount reads the role from the database.
export async function changeRole(
  client: PrismaClient,
  actorId: number,
  targetId: number,
  role: Role,
): Promise<AdminUser> {
  assertNotSelf(actorId, targetId);
  const target = await findUser(client, targetId);

  if (target.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN' && target.isActive) {
    await assertAnotherActiveSuperAdmin(client, targetId);
  }

  const user = await client.user.update({
    where: { id: targetId },
    data: { role },
    select: ADMIN_USER_SELECT,
  });
  return toAdminUser(user);
}

// For a forgotten password: a new temporary password, and the user is logged out everywhere.
export async function resetPassword(
  client: PrismaClient,
  actorId: number,
  targetId: number,
): Promise<TemporaryPasswordResponse> {
  assertNotSelf(actorId, targetId);
  const target = await findUser(client, targetId);

  if (!target.isActive) {
    throw new AppError(409, 'USER_INACTIVE', 'This user has been deactivated');
  }

  const temporaryPassword = generateTemporaryPassword();
  await revokeAllRefreshTokens(client, targetId);
  const user = await client.user.update({
    where: { id: targetId },
    data: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true },
    select: ADMIN_USER_SELECT,
  });

  return { user: toAdminUser(user), temporaryPassword };
}

// "Delete" is a soft delete: the row stays so history (e.g. who uploaded a photo) stays linked.
// Their sessions end now; checkAccount rejects their access token on the next admin request.
export async function deactivateUser(
  client: PrismaClient,
  actorId: number,
  targetId: number,
): Promise<void> {
  assertNotSelf(actorId, targetId);
  const target = await findUser(client, targetId);

  if (!target.isActive) {
    return;
  }

  if (target.role === 'SUPER_ADMIN') {
    await assertAnotherActiveSuperAdmin(client, targetId);
  }

  await revokeAllRefreshTokens(client, targetId);
  await client.user.update({ where: { id: targetId }, data: { isActive: false } });
}

// Brings back a deactivated user, e.g. a member returning after a semester away.
// Like a new user they get a temporary password: an old one nobody used for months shouldn't
// quietly work again. The role is chosen again rather than restored.
export async function reactivateUser(
  client: PrismaClient,
  actorId: number,
  targetId: number,
  role: Role,
): Promise<TemporaryPasswordResponse> {
  assertNotSelf(actorId, targetId);
  const target = await findUser(client, targetId);

  // Reactivating also replaces the password, so don't let it happen to an active user by mistake.
  if (target.isActive) {
    throw new AppError(409, 'USER_ALREADY_ACTIVE', 'This user is already active');
  }

  const temporaryPassword = generateTemporaryPassword();
  const user = await client.user.update({
    where: { id: targetId },
    data: {
      isActive: true,
      role,
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
    },
    select: ADMIN_USER_SELECT,
  });

  return { user: toAdminUser(user), temporaryPassword };
}

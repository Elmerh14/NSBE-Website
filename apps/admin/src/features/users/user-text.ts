import { type Role, RoleSchema } from '@nsbe/shared';

import { ApiRequestError } from '../../lib/api';

// USER is shown as "Admin": every account here can use the admin app.
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  USER: 'Admin',
};

export const ROLE_OPTIONS = RoleSchema.options;

const ERROR_MESSAGES = new Map([
  ['EMAIL_TAKEN', 'A user with this email already exists.'],
  ['LAST_SUPER_ADMIN', 'There must always be at least one active super admin.'],
  ['CANNOT_MODIFY_SELF', "You can't do this to your own account."],
  ['USER_NOT_FOUND', 'This user no longer exists.'],
  ['USER_INACTIVE', 'This user has been deactivated. Reactivate them first.'],
  ['USER_ALREADY_ACTIVE', 'This user is already active.'],
]);

// What to show when a user-management request fails. Unknown errors get a generic message.
export function userErrorMessage(error: unknown) {
  const message = error instanceof ApiRequestError ? ERROR_MESSAGES.get(error.code) : undefined;
  return message ?? 'Something went wrong. Please try again.';
}

export function formatJoinedDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

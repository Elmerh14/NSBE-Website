import { z } from 'zod';

import { AuthUserSchema, LoginRequestSchema, RoleSchema } from './auth';

// A user as the user-management page sees it. API dates are ISO strings, not Date objects.
export const AdminUserSchema = AuthUserSchema.extend({
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

// 200 response of GET /api/admin/users.
export const UsersResponseSchema = z.object({
  users: z.array(AdminUserSchema),
});
export type UsersResponse = z.infer<typeof UsersResponseSchema>;

// 200 response of PATCH /api/admin/users/:id.
export const UserResponseSchema = z.object({
  user: AdminUserSchema,
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

// Body of POST /api/admin/users.
export const CreateUserRequestSchema = z.strictObject({
  // Same normalisation as login (trim + lowercase), so the new user can always log in.
  email: LoginRequestSchema.shape.email,
  name: z.string().trim().min(1, 'Name is required').max(100),
  role: RoleSchema,
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

// Body of PATCH /api/admin/users/:id.
export const UpdateUserRequestSchema = z.strictObject({
  role: RoleSchema,
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// Body of POST /api/admin/users/:id/reactivate. The role is chosen again on purpose:
// someone returning after a semester away may not have their old position.
export const ReactivateUserRequestSchema = z.strictObject({
  role: RoleSchema,
});
export type ReactivateUserRequest = z.infer<typeof ReactivateUserRequestSchema>;

// Response of POST /api/admin/users (201), and of .../:id/reset-password and .../:id/reactivate (200).
// The temporary password is only ever sent here, once; the API stores just its hash.
export const TemporaryPasswordResponseSchema = z.object({
  user: AdminUserSchema,
  temporaryPassword: z.string(),
});
export type TemporaryPasswordResponse = z.infer<typeof TemporaryPasswordResponseSchema>;

// Route parameters arrive as strings. Accept only positive decimal integer IDs.
export const UserParamsSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.int().positive()),
});
export type UserParams = z.infer<typeof UserParamsSchema>;

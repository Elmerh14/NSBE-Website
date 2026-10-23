import { z } from 'zod';

// Must match `enum Role` in apps/api/prisma/schema.prisma.
export const RoleSchema = z.enum(['SUPER_ADMIN', 'USER']);
export type Role = z.infer<typeof RoleSchema>;

// Body of POST /api/auth/login. Also used by the admin login form.
export const LoginRequestSchema = z.object({
  // Trimmed and lowercased before the email check, so "Elmer@Example.com " finds the same user as "elmer@example.com".
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  // No strength rules here: login only checks the password, it doesn't set one.
  // The max length stops someone making the server hash a huge string.
  password: z.string().min(1, 'Enter your password').max(256),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// The signed-in user as the API returns it. Never add passwordHash here.
export const AuthUserSchema = z.object({
  id: z.number().int(),
  email: z.email(),
  name: z.string(),
  role: RoleSchema,
  mustChangePassword: z.boolean(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

// 200 response of POST /api/auth/login (and later GET /api/auth/me).
export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Rules for any password a user chooses. Length beats complexity rules (NIST SP 800-63B).
export const NewPasswordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(256, 'Use at most 256 characters');

const ChangePasswordFieldsSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(256),
  newPassword: NewPasswordSchema,
});

const newPasswordDiffers = (body: { currentPassword: string; newPassword: string }) =>
  body.newPassword !== body.currentPassword;
const NEW_PASSWORD_SAME_MESSAGE = 'Choose a password different from your current one';

// Body of POST /api/auth/change-password.
export const ChangePasswordRequestSchema = ChangePasswordFieldsSchema.refine(newPasswordDiffers, {
  message: NEW_PASSWORD_SAME_MESSAGE,
  path: ['newPassword'],
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

// The admin's change-password form: the request body plus a "type it again" field,
// because a typo in a new password locks the user out until a super admin resets it.
export const ChangePasswordFormSchema = ChangePasswordFieldsSchema.extend({
  confirmPassword: z.string(),
})
  .refine(newPasswordDiffers, { message: NEW_PASSWORD_SAME_MESSAGE, path: ['newPassword'] })
  .refine((form) => form.confirmPassword === form.newPassword, {
    message: 'The passwords do not match',
    path: ['confirmPassword'],
  });
export type ChangePasswordForm = z.infer<typeof ChangePasswordFormSchema>;

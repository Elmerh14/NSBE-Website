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

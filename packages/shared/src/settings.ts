import { z } from 'zod';

// Site-wide values shown in the public footer. Every field is optional: null means "not set",
// and the footer leaves that item out.
export const SiteSettingsSchema = z.object({
  contactEmail: z.email().nullable(),
  joinUrl: z.url().nullable(),
  instagramUrl: z.url().nullable(),
  linkedinUrl: z.url().nullable(),
  tiktokUrl: z.url().nullable(),
  facebookUrl: z.url().nullable(),
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

// 200 response of GET /api/settings and PUT /api/admin/settings.
export const SiteSettingsResponseSchema = z.object({
  settings: SiteSettingsSchema,
});
export type SiteSettingsResponse = z.infer<typeof SiteSettingsResponseSchema>;

// A blank or whitespace-only value becomes null (cleared); anything else is trimmed and checked.
function optional(schema: z.ZodType<string, string>) {
  return z
    .string()
    .trim()
    .max(2048, 'This is too long')
    .transform((value) => (value === '' ? null : value))
    .pipe(schema.nullable())
    .nullable();
}

// Links are rendered as <a href>, so only https is allowed (no javascript: or http: links).
function httpsUrl(message: string, hostname?: RegExp) {
  return z.url({ protocol: /^https$/, ...(hostname ? { hostname } : {}), message });
}

// A social link must point at that platform, with or without "www.".
function socialUrl(domain: string, name: string) {
  const hostname = new RegExp(`^(www\\.)?${domain.replaceAll('.', '\\.')}$`);
  return optional(httpsUrl(`Enter a ${name} link starting with https://${domain}/`, hostname));
}

// Body of PUT /api/admin/settings, and the admin Settings form. It replaces every field, so all
// six are required keys; send null or '' to clear one.
export const UpdateSiteSettingsRequestSchema = z.strictObject({
  contactEmail: optional(z.email('Enter a valid email address')),
  joinUrl: optional(httpsUrl('Enter a link starting with https://')),
  instagramUrl: socialUrl('instagram.com', 'Instagram'),
  linkedinUrl: socialUrl('linkedin.com', 'LinkedIn'),
  tiktokUrl: socialUrl('tiktok.com', 'TikTok'),
  facebookUrl: socialUrl('facebook.com', 'Facebook'),
});
export type UpdateSiteSettingsRequest = z.infer<typeof UpdateSiteSettingsRequestSchema>;

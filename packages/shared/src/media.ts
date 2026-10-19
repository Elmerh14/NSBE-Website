import { z } from 'zod';

/**
 * Shared media contract used by the API and both frontends.
 *
 * Flow:
 * 1. Admin asks for a presigned upload URL (mime + size).
 * 2. Browser PUTs the file straight to Filebase.
 * 3. Admin saves a Media row so the rest of the app can reference it.
 */

export const MediaTypeSchema = z.enum(['IMAGE', 'VIDEO']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

/** One stored file in Filebase, tracked in the database. */
export const MediaSchema = z.object({
  id: z.number().int(),
  s3Key: z.string().min(1),
  type: MediaTypeSchema,
  mime: z.string().min(1),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  alt: z.string().nullable(),
  uploadedById: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Media = z.infer<typeof MediaSchema>;

/** Body for POST /api/admin/media/upload-url */
export const UploadUrlRequestSchema = z.object({
  mime: z.string().min(1),
  size: z.number().int().positive(),
});
export type UploadUrlRequest = z.infer<typeof UploadUrlRequestSchema>;

/** Response from POST /api/admin/media/upload-url */
export const UploadUrlResponseSchema = z.object({
  uploadUrl: z.url(),
  s3Key: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});
export type UploadUrlResponse = z.infer<typeof UploadUrlResponseSchema>;

/** Body for POST /api/admin/media (save metadata after a successful upload). */
export const CreateMediaRequestSchema = z.object({
  s3Key: z.string().min(1),
  type: MediaTypeSchema,
  mime: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().max(500).optional(),
});
export type CreateMediaRequest = z.infer<typeof CreateMediaRequestSchema>;

/** Query for GET /api/admin/media */
export const MediaListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  type: MediaTypeSchema.optional(),
});
export type MediaListQuery = z.infer<typeof MediaListQuerySchema>;

export const MediaListResponseSchema = z.object({
  items: z.array(MediaSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type MediaListResponse = z.infer<typeof MediaListResponseSchema>;

/** Params for DELETE /api/admin/media/:id. Route params arrive as strings. */
export const MediaIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type MediaIdParams = z.infer<typeof MediaIdParamsSchema>;

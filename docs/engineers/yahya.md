# Yahya — Media, Leadership & About

Owns how photos and videos get into the system (uploads, storage, the media library), plus the leadership section and the about page.

## Features owned

| Feature       | DB                                                            | API                                                                                                                      | Admin UI                                                                                                      | Public UI                                                          |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Media uploads | `Media`                                                       | `POST /api/admin/media/upload-url` (presign), `POST /api/admin/media` (save after upload), `DELETE /api/admin/media/:id` | Upload component with progress; reusable **media picker** used by hero, leadership, events, sponsors, gallery | Helper for building media URLs + responsive image/video components |
| Media library | `Media`                                                       | `GET /api/admin/media` (paginated, filter by type)                                                                       | Media library page: browse, alt text, delete                                                                  | —                                                                  |
| Leadership    | `LeadershipMember`                                            | `GET /api/leadership`, `/api/admin/leadership` CRUD + reorder                                                            | Leadership editor with drag-to-reorder                                                                        | Leadership page (e-board, chairs)                                  |
| About         | — (static content or `SiteSettings` fields, agree with Elmer) | —                                                                                                                        | —                                                                                                             | About page                                                         |

## Security responsibilities

- Allow-list of MIME types (e.g. `image/jpeg`, `image/png`, `image/webp`, `video/mp4`) and size limits per type, checked **before** issuing a presigned URL.
- Presigned URLs are short-lived (a few minutes) and tied to one generated object key. The client never chooses the key.
- R2 bucket CORS: allow PUT only from the admin origin(s); public read only through the media domain.
- Dev keys can only access `nsbe-media-dev`.

## Infra responsibilities

- R2 bucket setup alongside Elmer: CORS rules and the public custom domain (`media.<domain>`).
- Cloudflare Pages projects for `apps/web` and `apps/admin`: build settings, env vars, PR previews.

## Hand-written tasks

Write these yourself. Your agent will explain and review, but won't write them.

| Layer    | Task                                                                  | What you'll learn                                                                                      |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| DB       | `Media` model + its relation to `LeadershipMember` (`photo_media_id`) | Prisma relations, foreign keys, optional relations, `onDelete` behaviour                               |
| API      | Presign-upload route (`POST /api/admin/media/upload-url`)             | S3 API concepts (bucket, key, presigning), generating safe object keys, Fastify + zod                  |
| Security | MIME-type and size validation before issuing a presigned URL          | Why you never trust client input, allow-lists vs block-lists, what an attacker could upload otherwise  |
| Frontend | Upload component: direct PUT to R2 with a progress bar                | Browser file APIs, `XMLHttpRequest` upload progress (or equivalent), handling errors and retries in UI |
| Infra    | Cloudflare Pages deploy config for web + admin                        | Static hosting, build commands in a monorepo, environment variables at build time, preview deploys     |

## Order of work

1. **Week 1:** scaffold with the team; agree on the `packages/shared` media schemas.
2. **Weeks 2–3:** `Media` model → presign route + validation → upload component → save-media endpoint → media picker → `LeadershipMember` + leadership API → leadership editor + public page.
3. **Weeks 4–5:** media library page → about page → R2 CORS + public domain.
4. **Week 6:** Cloudflare Pages production deploys for web + admin.

## Depends on / provides

- **Provides** the media picker and media URL helpers. Elmer (hero) and Abduraheem (events, sponsors, gallery) need them, so ship a basic picker early.
- **Depends on** Elmer's `requireAuth` and admin layout.

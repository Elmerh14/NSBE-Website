# Yahya — Media library, Leadership & About

Owns the media library, the leadership section and the about page. Media uploads (presign, upload component, media picker, presigned GET helper) moved to Elmer on 2026-10-26, because the hero was blocked on them.

## Features owned

| Feature       | DB                                                            | API                                                           | Admin UI                                                                | Public UI                         |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Media library | `Media`                                                       | `GET /api/admin/media` (paginated, filter by type)            | Media library page: browse, alt text, delete                            | —                                 |
| Leadership    | `LeadershipMember`                                            | `GET /api/leadership`, `/api/admin/leadership` CRUD + reorder | Leadership editor with drag-to-reorder (photo via Elmer's media picker) | Leadership page (e-board, chairs) |
| About         | — (static content or `SiteSettings` fields, agree with Elmer) | —                                                             | —                                                                       | About page                        |

## Security responsibilities

- Bucket CORS (set through Filebase's S3 API, e.g. `aws s3api put-bucket-cors --endpoint-url https://s3.filebase.io`): allow PUT only from the admin origin(s), and GET from the web and admin origins.
- The bucket stays **private**. Reads go through presigned GET URLs (max 7 days) that the API signs; never make objects public.
- There is one bucket for dev and prod (free plan limit), so the access key and secret key stay out of git and out of the browser.

## Infra responsibilities

- Filebase bucket setup (one private bucket) alongside Elmer: CORS rules.
- Cloudflare Pages projects for `apps/web` and `apps/admin`: build settings, env vars, PR previews.

## Hand-written tasks

Write these yourself. Your agent will explain and review, but won't write them.

The presign route, MIME/size validation and upload component used to be here. They moved to Elmer with media uploads on 2026-10-26 and are no longer hand-written.

| Layer | Task                                                                  | What you'll learn                                                                                  |
| ----- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| DB    | `Media` model + its relation to `LeadershipMember` (`photo_media_id`) | Prisma relations, foreign keys, optional relations, `onDelete` behaviour                           |
| Infra | Cloudflare Pages deploy config for web + admin                        | Static hosting, build commands in a monorepo, environment variables at build time, preview deploys |

## Order of work

1. **Week 1:** scaffold with the team; agree on the `packages/shared` media schemas.
2. **Weeks 2–3:** `Media` model → `LeadershipMember` + leadership API → leadership editor (photo via Elmer's media picker) + public page.
3. **Weeks 4–5:** media library page → about page → bucket CORS.
4. **Week 6:** Cloudflare Pages production deploys for web + admin.

## Depends on / provides

- **Depends on** Elmer's `requireAuth` and admin layout, and Elmer's media picker + presigned GET helper (leadership photos, media library).

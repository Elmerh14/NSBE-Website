# NSBE Website — Architecture

The shared reference for how the NSBE chapter website is built and who builds what. If code and this document disagree, fix one of them in the same PR.

## Overview

Two websites backed by one API:

- **Public site** — what visitors see: home, about, leadership, events, etc.
- **Admin panel** — a separate, login-only site where officers edit the public site's content (hero photo/video, leadership photos and bios, events, sponsors, gallery, settings).

```
            visitors                     admins
               │                           │
       ┌───────▼────────┐         ┌────────▼───────┐
       │  apps/web      │         │  apps/admin    │
       │  nsbe.<domain> │         │ admin.<domain> │
       └───────┬────────┘         └────────┬───────┘
               │  GET content              │  login + edit (cookies)
               └────────────┬──────────────┘
                    ┌───────▼────────┐
                    │  apps/api      │──────► Neon Postgres (Prisma)
                    │ api.<domain>   │
                    └───────┬────────┘
                            │ presigned upload URL
       browser uploads ─────▼─────► Firebase Storage (Google Cloud Storage)
```

## Tech stack

| Layer                     | Choice                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Frontends                 | React + TypeScript + Vite                                                                                      |
| Routing / data / forms    | React Router, TanStack Query, react-hook-form + zod                                                            |
| Styling                   | Tailwind CSS                                                                                                   |
| Backend                   | Node + TypeScript + Fastify                                                                                    |
| Validation / API contract | zod schemas in `packages/shared`, wired into Fastify via `fastify-type-provider-zod`                           |
| Database                  | PostgreSQL on Neon, accessed with Prisma                                                                       |
| Media storage             | Firebase Storage / Google Cloud Storage, used through `@aws-sdk/client-s3` against GCS's S3-compatible XML API |
| Auth                      | Email + password, argon2id hashes, JWTs in httpOnly cookies                                                    |
| Tests                     | Vitest                                                                                                         |
| Tooling                   | pnpm workspaces, ESLint, Prettier, Husky + lint-staged, GitHub Actions                                         |

## Repo layout

```
apps/
  web/          public site (React + Vite)
  admin/        admin panel (React + Vite), deployed separately
  api/          Fastify backend + Prisma schema/migrations
packages/
  shared/       zod schemas + inferred types — the API contract all apps import
  ui/           (optional) shared components / design tokens
docs/
  architecture.md
  engineers/    one brief per engineer (elmer.md, yahya.md, abduraheem.md)
AGENTS.md       rules for every coding agent (Codex reads it directly)
CLAUDE.md       imports AGENTS.md for Claude Code
.env.example    every env var the apps need, no secrets
```

Why the admin panel is its own app: admin code never ships to public visitors, it can live on its own subdomain, and it keeps the two frontends from tangling.

## Backend (`apps/api`)

- Fastify server organised by feature: `src/modules/<feature>/routes.ts` and `service.ts`.
- **Public read endpoints**, no auth: `GET /api/hero`, `/api/leadership`, `/api/events`, `/api/sponsors`, `/api/gallery`, `/api/settings`.
- **Admin endpoints** under `/api/admin/*`, guarded by `requireAuth` (and `requireRole('SUPER_ADMIN')` where needed).
- Every request body and response is validated against a zod schema from `packages/shared`.

### Media uploads

1. Admin app asks the API for an upload URL, sending the file's type and size.
2. API checks the type (allowed image/video MIME types) and size limit, then returns a short-lived **presigned PUT URL** for the storage bucket.
3. The browser uploads the file straight to the bucket. Large files such as the hero video never pass through the API.
4. Admin app tells the API the upload finished; the API saves a `Media` row.
5. Public site loads media from the bucket's public URL (`MEDIA_PUBLIC_URL`).

#### S3 SDK against Google Cloud Storage

Firebase Storage buckets are ordinary Google Cloud Storage buckets. GCS offers an S3-compatible XML API, so the API keeps using the AWS SDK:

- Credentials are a GCS **HMAC key** (Google Cloud Console → Cloud Storage → Settings → Interoperability), tied to a service account that can only access its bucket.
- Client config: `endpoint: S3_ENDPOINT` (`https://storage.googleapis.com`), `region: 'auto'`, and `requestChecksumCalculation` / `responseChecksumValidation` set to `'WHEN_REQUIRED'`. GCS rejects the checksum headers newer AWS SDK versions send by default.
- Firebase Security Rules do **not** apply on this path; access is controlled by Google Cloud IAM. Only the API holds the key; the browser only ever gets a short-lived presigned URL.

## Auth & access

- **No public sign-up.** A super admin creates every account.
- Passwords hashed with **argon2id**. The database stores only `password_hash`, never the password.
- **Tokens**
  - Access JWT, about 15 minutes, in an `httpOnly; Secure; SameSite=Strict` cookie.
  - Refresh token, about 7 days, in an httpOnly cookie. Stored **hashed** in `refresh_tokens` and rotated on every refresh.
  - Tokens never go in `localStorage` (any script on the page could read them).
  - Because refresh tokens live in the database, logging out or deactivating a user cuts access off immediately.
- `@fastify/jwt` + `@fastify/cookie`; `requireAuth` / `requireRole` preHandler hooks.
- Login is rate limited with `@fastify/rate-limit`.

### Roles

| Role          | Can do                                                               |
| ------------- | -------------------------------------------------------------------- |
| `SUPER_ADMIN` | Add users, delete users, change a user's role, edit all site content |
| `USER`        | Edit all site content. Cannot see user management.                   |

Rules:

- There must always be at least one `SUPER_ADMIN`. Deleting or demoting the last one is blocked.
- A super admin cannot delete or demote themselves.
- "Delete" is a soft delete: `is_active = false` and their refresh tokens are revoked. History such as who uploaded a photo is kept.

### Account lifecycle

1. The first super admin is created with a seed script: `pnpm --filter api seed:admin`.
2. A super admin adds a user with name, email, role and a **temporary password**, and shares it with them.
3. The new user has `must_change_password = true`; the API blocks every other admin route until they set their own password.
4. Forgotten password: a super admin sets a new temporary password, which also revokes that user's sessions.

## Data model (initial)

| Table                | Fields                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `users`              | id, email, name, password_hash, role (`SUPER_ADMIN` \| `USER`), must_change_password, is_active, timestamps |
| `refresh_tokens`     | id, user_id, token_hash, expires_at, revoked_at                                                             |
| `media`              | id, s3_key, type (`IMAGE` \| `VIDEO`), mime, width, height, alt, uploaded_by                                |
| `hero`               | singleton: media_id, headline, subheadline, cta_text, cta_link                                              |
| `leadership_members` | name, position, major, year, bio, photo_media_id, linkedin, sort_order, term                                |
| `events`             | title, description, starts_at, ends_at, location, image_media_id, rsvp_link                                 |
| `sponsors`           | name, logo_media_id, tier, url                                                                              |
| `gallery_items`      | media_id, caption, sort_order                                                                               |
| `site_settings`      | singleton: social links, contact email, join link                                                           |

## Pages

**Public site (`apps/web`)**

- Home: hero (photo or video), mission, upcoming events, sponsors strip
- About: mission, history, NSBE national/region/zone
- Leadership: e-board and chairs
- Events
- Programs / Committees
- Gallery
- Sponsors / Partners
- Join / Contact

**Admin panel (`apps/admin`)**

- Login, and forced password change
- Dashboard
- Hero editor: photo/video toggle with preview
- Leadership: create, edit, delete, drag to reorder
- Events, Sponsors, Gallery
- Media library
- Site settings: footer socials, contact email, join link
- User management: `SUPER_ADMIN` only

## Environments & secrets

There is **no local infrastructure** (no Docker). Elmer provisions the hosted services and shares connection strings privately, never in git.

- **Neon**
  - `main` branch = production.
  - One branch per engineer: `dev-elmer`, `dev-yahya`, `dev-abduraheem`.
  - Each engineer runs `prisma migrate dev` only against their own branch. Prisma can reset a database it thinks has drifted, which would wipe a shared one.
  - Production only changes through `prisma migrate deploy` during a release.
- **Firebase Storage (GCS)**: `nsbe-media-dev` for development, `nsbe-media-prod` for the live site, both in the chapter's Firebase project (Blaze plan required for Storage). Bucket names are global in GCS, so the final names may need a suffix.
- **Setup**: copy `.env.example` to `.env` and paste in your values. `.env` is gitignored.

| Variable                                    | Used by         | Purpose                             |
| ------------------------------------------- | --------------- | ----------------------------------- |
| `DATABASE_URL`                              | api             | Neon pooled connection string       |
| `DIRECT_URL`                                | api             | Neon direct connection (migrations) |
| `JWT_SECRET`                                | api             | Signs access tokens                 |
| `S3_ENDPOINT`                               | api             | `https://storage.googleapis.com`    |
| `S3_REGION`                                 | api             | `auto` for GCS                      |
| `S3_BUCKET`                                 | api             | Bucket name                         |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | api             | GCS HMAC key                        |
| `MEDIA_PUBLIC_URL`                          | api, web, admin | Public base URL for media           |
| `WEB_ORIGIN` / `ADMIN_ORIGIN`               | api             | Allowed CORS origins                |
| `VITE_API_URL`                              | web, admin      | API base URL                        |

## Hosting

| Piece     | Service                           | Notes                                                                                                                            |
| --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Database  | Neon (free tier)                  | Pooled URL for the app, direct URL for migrations                                                                                |
| Media     | Firebase Storage (GCS)            | Download (egress) is billed beyond the free allowance; watch the hero video. Any S3-compatible store works by changing env vars. |
| Frontends | Cloudflare Pages                  | Two projects, `web` and `admin`, each with PR preview deploys                                                                    |
| API       | Render (Docker)                   | Free tier sleeps when idle; consider the ~$7/mo plan at launch                                                                   |
| Domain    | Custom domain or school subdomain | **Required.** Cookies only work when web, admin and API share one parent domain.                                                 |

The public site caches content (`Cache-Control` + TanStack Query), so a sleeping API doesn't leave the page blank.

## Code style & consistency

The tools below enforce one style, whoever or whatever writes the code.

- **Prettier**: one root config. Formatting is never debated.
- **ESLint** (root flat config):
  - `typescript-eslint` strict type-checked rules
  - React hooks and react-refresh rules
  - import ordering
- **`tsconfig.base.json`**: `strict: true`, extended by every app and package.
- **`.editorconfig`**: indentation and line endings.
- **Husky + lint-staged**: a pre-commit hook formats and lints staged files.
- **GitHub Actions CI** on every PR runs `format:check`, `lint`, `typecheck` and `test`.
- **Branch protection on `main`**: CI must pass and another engineer must approve. No direct pushes.

The conventions agents must follow are in [`AGENTS.md`](../AGENTS.md).

## Team & work split

Each engineer owns whole features end to end: Prisma model → API routes → admin UI → public page → their piece of infra.

|          | Elmer                                                  | Yahya                                                 | Abduraheem                                                |
| -------- | ------------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------- |
| Features | Auth, user management, hero + home page, site settings | Media uploads + media library, leadership, about page | Events, sponsors, gallery, join/contact page              |
| DB       | `User`, `RefreshToken`, `Hero`, `SiteSettings`         | `Media`, `LeadershipMember`                           | `Event`, `Sponsor`, `GalleryItem`                         |
| Security | Password hashing, JWT + refresh, role guards           | Upload validation, bucket CORS, bucket access         | CORS, rate limiting, security headers (`@fastify/helmet`) |
| Infra    | API deploy on Render, CI pipeline                      | Storage buckets, Cloudflare Pages for web + admin     | Neon branches + migration-on-deploy, domain/DNS           |

Elmer is project lead and provisions accounts and credentials.

### Hand-written work (~10%)

About 90% of the work is AI-assisted. About 10% is written **by hand**, chosen so everyone writes one piece of every layer. Coding agents must not write these; they explain, hint and review instead (see `AGENTS.md`).

| Layer    | Elmer                               | Yahya                                                 | Abduraheem                                       |
| -------- | ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| DB       | `User` model + first migration      | `Media` model + relation to `LeadershipMember`        | `Event` model + migration                        |
| API      | `POST /api/auth/login`              | presign-upload route                                  | events CRUD routes with zod validation           |
| Security | argon2 hashing + `requireAuth` hook | type/size checks before issuing a presigned URL       | `@fastify/rate-limit` on login + CORS config     |
| Frontend | admin login form + auth state       | upload component (direct PUT to bucket with progress) | public Events page with data fetching            |
| Infra    | GitHub Actions CI workflow          | Cloudflare Pages deploy config                        | Neon branch setup + `prisma migrate deploy` step |

Every PR lists its hand-written files in the PR template. A different engineer reviews them, and the author should be able to explain them line by line.

Per-engineer details: [`docs/engineers/`](engineers/).

## Milestones

| When      | Work                                                                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Week 1    | **Foundation, together:** monorepo scaffold, lint/format/CI tooling, `.env.example`, Prisma schema v1, `packages/shared` conventions. Elmer provisions Neon branches and storage buckets. |
| Weeks 2–3 | **Core:** Elmer does auth + users; Yahya does media uploads + leadership; Abduraheem does events. Each end to end.                                                                        |
| Weeks 4–5 | **Content:** Elmer does hero/home + settings; Yahya does the media library + about; Abduraheem does sponsors, gallery and contact.                                                        |
| Week 6    | **Launch:** production Neon/Firebase Storage/Render/Pages setup, domain and cookies verified, real content entered, polish.                                                               |

## Open decisions

- Render free or paid API plan at launch.
- Domain name.
- Media URL: serve from `storage.googleapis.com/<bucket>` (default) or a custom `media.<domain>`. A custom domain on GCS needs either a bucket named after the domain behind a proxy (e.g. Cloudflare) or a paid load balancer.

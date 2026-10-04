# Abduraheem — Events, Sponsors, Gallery & Contact

Owns the chapter's activity content (events, sponsors, gallery), the join/contact page, and the API's network-level security plus database operations.

## Features owned

| Feature               | DB                                 | API                                                         | Admin UI                                                | Public UI                                                     |
| --------------------- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Events                | `Event`                            | `GET /api/events` (upcoming/past), `/api/admin/events` CRUD | Events editor (uses Yahya's media picker for the image) | Events page; "upcoming events" data for Elmer's home page     |
| Sponsors              | `Sponsor`                          | `GET /api/sponsors`, `/api/admin/sponsors` CRUD             | Sponsors editor (logo via media picker, tier)           | Sponsors/Partners page; sponsors strip data for the home page |
| Gallery               | `GalleryItem`                      | `GET /api/gallery`, `/api/admin/gallery` CRUD + reorder     | Gallery editor                                          | Gallery page                                                  |
| Join / Contact        | — (uses `SiteSettings` from Elmer) | —                                                           | —                                                       | Join/Contact page                                             |
| Programs / Committees | — (static to start)                | —                                                           | —                                                       | Programs page                                                 |

## Security responsibilities

- `@fastify/cors`: allow only `WEB_ORIGIN` and `ADMIN_ORIGIN`, with credentials for the admin origin.
- `@fastify/rate-limit`: strict limit on `POST /api/auth/login`, a sensible global limit elsewhere.
- `@fastify/helmet`: security headers.
- Input validation on every events, sponsors and gallery route via the shared zod schemas.

## Infra responsibilities

- Neon branch workflow with Elmer: document how each engineer uses their own branch and how to refresh it from `main`.
- Migration-on-deploy: run `prisma migrate deploy` against production as part of the API release.
- Domain/DNS on Cloudflare: `nsbe.<domain>`, `admin.`, `api.`, `media.`.

## Hand-written tasks

Write these yourself. Your agent will explain and review, but won't write them.

| Layer    | Task                                                            | What you'll learn                                                                                    |
| -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| DB       | `Event` model + its migration                                   | Dates and time zones in Postgres (`timestamptz`), indexes for "upcoming" queries, migration workflow |
| API      | Events CRUD routes with zod validation                          | REST design (verbs, status codes, 404 vs 400), Fastify + zod type provider, service/route separation |
| Security | `@fastify/rate-limit` on login + CORS configuration             | What CORS protects against (and what it doesn't), credentials + origins, brute-force mitigation      |
| Frontend | Public Events page with TanStack Query                          | Data fetching, loading/error states, caching, splitting upcoming vs past events, date formatting     |
| Infra    | Neon branch setup + `prisma migrate deploy` step in the release | Database branching, why dev and prod migrations differ, safe production schema changes               |

## Order of work

1. **Week 1:** scaffold with the team; Neon branch setup (hand-written); agree on the `packages/shared` events schemas.
2. **Weeks 2–3:** `Event` model → events CRUD routes → admin events editor → public events page → CORS + rate limiting + helmet.
3. **Weeks 4–5:** sponsors → gallery → join/contact + programs pages.
4. **Week 6:** migrate-on-deploy step, DNS records for all subdomains.

## Depends on / provides

- **Provides** the events and sponsors data that Elmer's home page uses, and the CORS/rate-limit setup the whole API needs.
- **Depends on** Elmer's `requireAuth` and admin layout, Yahya's media picker, and Elmer's `SiteSettings` (contact page).

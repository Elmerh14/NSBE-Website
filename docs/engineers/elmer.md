# Elmer — Auth, Users, Hero & Settings

Project lead. Owns everything to do with logging in and who has access, plus the home page hero and site-wide settings. Also provisions the hosted services and shares credentials with the team.

## Features owned

| Feature         | DB                     | API                                                                                                  | Admin UI                                                              | Public UI                                                                       |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Auth            | `User`, `RefreshToken` | `POST /api/auth/login`, `/logout`, `/refresh`, `/change-password`, `GET /api/auth/me`                | Login page, forced password change, auth state / route guard          | —                                                                               |
| User management | `User`                 | `/api/admin/users` (list, create, change role, reset temp password, deactivate). `SUPER_ADMIN` only. | Users page                                                            | —                                                                               |
| Hero            | `Hero`                 | `GET /api/hero`, `PUT /api/admin/hero`                                                               | Hero editor: photo/video toggle + preview, using Yahya's media picker | Home page hero section                                                          |
| Site settings   | `SiteSettings`         | `GET /api/settings`, `PUT /api/admin/settings`                                                       | Settings page                                                         | Footer (socials, contact email, join link)                                      |
| Home page       | —                      | —                                                                                                    | —                                                                     | Home layout: hero, mission, upcoming events (Abduraheem's data), sponsors strip |

Plus the seed script: `pnpm --filter api seed:admin`.

## Security responsibilities

- argon2id password hashing and verification.
- Access JWT (about 15 min) and refresh token (about 7 days) in httpOnly, Secure, SameSite=Strict cookies.
- Refresh tokens stored hashed and rotated on every use; revoked on logout, deactivation and password reset.
- `requireAuth` and `requireRole` hooks; block other admin routes while `must_change_password` is true.
- Role safeguards: there is always at least one `SUPER_ADMIN`, and nobody can delete or demote themselves.

## Infra responsibilities

- Provision Neon (`main`, `dev-elmer`, `dev-yahya`, `dev-abduraheem`) and the Filebase bucket (one private bucket, shared by dev and prod) + its access key and secret key; share credentials privately.
- API deployment on Render (Dockerfile + service config).
- GitHub Actions CI and branch protection on `main`.

## Hand-written tasks

Write these yourself. Your agent will explain and review, but won't write them.

| Layer    | Task                                                                                 | What you'll learn                                                                                     |
| -------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| DB       | `User` model in `schema.prisma` + the first migration                                | Prisma schema syntax, enums, unique constraints, `@@map`, how migrations are generated and applied    |
| API      | `POST /api/auth/login` route                                                         | Fastify routing, zod request validation, setting cookies, returning proper status codes               |
| Security | argon2 hash/verify helpers + the `requireAuth` preHandler hook                       | Why passwords are hashed rather than encrypted, timing-safe comparison, verifying JWTs, Fastify hooks |
| Frontend | Admin login form + auth state (the current-user query and a protected-route wrapper) | react-hook-form + zod, TanStack Query, cookie-based auth from the browser's side, redirecting         |
| Infra    | `.github/workflows/ci.yml`                                                           | GitHub Actions syntax, caching pnpm, running lint/typecheck/test on PRs                               |

## Order of work

1. **Week 1:** scaffold with the team; provision Neon branches + the Filebase bucket; CI workflow (hand-written).
2. **Weeks 2–3:** `User`/`RefreshToken` models → hashing + login + `requireAuth` → refresh/logout/me → login form + auth state → user management API + page → seed script.
3. **Weeks 4–5:** hero (API + editor + home section) → site settings → home page layout.
4. **Week 6:** Render production deploy, domain + cookie check across subdomains.

## Depends on / provides

- **Provides** `requireAuth` / `requireRole` and the admin layout and route guard. Yahya and Abduraheem need these early, so land a minimal version first.
- **Depends on** Yahya's media picker (hero editor) and Abduraheem's events API (home page "upcoming events").

## Progress

A handoff log for whichever agent picks up next, on any machine or tool. Update it at the end of each session, then check `git status` / `git log` in case it's out of date.

**Last updated:** 2026-10-12

| Item                                                                       | Status                                                       | Written by                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `User` model + migration                                                   | Done, applied to `dev-elmer`                                 | Elmer (hand-written)                      |
| `RefreshToken` model + migration                                           | Done, applied to `dev-elmer`                                 | —                                         |
| CI workflow                                                                | Done, merged                                                 | Elmer (hand-written)                      |
| `apps/api/src/modules/auth/password.ts` (`hashPassword`, `verifyPassword`) | Done; lint, typecheck and tests pass. **Not yet committed.** | Elmer (hand-written)                      |
| `apps/api/src/modules/auth/password.test.ts`                               | Done (6 tests). **Not yet committed.**                       | Agent, from Elmer's draft                 |
| `POST /api/auth/login`                                                     | **Next up**                                                  | Elmer (hand-written): agents explain only |

**Decisions worth knowing:**

- `hashPassword` sets `type: argon2.argon2id` explicitly, and a test checks the `$argon2id$` prefix.
- `verifyPassword(hash, password)` deliberately has no `try/catch`. A malformed stored hash throws, so the global error handler logs it and returns a 500, rather than it looking like a wrong password. A test covers this.

**Next steps:**

1. Commit `password.ts` and `password.test.ts`. Use a new branch such as `elmer/password-hashing` if the `elmer/refresh-token-model` PR is already open or merged. In the PR's Hand-written section, list `password.ts`.
2. Start `POST /api/auth/login`. It's hand-written, so the agent explains Fastify routes, zod validation, cookies and status codes with doc links, and reviews Elmer's code.
3. Then `requireAuth` (hand-written), then refresh/logout/me.

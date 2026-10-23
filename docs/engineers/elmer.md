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

| Layer    | Task                                                                                                           | What you'll learn                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| DB       | `User` model in `schema.prisma` + the first migration                                                          | Prisma schema syntax, enums, unique constraints, `@@map`, how migrations are generated and applied               |
| API      | `POST /api/auth/login` route                                                                                   | Fastify routing, zod request validation, setting cookies, returning proper status codes                          |
| Security | argon2 hash/verify helpers + the `requireAuth` preHandler hook                                                 | Why passwords are hashed rather than encrypted, timing-safe comparison, verifying JWTs, Fastify hooks            |
| Frontend | Admin login form + auth state (the current-user query and a protected-route wrapper)                           | react-hook-form + zod, TanStack Query, cookie-based auth from the browser's side, redirecting                    |
| Frontend | Login form extras: show/hide password + Caps Lock warning                                                      | `useState`, event handlers, controlled UI state                                                                  |
| Frontend | Home page hero video: play/pause button, honours `prefers-reduced-motion` via a `usePrefersReducedMotion` hook | `useState`, `useRef` (DOM access), `useEffect` with cleanup (subscribing to `matchMedia`), writing a custom hook |
| Infra    | `.github/workflows/ci.yml`                                                                                     | GitHub Actions syntax, caching pnpm, running lint/typecheck/test on PRs                                          |

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

**Last updated:** 2026-10-23

| Item                                                                                                                      | Status                                                   | Written by                |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------- |
| `User` model + migration                                                                                                  | Done, applied to `dev-elmer`                             | Elmer (hand-written)      |
| `RefreshToken` model + migration                                                                                          | Done, applied to `dev-elmer`                             | —                         |
| CI workflow                                                                                                               | Done, merged                                             | Elmer (hand-written)      |
| `apps/api/src/modules/auth/password.ts` (`hashPassword`, `verifyPassword`)                                                | Done, merged (PR #7)                                     | Elmer (hand-written)      |
| `apps/api/src/modules/auth/password.test.ts`                                                                              | Done (6 tests), merged (PR #7)                           | Agent, from Elmer's draft |
| `POST /api/auth/login` (`modules/auth/routes.ts` + `service.ts`)                                                          | Done, merged (PR #8)                                     | Elmer (hand-written)      |
| `modules/auth/routes.test.ts` (9 tests, mocked `findUnique`)                                                              | Done, merged (PR #8)                                     | Agent                     |
| Seed script `seed:admin` (`src/scripts/`) + tests                                                                         | Done, run on `dev-elmer`; login verified                 | Agent                     |
| `requireAuth` (`modules/auth/require-auth.ts`)                                                                            | Done, merged (PR #11)                                    | Elmer (hand-written)      |
| `request.user` typing (`jwt.ts`), `GET /api/auth/me`, admin plugin (`modules/admin/routes.ts`) + tests                    | Done, merged (PR #11)                                    | Agent                     |
| Refresh rotation, logout, change-password, `checkAccount`, `requireRole` + tests                                          | Done, merged (PR #12)                                    | Agent                     |
| Login rate limiting                                                                                                       | Owned by Abduraheem (his hand-written task)              | —                         |
| Admin `lib/api.ts` (`apiFetch`, 401 → one shared refresh → retry) + tests, `query-client.ts`, login/dashboard page shells | Done, merged (PR #13)                                    | Agent                     |
| Login form wired to the API (`LoginForm.tsx`, `useLogin.ts`)                                                              | Done, merged (PR #13); browser-tested                    | Elmer (hand-written)      |
| Current-user query (`useCurrentUser.ts`, `query-keys.ts`)                                                                 | Done on `elmer/proteceted-route-wrapper`; browser-tested | Elmer (hand-written)      |
| Protected-route wrapper (`RequireAuth.tsx`) + layout route in `router.tsx`                                                | Done on `elmer/proteceted-route-wrapper`; browser-tested | Elmer (hand-written)      |
| Login form extras: show/hide password + Caps Lock warning                                                                 | Not started                                              | Elmer (hand-written)      |
| Change-password form (`ChangePasswordPage.tsx`)                                                                           | Placeholder only                                         | Agent                     |
| Logout button                                                                                                             | Not started                                              | Agent                     |

**Decisions worth knowing:**

- `hashPassword` sets `type: argon2.argon2id` explicitly, and a test checks the `$argon2id$` prefix.
- `verifyPassword(hash, password)` deliberately has no `try/catch`. A malformed stored hash throws, so the global error handler logs it and returns a 500, rather than it looking like a wrong password. A test covers this.
- Login returns the same `401 INVALID_CREDENTIALS` for unknown email, wrong password and inactive user. Not yet done: a dummy-hash verify when the user is missing, to equalise timing.
- The access JWT payload is `{ sub: String(user.id), role }`, 15 min. `sub` is a string, so `requireAuth` must convert it back to a number for Prisma.
- `authRoutes` is a callback-style plugin (`FastifyPluginCallbackZod` + `done()`), because the `require-await` lint rule rejects an async plugin with no `await`.
- `authRoutes` must be registered **after** `setErrorHandler` in `buildApp`: plugins registered earlier don't get the custom error handler. The route tests fail if this order breaks.
- `requireAuth` runs as an `onRequest` hook (before body parsing), so logged-out callers get 401 before any validation error. `formatUser` turns the token into `request.user = { id: number, role }`.
- All `/api/admin` routes go in `ADMIN_PLUGINS` (`modules/admin/routes.ts`), which applies `requireAuth` to everything inside it.
- Refresh tokens: SHA-256 hashed, cookie path `/api/auth`. Rotation sets `revokedAt`; logout/password change **delete** rows, so a reused token with `revokedAt` set means theft → all of that user's sessions are deleted. Rotated rows are never cleaned up yet.
- Login's token/cookie lines moved into `setSessionCookies` (`session.ts`), shared with refresh and change-password.
- Wrong current password on change-password is **400** `INVALID_CURRENT_PASSWORD`, not 401, because the admin app treats 401 as logged out.
- `ACCESS_TOKEN_COOKIE` lives in `modules/auth/cookies.ts`, not `app.ts`, to avoid a circular import.
- Route tests mock `app.prisma.user.findUnique` because CI has no database.
- Admin app: the cached current user lives under `CURRENT_USER_QUERY_KEY` (`['auth', 'me']`, in `features/auth/query-keys.ts`) and holds the `AuthUser` itself, not `{ user }`. `useLogin` writes it with `setQueryData` on success; `useCurrentUser` reads `GET /api/auth/me` and returns `.user`. Both must keep that shape.
- `RequireAuth` is a pathless layout route in `router.tsx`. Every admin page goes in its `children`; `/login` and `/change-password` stay outside. It checks pending → error (any error → `/login`) → `mustChangePassword` → `<Outlet />`. It only checks "logged in"; both roles may use the admin app. `SUPER_ADMIN`-only UI (user management) needs its own check.
- `seed:admin` generates a random temporary password, prints it once, and sets `mustChangePassword: true`. It refuses an email that already exists. It isn't part of the `tsup` build yet (production use is a Week 6 deploy question).

**Next steps:**

1. Commit and open the PR for `elmer/proteceted-route-wrapper` (all of it is hand-written by Elmer except the `query-keys.ts` rename).
2. Login rate limiting is Abduraheem's hand-written task. Tell him the auth routes are ready for it, and to also cover `/api/auth/change-password` and `/api/auth/refresh`.
3. Logout: call `POST /api/auth/logout`, then clear `CURRENT_USER_QUERY_KEY` (otherwise `RequireAuth` still sees a user) and go to `/login`.
4. Session expiring while the app is open: the cached user stays, so `RequireAuth` doesn't notice. Make a final 401 (after the failed refresh) clear the cached user, e.g. in a `QueryCache`/`MutationCache` `onError` in `query-client.ts`.
5. Change-password form on `ChangePasswordPage`, and make that page require login (but not redirect on `mustChangePassword`).
6. Hand-written: login form extras (show/hide password + Caps Lock warning).
7. Then user management (API + Users page, `SUPER_ADMIN` only).

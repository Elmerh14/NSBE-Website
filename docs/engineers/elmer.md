# Elmer — Auth, Users, Hero, Settings & Media uploads

Project lead. Owns everything to do with logging in and who has access, plus the home page hero, site-wide settings, and media uploads (taken over from Yahya on 2026-10-26 because the hero was blocked on them). Also provisions the hosted services and shares credentials with the team.

## Features owned

| Feature         | DB                                      | API                                                                                                                                                                                   | Admin UI                                                                                                      | Public UI                                                                       |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Auth            | `User`, `RefreshToken`                  | `POST /api/auth/login`, `/logout`, `/refresh`, `/change-password`, `GET /api/auth/me`                                                                                                 | Login page, forced password change, auth state / route guard                                                  | —                                                                               |
| User management | `User`                                  | `/api/admin/users` (list, create, change role, reset temp password, deactivate). `SUPER_ADMIN` only.                                                                                  | Users page                                                                                                    | —                                                                               |
| Hero            | `Hero`                                  | `GET /api/hero`, `PUT /api/admin/hero`                                                                                                                                                | Hero editor: photo/video toggle + preview, using the media picker                                             | Home page hero section                                                          |
| Site settings   | `SiteSettings`                          | `GET /api/settings`, `PUT /api/admin/settings`                                                                                                                                        | Settings page                                                                                                 | Footer (socials, contact email, join link)                                      |
| Home page       | —                                       | —                                                                                                                                                                                     | —                                                                                                             | Home layout: hero, mission, upcoming events (Abduraheem's data), sponsors strip |
| Media uploads   | `Media` (Yahya's model, already merged) | `POST /api/admin/media/upload-url` (presign), `POST /api/admin/media` (save after upload), `DELETE /api/admin/media/:id`; presigned GET helper used by every route that returns media | Upload component with progress; reusable **media picker** used by hero, leadership, events, sponsors, gallery | Responsive image/video components that use the presigned URLs from the API      |

Plus the seed script: `pnpm --filter api seed:admin`.

## Security responsibilities

- argon2id password hashing and verification.
- Access JWT (about 15 min) and refresh token (about 7 days) in httpOnly, Secure, SameSite=Strict cookies.
- Refresh tokens stored hashed and rotated on every use; revoked on logout, deactivation and password reset.
- `requireAuth` and `requireRole` hooks; block other admin routes while `must_change_password` is true.
- Role safeguards: there is always at least one `SUPER_ADMIN`, and nobody can delete or demote themselves.
- Media: an allow-list of MIME types (e.g. `image/jpeg`, `image/png`, `image/webp`, `video/mp4`) and size limits per type, checked **before** issuing a presigned URL.
- Presigned upload URLs are short-lived (a few minutes) and tied to one generated object key. The client never chooses the key.
- The bucket stays **private**. Reads go through presigned GET URLs (max 7 days) that the API signs; never make objects public. The access key and secret key stay out of git and out of the browser.

## Infra responsibilities

- Provision Neon (`main`, `dev-elmer`, `dev-yahya`, `dev-abduraheem`) and the Filebase bucket (one private bucket, shared by dev and prod) + its access key and secret key; share credentials privately.
- API deployment on Render (Dockerfile + service config).
- GitHub Actions CI and branch protection on `main`.

## Hand-written tasks

Write these yourself. Your agent will explain and review, but won't write them.

The media upload work taken over from Yahya is **not** hand-written: its hand-written tasks (presign route, MIME/size validation, upload component) were dropped when it was reassigned, so the agent may write them.

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
3. **Weeks 4–5:** site settings → media uploads (presign + validation → upload component → save endpoint → presigned GET helper → media picker) → hero (API + editor + home section) → home page layout.
4. **Week 6:** Render production deploy, domain + cookie check across subdomains.

## Depends on / provides

- **Provides** `requireAuth` / `requireRole` and the admin layout and route guard. Yahya and Abduraheem need these early, so land a minimal version first.
- **Provides** the media picker and the presigned GET helper. Yahya (leadership, media library) and Abduraheem (events, sponsors, gallery) need them, so ship a basic picker early.
- **Depends on** Abduraheem's events API (home page "upcoming events") and sponsors API (sponsors strip).

## Progress

A handoff log for whichever agent picks up next, on any machine or tool. Update it at the end of each session, then check `git status` / `git log` in case it's out of date.

**Last updated:** 2026-10-26

| Item                                                                                                                                      | Status                                                                           | Written by                         |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| `User` model + migration                                                                                                                  | Done, applied to `dev-elmer`                                                     | Elmer (hand-written)               |
| `RefreshToken` model + migration                                                                                                          | Done, applied to `dev-elmer`                                                     | —                                  |
| CI workflow                                                                                                                               | Done, merged                                                                     | Elmer (hand-written)               |
| `apps/api/src/modules/auth/password.ts` (`hashPassword`, `verifyPassword`)                                                                | Done, merged (PR #7)                                                             | Elmer (hand-written)               |
| `apps/api/src/modules/auth/password.test.ts`                                                                                              | Done (6 tests), merged (PR #7)                                                   | Agent, from Elmer's draft          |
| `POST /api/auth/login` (`modules/auth/routes.ts` + `service.ts`)                                                                          | Done, merged (PR #8)                                                             | Elmer (hand-written)               |
| `modules/auth/routes.test.ts` (9 tests, mocked `findUnique`)                                                                              | Done, merged (PR #8)                                                             | Agent                              |
| Seed script `seed:admin` (`src/scripts/`) + tests                                                                                         | Done, run on `dev-elmer`; login verified                                         | Agent                              |
| `requireAuth` (`modules/auth/require-auth.ts`)                                                                                            | Done, merged (PR #11)                                                            | Elmer (hand-written)               |
| `request.user` typing (`jwt.ts`), `GET /api/auth/me`, admin plugin (`modules/admin/routes.ts`) + tests                                    | Done, merged (PR #11)                                                            | Agent                              |
| Refresh rotation, logout, change-password, `checkAccount`, `requireRole` + tests                                                          | Done, merged (PR #12)                                                            | Agent                              |
| Login rate limiting                                                                                                                       | Owned by Abduraheem (his hand-written task)                                      | —                                  |
| Admin `lib/api.ts` (`apiFetch`, 401 → one shared refresh → retry) + tests, `query-client.ts`, login/dashboard page shells                 | Done, merged (PR #13)                                                            | Agent                              |
| Login form wired to the API (`LoginForm.tsx`, `useLogin.ts`)                                                                              | Done, merged (PR #13); browser-tested                                            | Elmer (hand-written)               |
| Current-user query (`useCurrentUser.ts`, `query-keys.ts`)                                                                                 | Done, merged (PR #14); browser-tested                                            | Elmer (hand-written)               |
| Protected-route wrapper (`RequireAuth.tsx`) + layout route in `router.tsx`                                                                | Done, merged (PR #14); browser-tested                                            | Elmer (hand-written)               |
| Login form extras: show/hide password + Caps Lock warning                                                                                 | Done, merged (PR #19)                                                            | Elmer (hand-written)               |
| Change-password form (`ChangePasswordForm.tsx`, `useChangePassword.ts`, `ChangePasswordFormSchema` in shared)                             | Done, merged (PR #15); browser-tested                                            | Agent                              |
| Logout (`useLogout.ts`), admin header (`features/layout/AdminLayout.tsx`), expired-session handling in `query-client.ts` + tests          | Done, merged (PR #15); browser-tested                                            | Agent                              |
| User management API (`modules/users/`, `packages/shared/src/users.ts`) + 31 route tests                                                   | Done, merged (PR #16); manually tested                                           | Agent                              |
| Admin sidebar layout (`features/layout/AppSidebar.tsx`, `NavUser.tsx`, `nav-items.ts` + tests); replaces the top header                   | Done, merged (PR #17); browser-tested                                            | Agent                              |
| Users page (`features/users/`: table, add / change role / reset / deactivate / reactivate dialogs, temporary-password dialog) + tests     | Done, merged (PR #18); browser-tested                                            | Agent                              |
| `SiteSettings` model + migration (singleton, `CHECK (id = 1)` added by hand), `GET /api/settings`, `PUT /api/admin/settings` + tests      | Done, merged (PR #20); migration applied to `dev-elmer`                          | Agent                              |
| Admin Settings page (`features/settings/`: one form, Contact + Social links, unsaved-changes hint)                                        | Done, merged (PR #20); tested end to end: saved values show in the public footer | Agent                              |
| Public site shell (`apps/web`: router, header with About ▾ menu + mobile sheet, 3-column footer from settings, Coming soon pages) + tests | Done, merged (PR #21); desktop checked in browser, phone layout not yet          | Agent                              |
| Media uploads (presign, validation, save, delete, GET helper, upload component, media picker, public image/video components)              | Not started; reassigned from Yahya 2026-10-26                                    | Agent may write (not hand-written) |

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
- `ChangePasswordPage` is outside `RequireAuth` (which redirects there) and does its own logged-in check. Wrong current password shows on the current-password field. The form's "confirm new password" lives only in `ChangePasswordFormSchema`; the API body is still `ChangePasswordRequestSchema`.
- Logout only leaves the app once `POST /api/auth/logout` succeeds (on failure it shows an error, so the user never looks logged out while the session still works). It then goes to `/login` and calls `queryClient.clear()`.
- Expired session: a 401 that reaches TanStack (after `apiFetch`'s refresh failed) invalidates `CURRENT_USER_QUERY_KEY`, so `/me` fails and `RequireAuth` redirects. The current-user query's own 401 is skipped to avoid a loop.
- User management (`/api/admin/users`): the plugin adds `requireRole('SUPER_ADMIN')` as a hook, so every route in it is super-admin only. Nobody can change their own role, reset their own password or deactivate themselves (403 `CANNOT_MODIFY_SELF`); that alone keeps a super admin, and a count check (409 `LAST_SUPER_ADMIN`) backs it up. Duplicate email is 409 `EMAIL_TAKEN`, including deactivated users. Reset and deactivate delete the target's refresh tokens. `POST /api/admin/users/:id/reactivate` (body `{ role }`) brings a deactivated user back with a new temporary password and a freshly chosen role; on an active user it's 409 `USER_ALREADY_ACTIVE`.
- Admin navigation is a shadcn sidebar (`collapsible="icon"`; a sheet on phones, opened from the slim top bar). The signed-in user sits at the bottom with an initial avatar; its menu holds Change password and Sign out. Every admin page adds an entry to `NAV_ITEMS` in `features/layout/nav-items.ts`; `roles` hides a link from other roles, but pages must still check the role themselves.
- `use-mobile.ts` in `packages/ui` is edited from shadcn's version to use `useSyncExternalStore` (the lint rule rejects setState in an effect). Re-running `shadcn add` must not overwrite it.
- Users page: `USER` is labelled "Admin". Your own row has no ⋯ menu; a deactivated user's menu only offers Reactivate. Each action dialog is mounted fresh (keyed), so no mutation error carries over. Every user mutation invalidates the list on success **and** error, because a 404/409 usually means the list is stale. The row's dropdown is `modal={false}` so opening a dialog from it doesn't leave `pointer-events: none` on the body. The temporary-password dialog can only be closed with Done.
- Site settings: one row, id 1, created on first save (`upsert`); `GET` returns all-null until then, so no seeding. `PUT` replaces all six fields; any admin may use it. `UpdateSiteSettingsRequestSchema` trims, turns `''` into null, allows only `https` links, and checks each social link's hostname (`(www.)?instagram.com` etc.). The admin form uses the same schema.
- Public site: every page is listed once in `PAGES` (`apps/web/src/features/layout/site.ts`); the header, footer and `routes.tsx` all use it, and a test checks every page has a route. Unbuilt pages render `ComingSoonPage`; whoever builds one swaps in their component. The header's Join button and the footer's "Join NSBE" both go to the join link from Settings and hide when it's unset; the Contact page is separate. Brand icons are inline SVG paths from Simple Icons (CC0) in `SocialIcon.tsx`, because lucide-react v1 has no brand icons.
- `generateTemporaryPassword` lives in `modules/users/temporary-password.ts`, shared by the seed script and user management.
- `seed:admin` generates a random temporary password, prints it once, and sets `mustChangePassword: true`. It refuses an email that already exists. It isn't part of the `tsup` build yet (production use is a Week 6 deploy question).

**Next steps:**

1. Check the public site on a phone width. Tell Yahya and Abduraheem how to add their public pages (`PAGES` in `site.ts`, then `routes.tsx`), and that the media picker is now Elmer's.
2. Media uploads: presign route + MIME/size validation → upload component → save/delete endpoints → presigned GET helper → media picker → public image/video components. Needs the Filebase env vars in `.env`.
3. Hero: API, editor (uses the media picker), home section (the hero video play/pause + `usePrefersReducedMotion` is hand-written).
4. Replace the placeholder mission (`SITE_MISSION` in `apps/web/src/features/layout/site.ts`) once the chapter has one.
5. Login rate limiting is Abduraheem's hand-written task. Tell him the auth routes are ready for it, and to also cover `/api/auth/change-password` and `/api/auth/refresh`.

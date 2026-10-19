## Summary

Add the public Events page, an authenticated admin events editor, and the API routes behind the editor. The public events endpoint stays public. Routes validate shared Zod contracts and delegate Prisma operations to the events service.

| Method | Path                    | Success                                                       |
| ------ | ----------------------- | ------------------------------------------------------------- |
| GET    | `/api/admin/events`     | 200, event array; optional `period=upcoming` or `period=past` |
| GET    | `/api/admin/events/:id` | 200, one event                                                |
| POST   | `/api/admin/events`     | 201, created event and Location header                        |
| PATCH  | `/api/admin/events/:id` | 200, updated event                                            |
| DELETE | `/api/admin/events/:id` | 204, no body                                                  |

Create requires title, description, startsAt (ISO datetime with timezone), and location. endsAt and rsvpLink are optional and nullable. PATCH accepts a nonempty subset of those fields; null clears an optional field. IDs must fit a positive PostgreSQL integer.

Partial date edits are checked against stored values. Updates also match the dates that were checked, returning 409 CONFLICT if another edit changed them or the event was deleted before the write. Missing events otherwise return 404 NOT_FOUND; invalid inputs return 400 VALIDATION_ERROR.

The new requireAuth hook verifies the access_token cookie and checks the current account in the database. Missing, invalid, expired, deleted-account, and inactive-account credentials return 401 UNAUTHORIZED. Accounts still requiring a password change return 403 PASSWORD_CHANGE_REQUIRED. Both active USER and SUPER_ADMIN accounts can manage events, consistent with the existing officer roles. Bearer headers alone are not accepted.

The public app serves `/events` with upcoming/past filters, event details, RSVP links, Mountain Time dates, and loading/error/empty states. Filters are reflected in the URL. The calendar refreshes every minute and when focus returns.

The admin app serves `/events` with cookie-based sign-in, event search, create/edit dialogs, and delete confirmation. TanStack Query handles fetching and invalidation after writes; react-hook-form and shared Zod contracts validate inputs. Editor times use the browser's labeled time zone, convert to ISO, and preserve existing instants across daylight-saving transitions. Forms retain input on failed writes and prevent duplicate submissions while pending.

Both apps redirect `/` to `/events` and include a not-found page. The shared theme uses warm off-white, gold, and deep green. Added official shadcn components in packages/ui: table and textarea.

Event images remain separate work because Event has no media relation. There are no schema migrations, new dependencies, or new environment variables. Cross-origin production access still depends on the planned CORS configuration; local development uses the existing Vite proxies.

## Owner / slice

Abduraheem — Events. Also adds the shared auth hook in Elmer's auth module because no requireAuth implementation existed, and updates app.ts to register the admin events plugin.

## Hand-written

None in this change. Abduraheem explicitly requested assistant implementation under the session override. The admin routes, events service additions, auth hook, tests, shared contract changes, registration, public Events frontend, and admin frontend are AI-assisted, not hand-written submissions. The minimal officer sign-in panel and app/provider setup also touch Elmer's frontend slice because the apps only had starter screens.

## How to test

1. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check`, and `pnpm build`.
2. Request tests use the real Fastify app and app.inject(), with Prisma queries mocked. They cover all protected endpoints, cookie authentication and account restrictions, create/defaults, reads, partial edits, nullable fields, date validation and concurrency, deletion, invalid inputs, missing records, and write errors. Existing public-route tests verify public access and filters.
3. For a manual smoke test against your own Neon development branch, log in with an active account whose password-change requirement has been cleared and send the access_token cookie to the endpoints above. Create an event, list it, fetch its ID, edit it, then delete it. Do not use the production database for this test.
4. Run `pnpm dev` with your development environment configured. Open public `http://localhost:5173/events` and admin `http://localhost:5174/events`. Sign in on admin, create/edit/delete an event, and check the public calendar. Check the mobile layout, filters, details dialog, RSVP links, form errors, and confirmation dialog. Local browser automation was unavailable, so visual/live-database verification remains manual.
5. Frontend tests cover request methods, credentials, API validation/error handling, delete responses, Mountain Time rendering, RSVP behavior, and date conversion including skipped/repeated daylight-saving hours.

## Checklist

- [x] pnpm lint, pnpm typecheck, pnpm test, and pnpm format:check pass (114 tests, including 37 new admin request tests and 24 frontend tests)
- [x] Production builds pass (Vite reports non-blocking bundle-size warnings)
- [x] Request/response shapes come from packages/shared Zod schemas
- [x] No schema migration required
- [x] No new environment variables
- [x] No secrets, .env files or connection strings committed
- [x] All admin event routes are behind requireAuth
- [ ] A different engineer has reviewed this change and the hand-written disclosure

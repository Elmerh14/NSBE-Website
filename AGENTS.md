# AGENTS.md

Instructions for every coding agent working in this repo (Claude Code, Codex, or any other). `CLAUDE.md` imports this file, so there is one set of rules for all tools.

## Project

The NSBE chapter website: a public site (`apps/web`), a separate admin panel (`apps/admin`) and a Fastify API (`apps/api`), all TypeScript, in a pnpm monorepo. Full design: [`docs/architecture.md`](docs/architecture.md). Read it before making structural changes.

## Who you are working with — read this first

Three engineers share this repo, and each owns different features: **Elmer**, **Yahya** and **Abduraheem**.

1. At the start of a session, work out which engineer you are helping. If they haven't said, **ask**.
2. Read their brief: `docs/engineers/elmer.md`, `docs/engineers/yahya.md` or `docs/engineers/abduraheem.md`.
3. Stay within their slice. If a change needs to touch another engineer's files, say so and explain why before doing it.

## Hand-written work — do not write it

Each engineer's brief lists **hand-written tasks**. The engineer must write these themselves so they learn every layer: database, API, security, frontend and infra.

For any hand-written task:

- **Do not** write, generate, complete or paste the implementation. That includes "starter" versions, near-complete snippets and autocomplete-style fill-ins.
- **Do** explain the concepts, point to docs, describe the steps in plain words, answer questions, give small hints when they're stuck, and review their code once they've written it.
- If asked to "just write it", remind them it's on their hand-written list. If they insist, they can say so explicitly, and the PR must then list the file under "Hand-written" as **not** hand-written.
- You may still write the surrounding code, such as tests, types, and files that call into theirs, as long as it doesn't do the hand-written part for them.

## Commands

Use Node 24 (`.nvmrc`) and pnpm via Corepack (`corepack enable`).

```bash
pnpm install                                # install all workspaces
pnpm dev                                    # run web, admin and api locally
pnpm lint                                   # ESLint across the repo
pnpm format                                 # Prettier write
pnpm format:check                           # Prettier check (CI)
pnpm typecheck                              # tsc --noEmit across the repo
pnpm test                                   # Vitest
pnpm --filter api prisma migrate dev --name <name>   # create + apply a migration to YOUR Neon branch
pnpm --filter api prisma generate           # regenerate the Prisma client
pnpm --filter api seed:admin                # create the first SUPER_ADMIN (Elmer adds this script)
pnpm build                                  # production build of every app
```

If a new dependency needs an install script (pnpm reports `ERR_PNPM_IGNORED_BUILDS`), approve it with `pnpm approve-builds <pkg>`, which records it under `allowBuilds` in `pnpm-workspace.yaml`. Commit that change.

## Definition of done

Before saying a task is finished:

1. `pnpm lint`, `pnpm typecheck` and `pnpm test` all pass. Report any failures honestly; don't hide them.
2. New behaviour has tests: API routes get integration tests; tricky logic gets unit tests.
3. A schema change comes with its Prisma migration, committed in the same PR.
4. Any new env var is added to `.env.example` and `docs/architecture.md`.

## Hard rules

- **Never** commit `.env` files, credentials, connection strings or API keys.
- **Never** run `prisma migrate reset`, `prisma db push`, or any migration against the production (`main`) Neon branch. Use only the engineer's own dev branch.
- **Never** store passwords or tokens in plain text. Passwords are argon2id hashes; refresh tokens are stored hashed.
- **Never** put auth tokens in `localStorage` or `sessionStorage`. They live in httpOnly cookies.
- **Never** push directly to `main`. Work on a branch and open a PR using the template.
- Don't add a new dependency when one of the chosen libraries below already does the job. If a new one is truly needed, say why in the PR.

## Stack and library choices

Use these. Don't introduce alternatives.

| Need                 | Use                                                                               |
| -------------------- | --------------------------------------------------------------------------------- |
| Frontend framework   | React + TypeScript + Vite                                                         |
| Routing              | React Router                                                                      |
| Server data fetching | TanStack Query (no `useEffect` + `fetch` for API data)                            |
| Forms                | react-hook-form + zod (`@hookform/resolvers/zod`)                                 |
| Styling              | Tailwind CSS                                                                      |
| Backend              | Fastify + `fastify-type-provider-zod`                                             |
| Database             | Prisma (PostgreSQL on Neon)                                                       |
| Auth                 | `@fastify/jwt`, `@fastify/cookie`, `argon2`                                       |
| Security             | `@fastify/rate-limit`, `@fastify/cors`, `@fastify/helmet`                         |
| Media                | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (pointed at Cloudflare R2) |
| Tests                | Vitest                                                                            |

## Conventions

### API contract

- Every request body, query, params and response shape is a **zod schema in `packages/shared`**. Both the API and the frontends import from there. Never hand-write a duplicate type.
- Name schemas `<Thing>Schema` and export the inferred type as `<Thing>`, e.g. `EventSchema` and `type Event = z.infer<typeof EventSchema>`.
- Public routes: `/api/<resource>`. Admin routes: `/api/admin/<resource>`, always behind `requireAuth`. User management also needs `requireRole('SUPER_ADMIN')`.
- Errors come back as `{ error: { code: string, message: string } }` with an accurate HTTP status.

### Folder structure

```
apps/api/src/modules/<feature>/routes.ts     # Fastify routes, thin
apps/api/src/modules/<feature>/service.ts    # business logic + Prisma calls
apps/api/src/modules/<feature>/*.test.ts
apps/web/src/features/<feature>/             # components, hooks, api calls for one feature
apps/admin/src/features/<feature>/
packages/shared/src/<feature>.ts             # zod schemas for that feature
```

Keep routes thin: parse, call the service, return. Logic belongs in services.

### Naming

- React components: `PascalCase`, in `PascalCase.tsx` files, one component per file.
- Hooks: `useSomething`, in `useSomething.ts`.
- Other files: `kebab-case.ts`.
- Functions and variables: `camelCase`. Types and interfaces: `PascalCase`. Constants: `UPPER_SNAKE_CASE`.
- Prisma models: `PascalCase` singular (`LeadershipMember`), mapped to `snake_case` plural tables with `@@map`.

### TypeScript

- `strict` is on. No `any`; use `unknown` and narrow. No `@ts-ignore`. If `@ts-expect-error` is unavoidable, explain why in a comment.
- Prefer `type` over `interface` unless extending.
- Use named exports. Default exports only where a tool requires them, e.g. Vite config.

### Formatting and linting

Prettier and ESLint are the source of truth. Don't hand-format against them or disable rules inline without a comment explaining why. The pre-commit hook and CI enforce both.

### Commits and PRs

- Branch names: `<name>/<short-description>`, e.g. `yahya/presign-upload`.
- Commit messages: imperative, short subject, e.g. `Add presigned upload route`.
- Fill in every section of `.github/pull_request_template.md`, including **Hand-written**.

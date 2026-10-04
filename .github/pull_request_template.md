## Summary

<!-- What does this PR do, and why? -->

## Owner / slice

<!-- Elmer / Yahya / Abduraheem — and which feature (e.g. "Yahya — media uploads") -->

## Hand-written

<!--
List files (or functions) in this PR written BY HAND as part of your hand-written tasks
(see docs/engineers/<name>.md). Write "None" if this PR has none.
If a hand-written task was done with AI help instead, say so here.
-->

-

## How to test

<!-- Steps a reviewer can follow to see it working -->

1.

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass
- [ ] Request/response shapes come from `packages/shared` zod schemas
- [ ] Prisma migration included (if the schema changed)
- [ ] New env vars added to `.env.example` and `docs/architecture.md`
- [ ] No secrets, `.env` files or connection strings committed
- [ ] Admin routes are behind `requireAuth` (and `requireRole('SUPER_ADMIN')` where needed)
- [ ] Reviewer is a different engineer, who has read the hand-written section

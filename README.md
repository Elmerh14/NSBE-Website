# NSBE Website

Public site, admin panel and API for the NSBE chapter. See [`docs/architecture.md`](docs/architecture.md) for the design and [`docs/engineers/`](docs/engineers/) for who owns what.

## Getting started

1. Install **Node 24** (`nvm use` reads `.nvmrc`) and enable pnpm: `corepack enable`.
2. Install dependencies: `pnpm install`.
3. Copy `.env.example` to `.env` and fill in the values Elmer shares with you. Use your own Neon dev branch.
4. Start everything: `pnpm dev`.

| App         | URL                              |
| ----------- | -------------------------------- |
| Public site | http://localhost:5173            |
| Admin panel | http://localhost:5174            |
| API         | http://localhost:3000/api/health |

The API runs without a database until the first Prisma model exists.

## Before opening a PR

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
```

A pre-commit hook formats and lints staged files automatically. Rules for coding agents (Claude Code, Codex) are in [`AGENTS.md`](AGENTS.md).

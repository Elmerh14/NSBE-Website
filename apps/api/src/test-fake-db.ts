import { vi } from 'vitest';

import type { PrismaClient, RefreshToken, User } from './generated/prisma/client';

// A tiny in-memory stand-in for the `user` and `refreshToken` tables, for tests only.
// CI has no database, so tests install this onto app.prisma. It supports just the queries
// the auth code makes; add to it when new auth code needs more.

type Select = Record<string, unknown>;
type Row = Record<string, unknown>;

function pick(row: Row, select: Select | undefined): Row {
  if (!select) return { ...row };
  const out: Row = {};
  for (const key of Object.keys(select)) out[key] = row[key];
  return out;
}

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

export type FakeDb = {
  users: User[];
  refreshTokens: RefreshToken[];
};

export function installFakeDb(prisma: PrismaClient, users: User[] = []): FakeDb {
  const db: FakeDb = { users: users.map((u) => ({ ...u })), refreshTokens: [] };
  let nextTokenId = 1;

  vi.spyOn(prisma.user, 'findUnique').mockImplementation((({
    where,
    select,
  }: {
    where: Row;
    select?: Select;
  }) => {
    const user = db.users.find((u) => matches(u, where));
    return Promise.resolve(user ? pick(user, select) : null);
  }) as never);

  vi.spyOn(prisma.user, 'update').mockImplementation((({
    where,
    data,
    select,
  }: {
    where: Row;
    data: Partial<User>;
    select?: Select;
  }) => {
    const user = db.users.find((u) => matches(u, where));
    if (!user) return Promise.reject(new Error('Record to update not found'));
    Object.assign(user, data, { updatedAt: new Date() });
    return Promise.resolve(pick(user, select));
  }) as never);

  vi.spyOn(prisma.refreshToken, 'create').mockImplementation((({
    data,
  }: {
    data: Pick<RefreshToken, 'userId' | 'tokenHash' | 'expiresAt'>;
  }) => {
    const row: RefreshToken = {
      id: nextTokenId++,
      revokedAt: null,
      createdAt: new Date(),
      ...data,
    };
    db.refreshTokens.push(row);
    return Promise.resolve({ ...row });
  }) as never);

  vi.spyOn(prisma.refreshToken, 'findUnique').mockImplementation((({
    where,
    select,
  }: {
    where: Row;
    select?: Select & { user?: { select: Select } };
  }) => {
    const token = db.refreshTokens.find((t) => matches(t, where));
    if (!token) return Promise.resolve(null);
    const { user: userSelect, ...rest } = select ?? {};
    const out = pick(token, select ? rest : undefined);
    if (userSelect) {
      const user = db.users.find((u) => u.id === token.userId);
      out.user = user ? pick(user, userSelect.select) : null;
    }
    return Promise.resolve(out);
  }) as never);

  vi.spyOn(prisma.refreshToken, 'updateMany').mockImplementation((({
    where,
    data,
  }: {
    where: Row;
    data: Partial<RefreshToken>;
  }) => {
    const rows = db.refreshTokens.filter((t) => matches(t, where));
    for (const row of rows) Object.assign(row, data);
    return Promise.resolve({ count: rows.length });
  }) as never);

  vi.spyOn(prisma.refreshToken, 'deleteMany').mockImplementation((({ where }: { where: Row }) => {
    const before = db.refreshTokens.length;
    db.refreshTokens = db.refreshTokens.filter((t) => !matches(t, where));
    return Promise.resolve({ count: before - db.refreshTokens.length });
  }) as never);

  return db;
}

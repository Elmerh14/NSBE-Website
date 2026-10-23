import { vi } from 'vitest';

import type { PrismaClient, RefreshToken, User } from './generated/prisma/client';

// A tiny in-memory stand-in for the `user` and `refreshToken` tables, for tests only.
// CI has no database, so tests install this onto app.prisma. It supports just the queries
// the auth and user-management code makes; add to it when new code needs more.

type Select = Record<string, unknown>;
type Row = Record<string, unknown>;

function pick(row: Row, select: Select | undefined): Row {
  if (!select) return { ...row };
  const out: Row = {};
  for (const key of Object.keys(select)) out[key] = row[key];
  return out;
}

function isNot(value: unknown): value is { not: unknown } {
  return typeof value === 'object' && value !== null && 'not' in value;
}

// Supports plain equality and `{ not: value }`.
function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, value]) =>
    isNot(value) ? row[key] !== value.not : row[key] === value,
  );
}

type OrderBy = Record<string, 'asc' | 'desc'>;

function compare(a: Row, b: Row, orderBy: OrderBy[]): number {
  for (const order of orderBy) {
    for (const [key, direction] of Object.entries(order)) {
      const x = a[key] as string | number | boolean;
      const y = b[key] as string | number | boolean;
      if (x !== y) return (x < y ? -1 : 1) * (direction === 'asc' ? 1 : -1);
    }
  }
  return 0;
}

export type FakeDb = {
  users: User[];
  refreshTokens: RefreshToken[];
};

export function installFakeDb(prisma: PrismaClient, users: User[] = []): FakeDb {
  const db: FakeDb = { users: users.map((u) => ({ ...u })), refreshTokens: [] };
  let nextTokenId = 1;
  let nextUserId = Math.max(0, ...db.users.map((u) => u.id)) + 1;

  vi.spyOn(prisma.user, 'findMany').mockImplementation((({
    where,
    select,
    orderBy = [],
  }: {
    where?: Row;
    select?: Select;
    orderBy?: OrderBy[];
  }) => {
    const rows = db.users.filter((u) => matches(u, where)).sort((a, b) => compare(a, b, orderBy));
    return Promise.resolve(rows.map((u) => pick(u, select)));
  }) as never);

  vi.spyOn(prisma.user, 'count').mockImplementation((({ where }: { where?: Row }) =>
    Promise.resolve(db.users.filter((u) => matches(u, where)).length)) as never);

  vi.spyOn(prisma.user, 'create').mockImplementation((({
    data,
    select,
  }: {
    data: Pick<User, 'email' | 'name' | 'passwordHash'> & Partial<User>;
    select?: Select;
  }) => {
    const now = new Date();
    const user: User = {
      id: nextUserId++,
      role: 'USER',
      mustChangePassword: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    db.users.push(user);
    return Promise.resolve(pick(user, select));
  }) as never);

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

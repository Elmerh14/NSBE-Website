import { describe, expect, it } from 'vitest';

import { loadConfig } from './config';

const SECRET = 'a'.repeat(32);
const DATABASE_URL = 'postgresql://user:pass@host.neon.tech/neondb?sslmode=require';
const REQUIRED = { DATABASE_URL, JWT_SECRET: SECRET };

describe('loadConfig', () => {
  it('applies defaults', () => {
    expect(loadConfig(REQUIRED)).toEqual({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      LOG_LEVEL: 'info',
      DATABASE_URL,
      JWT_SECRET: SECRET,
    });
  });

  it('coerces PORT to a number', () => {
    expect(loadConfig({ ...REQUIRED, PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects a missing or short JWT_SECRET', () => {
    expect(() => loadConfig({ DATABASE_URL })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ DATABASE_URL, JWT_SECRET: 'short' })).toThrow(
      /at least 32 characters/,
    );
  });

  it('rejects a missing or non-postgres DATABASE_URL', () => {
    expect(() => loadConfig({ JWT_SECRET: SECRET })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ JWT_SECRET: SECRET, DATABASE_URL: 'https://example.com' })).toThrow(
      /postgres/,
    );
  });
});

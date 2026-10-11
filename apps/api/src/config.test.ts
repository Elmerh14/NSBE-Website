import { describe, expect, it } from 'vitest';

import { loadConfig } from './config';

const SECRET = 'a'.repeat(32);

describe('loadConfig', () => {
  it('applies defaults', () => {
    expect(loadConfig({ JWT_SECRET: SECRET })).toEqual({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      LOG_LEVEL: 'info',
      JWT_SECRET: SECRET,
    });
  });

  it('coerces PORT to a number', () => {
    expect(loadConfig({ JWT_SECRET: SECRET, PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects a missing or short JWT_SECRET', () => {
    expect(() => loadConfig({})).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ JWT_SECRET: 'short' })).toThrow(/at least 32 characters/);
  });
});

import type { Config } from './config';

// Config for buildApp() in tests; never read from the real .env.
export const TEST_CONFIG: Config = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: 0,
  LOG_LEVEL: 'silent',
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
};

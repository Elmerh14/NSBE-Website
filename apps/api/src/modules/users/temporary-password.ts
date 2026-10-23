import { randomBytes } from 'node:crypto';

// 18 random bytes -> 24 URL-safe characters (144 bits): not guessable, easy to copy.
// Used for new users and password resets; the user must replace it on first login.
export function generateTemporaryPassword(): string {
  return randomBytes(18).toString('base64url');
}

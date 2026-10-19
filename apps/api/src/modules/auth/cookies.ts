// Cookie names shared by app.ts (JWT plugin config) and the auth routes.
// Kept out of app.ts so feature modules don't import app.ts, which imports them back.
export const ACCESS_TOKEN_COOKIE = 'access_token';

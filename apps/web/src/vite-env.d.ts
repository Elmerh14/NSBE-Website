/// <reference types="vite/client" />

// Types for the VITE_* env vars the public site reads (see .env.example).
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- merges into Vite's interface
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

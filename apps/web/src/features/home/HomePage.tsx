import { SITE_MISSION, SITE_NAME } from '../layout/site';

// Placeholder until the home page is built: hero, mission, upcoming events, sponsors strip.
export function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-24">
      <title>{SITE_NAME}</title>
      <h1 className="text-4xl font-bold md:text-5xl">Welcome to {SITE_NAME}</h1>
      <p className="text-muted-foreground max-w-2xl text-lg">{SITE_MISSION}</p>
    </div>
  );
}

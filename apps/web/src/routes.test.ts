import { describe, expect, it } from 'vitest';

import { PAGES } from './features/layout/site';
import { routes } from './routes';

describe('routes', () => {
  it('has a route for every page in PAGES, so no nav link leads to "Page not found"', () => {
    const paths = (routes[0]?.children ?? []).map((route) => route.path);
    for (const page of Object.values(PAGES)) {
      expect(paths).toContain(page.path);
    }
  });
});

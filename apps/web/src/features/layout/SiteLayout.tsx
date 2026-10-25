import { Outlet, ScrollRestoration } from 'react-router';

import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

// The frame around every public page: header, the page, footer pushed to the bottom.
export function SiteLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      {/* Start each new page at the top, as a normal website does. */}
      <ScrollRestoration />
    </div>
  );
}

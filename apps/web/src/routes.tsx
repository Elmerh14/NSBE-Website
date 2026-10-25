import type { RouteObject } from 'react-router';

import { HomePage } from './features/home/HomePage';
import { PAGES } from './features/layout/site';
import { SiteLayout } from './features/layout/SiteLayout';
import { ComingSoonPage } from './features/pages/ComingSoonPage';
import { NotFoundPage } from './features/pages/NotFoundPage';

// Every public page sits inside SiteLayout (header + footer). When you build a page, swap its
// ComingSoonPage for your component, e.g. { path: PAGES.events.path, Component: EventsPage }.
export const routes: RouteObject[] = [
  {
    Component: SiteLayout,
    children: [
      { path: PAGES.home.path, Component: HomePage },
      { path: PAGES.about.path, element: <ComingSoonPage page={PAGES.about} /> },
      { path: PAGES.leadership.path, element: <ComingSoonPage page={PAGES.leadership} /> },
      { path: PAGES.programs.path, element: <ComingSoonPage page={PAGES.programs} /> },
      { path: PAGES.events.path, element: <ComingSoonPage page={PAGES.events} /> },
      { path: PAGES.gallery.path, element: <ComingSoonPage page={PAGES.gallery} /> },
      { path: PAGES.sponsors.path, element: <ComingSoonPage page={PAGES.sponsors} /> },
      { path: PAGES.contact.path, element: <ComingSoonPage page={PAGES.contact} /> },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

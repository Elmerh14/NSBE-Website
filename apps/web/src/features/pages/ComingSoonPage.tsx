import { Button } from '@nsbe/ui/components/button';
import { Link } from 'react-router';

import { SITE_NAME, type SitePage } from '../layout/site';

type ComingSoonPageProps = {
  page: SitePage;
};

// Stands in for a page that isn't built yet. Replace its route in routes.tsx when it is.
export function ComingSoonPage({ page }: ComingSoonPageProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <title>{`${page.title} | ${SITE_NAME}`}</title>
      <h1 className="text-3xl font-bold">{page.title}</h1>
      <p className="text-muted-foreground">This page is coming soon.</p>
      <Button variant="outline" asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
